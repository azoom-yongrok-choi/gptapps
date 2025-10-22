import type { AvailableTerm, ContractTerm, Room } from "./type.js";
import { addDays, format, isAfter, isBefore, isEqual, subDays } from "date-fns";

const SubleaseContractStatus = {
  BEFORE_CONTRACT: 1,
  UNDER_CONTRACT: 2,
  END: 3,
  END_SCHEDULED: 4,
  CANCEL: -1,
};

// 境界調整値
const BOUNDARY_ADJUSTMENT = 1;

// ========================================================================================
// Domain Types
// ========================================================================================

/**
 * ISO日付文字列型 (YYYY-MM-DD形式)
 */
type ISODateString = string;

/**
 * 日付期間を表す基本型
 */
interface DateTerm {
  readonly startDate: ISODateString;
  readonly endDate: ISODateString | null;
}

// ========================================================================================
// Pure Functions
// ========================================================================================

/**
 * 日付文字列を正規化する（DATETIME形式をDATE形式に変換）
 */
function normalizeDateString(dateStr: any): string {
  if (!dateStr) {
    throw new Error(`Null/undefined date string: ${dateStr}`);
  }

  // BigQueryのDATE/DATETIMEオブジェクトの場合、valueプロパティをチェック
  if (typeof dateStr === "object" && dateStr.value) {
    dateStr = dateStr.value;
  }

  // 文字列に変換
  const dateString = String(dateStr);

  if (dateString.includes("T")) {
    return dateString.split("T")[0];
  }
  return dateString;
}

/**
 * 日付をISO文字列に変換する
 */
function formatDate(date: Date): ISODateString {
  if (Number.isNaN(date.getTime())) {
    throw new TypeError(`Invalid Date object: ${date}`);
  }
  return format(date, "yyyy-MM-dd");
}

/**
 * マスターリース制約を適用して案内可能期間を作成する
 */
function applyMasterLeaseConstraints(
  startDate: ISODateString,
  endDate: ISODateString | null,
  masterLeaseTerm: DateTerm
): AvailableTerm | null {
  const adjustedStartDate =
    masterLeaseTerm.startDate && isBefore(startDate, masterLeaseTerm.startDate)
      ? masterLeaseTerm.startDate
      : startDate;

  const adjustedEndDate =
    endDate &&
    masterLeaseTerm.endDate &&
    isAfter(endDate, masterLeaseTerm.endDate)
      ? masterLeaseTerm.endDate
      : endDate;

  // 開始日が終了日より後の場合は無効（endDateがnullの場合は有効）
  if (adjustedEndDate && isAfter(adjustedStartDate, adjustedEndDate)) {
    return null;
  }

  return {
    startDate: adjustedStartDate,
    endDate: adjustedEndDate,
  };
}

/**
 * 契約が存在しない場合の案内可能期間を作成
 */
function createNoContractAvailableTerm(
  currentDate: ISODateString,
  masterLeaseTerm: DateTerm
): AvailableTerm {
  const adjustedStartDate =
    masterLeaseTerm.startDate &&
    isBefore(currentDate, masterLeaseTerm.startDate)
      ? masterLeaseTerm.startDate
      : currentDate;

  return {
    startDate: adjustedStartDate,
    endDate: masterLeaseTerm.endDate,
  };
}

/**
 * 最初の契約前の案内可能期間を作成
 */
function createInitialAvailableTerm(
  contractTerms: readonly ContractTerm[],
  currentDate: ISODateString,
  masterLeaseTerm: DateTerm
): AvailableTerm | null {
  if (contractTerms.length === 0) return null;

  const firstContract = contractTerms[0];
  const firstTermStartDate = firstContract.startDate;

  if (!isAfter(firstTermStartDate, currentDate)) {
    return null;
  }

  const firstTermStartDateMinus1 = subDays(
    new Date(normalizeDateString(firstContract.startDate)),
    BOUNDARY_ADJUSTMENT
  );
  const endDate = format(firstTermStartDateMinus1, "yyyy-MM-dd");

  return applyMasterLeaseConstraints(currentDate, endDate, masterLeaseTerm);
}

/**
 * 契約間の隙間期間から案内可能期間を作成
 */
function createGapAvailableTerms(
  contractTerms: readonly ContractTerm[],
  masterLeaseTerm: DateTerm
): AvailableTerm[] {
  const gapTerms: AvailableTerm[] = [];

  for (let i = 0; i < contractTerms.length - 1; i++) {
    const currentTerm = contractTerms[i];
    const nextTerm = contractTerms[i + 1];

    if (!currentTerm.endDate) {
      continue;
    }

    const gapStartDate = addDays(
      new Date(normalizeDateString(currentTerm.endDate)),
      BOUNDARY_ADJUSTMENT
    );
    const gapEndDate = subDays(
      new Date(normalizeDateString(nextTerm.startDate)),
      BOUNDARY_ADJUSTMENT
    );

    const gapTerm = applyMasterLeaseConstraints(
      formatDate(gapStartDate),
      formatDate(gapEndDate),
      masterLeaseTerm
    );

    if (gapTerm) {
      gapTerms.push(gapTerm);
    }
  }

  return gapTerms;
}

/**
 * 最後の契約後の案内可能期間を作成
 */
function createFinalAvailableTerm(
  contractTerms: readonly ContractTerm[],
  masterLeaseTerm: DateTerm
): AvailableTerm | null {
  if (contractTerms.length === 0) return null;

  const lastTerm = contractTerms[contractTerms.length - 1];

  const hasContractStartPending = contractTerms.some(
    (term) => term.status === SubleaseContractStatus.BEFORE_CONTRACT
  );

  if (hasContractStartPending || !lastTerm.endDate) {
    return null;
  }

  const lastTermEndDate = addDays(
    new Date(normalizeDateString(lastTerm.endDate)),
    BOUNDARY_ADJUSTMENT
  );
  const lastTermEndDateStr = formatDate(lastTermEndDate);

  return applyMasterLeaseConstraints(
    lastTermEndDateStr,
    masterLeaseTerm.endDate,
    masterLeaseTerm
  );
}

/**
 * 指定した日付時点で有効な契約を検索する
 * @param contractTerms - 契約期間の配列
 * @param currentDate - 検索基準日（YYYY-MM-DD形式）
 * @returns 該当する契約期間、見つからない場合はundefined
 */
function findActiveContract(
  contractTerms: readonly ContractTerm[],
  currentDate: ISODateString
): ContractTerm | undefined {
  return contractTerms.find(
    (term) =>
      (term.status === SubleaseContractStatus.UNDER_CONTRACT ||
        term.status === SubleaseContractStatus.END ||
        term.status === SubleaseContractStatus.END_SCHEDULED) &&
      (isBefore(term.startDate, currentDate) ||
        isEqual(term.startDate, currentDate)) &&
      term.endDate &&
      (isAfter(term.endDate, currentDate) || isEqual(term.endDate, currentDate))
  );
}

/**
 * 案内可能期間を計算する
 * @param contractTerms - 既存の契約期間リスト
 * @param masterLeaseTerm - マスターリース期間
 * @param currentDate - 計算基準日（YYYY-MM-DD形式）
 * @returns 案内可能な期間の配列
 */
function calculateAvailableTerms(
  contractTerms: readonly ContractTerm[],
  masterLeaseTerm: DateTerm,
  currentDate: ISODateString
): readonly AvailableTerm[] {
  // 契約が存在しない場合
  if (contractTerms.length === 0) {
    return [createNoContractAvailableTerm(currentDate, masterLeaseTerm)];
  }

  // 現在アクティブな契約がある場合は案内可能期間なし
  const activeContract = findActiveContract(contractTerms, currentDate);
  const isUnderContract =
    activeContract &&
    activeContract.status === SubleaseContractStatus.UNDER_CONTRACT;

  if (isUnderContract) {
    return [];
  }

  const availableTerms: AvailableTerm[] = [];

  // 1. 最初の契約前の期間
  const initialTerm = createInitialAvailableTerm(
    contractTerms,
    currentDate,
    masterLeaseTerm
  );
  if (initialTerm) {
    availableTerms.push(initialTerm);
  }

  // 2. 契約間の隙間期間
  const gapTerms = createGapAvailableTerms(contractTerms, masterLeaseTerm);
  availableTerms.push(...gapTerms);

  // 3. 最後の契約後の期間
  const finalTerm = createFinalAvailableTerm(contractTerms, masterLeaseTerm);
  if (finalTerm) {
    availableTerms.push(finalTerm);
  }

  return availableTerms;
}

// ========================================================================================
// Pipeline Functions
// ========================================================================================

/**
 * 契約期間をソートする
 */
function sortContractTermsByStartDate(
  contractTerms: readonly ContractTerm[]
): readonly ContractTerm[] {
  return [...contractTerms].sort((a, b) => {
    const dateA = new Date(normalizeDateString(a.startDate));
    const dateB = new Date(normalizeDateString(b.startDate));

    if (Number.isNaN(dateA.getTime()) || Number.isNaN(dateB.getTime())) {
      console.error("Invalid date in contract terms:", {
        a: a.startDate,
        b: b.startDate,
      });
      return 0;
    }

    return dateA.getTime() - dateB.getTime();
  });
}

/**
 * Room に案内可能期間を追加する
 */
export function addAvailableTermsToRoom(
  room: Room,
  currentDate: ISODateString
) {
  return {
    ...room,
    availableTerms: [
      ...calculateAvailableTerms(
        sortContractTermsByStartDate(room.contractTerms),
        { startDate: room.contractStartDate, endDate: room.contractEndDate },
        currentDate
      ),
    ],
  };
}

/**
 * Room を拡張する（サブリース可能な場合のみ）
 */
export function enrichRoomWithAvailableTerms(
  canSublease: boolean,
  currentDate: string
) {
  return (room: Room) =>
    canSublease ? addAvailableTermsToRoom(room, currentDate) : room;
}
