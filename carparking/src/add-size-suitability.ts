import type { Space, VehicleDimensions } from "./type.js";

export const SizeSuitability = {
  PERFECT_FIT: 1,
  MARGINAL_FIT: 2,
  NOT_FIT: -1,
};

/**
 * 駐車スペースの値がnullまたは0の場合の安全な比較
 * nullまたは0の場合は比較をスキップ（trueを返す）
 */
function safeCompare(
  vehicleValue: number | null,
  spaceValue: number | null
): boolean {
  if (vehicleValue === null || spaceValue === null || spaceValue === 0)
    return true;
  return vehicleValue <= spaceValue;
}

/**
 * 絶対に入る判定
 * 車両の全サイズ項目のmin値とmax値が駐車スペースより小さい
 */
function isDefinitelyFits(vehicle: VehicleDimensions, space: Space): boolean {
  return (
    safeCompare(vehicle.length?.min ?? null, space.length) &&
    safeCompare(vehicle.width?.min ?? null, space.width) &&
    safeCompare(vehicle.height?.min ?? null, space.height) &&
    safeCompare(vehicle.weight?.min ?? null, space.weight) &&
    safeCompare(vehicle.length?.max ?? null, space.length) &&
    safeCompare(vehicle.width?.max ?? null, space.width) &&
    safeCompare(vehicle.height?.max ?? null, space.height) &&
    safeCompare(vehicle.weight?.max ?? null, space.weight)
  );
}

/**
 * もしかしたら入る判定
 * 車両の全サイズ項目のmin値が駐車スペースより小さいが、いずれかのmax値が駐車スペースより大きい
 */
function isMaybeFits(vehicle: VehicleDimensions, space: Space): boolean {
  const allMinValuesFit =
    safeCompare(vehicle.length?.min ?? null, space.length) &&
    safeCompare(vehicle.width?.min ?? null, space.width) &&
    safeCompare(vehicle.height?.min ?? null, space.height) &&
    safeCompare(vehicle.weight?.min ?? null, space.weight);

  const anyMaxValueExceeds =
    !safeCompare(vehicle.length?.max ?? null, space.length) ||
    !safeCompare(vehicle.width?.max ?? null, space.width) ||
    !safeCompare(vehicle.height?.max ?? null, space.height) ||
    !safeCompare(vehicle.weight?.max ?? null, space.weight);

  return allMinValuesFit && anyMaxValueExceeds;
}

/**
 * 絶対に入らない判定
 * 一つでも車両のmin値が駐車スペースより大きい
 */
function isDefinitelyNotFits(
  vehicle: VehicleDimensions,
  space: Space
): boolean {
  return (
    !safeCompare(vehicle.length?.min ?? null, space.length) ||
    !safeCompare(vehicle.width?.min ?? null, space.width) ||
    !safeCompare(vehicle.height?.min ?? null, space.height) ||
    !safeCompare(vehicle.weight?.min ?? null, space.weight)
  );
}

/**
 * 一つのスペースに対してsizeSuitabilityを計算
 * @returns 1: 絶対に入る, 2: もしかしたら入る, -1: 絶対に入らない
 */
function calculateSizeSuitability(
  vehicle: VehicleDimensions,
  space: Space
): number {
  if (isDefinitelyNotFits(vehicle, space)) {
    return SizeSuitability.NOT_FIT; // 絶対に入らない
  }

  if (isDefinitelyFits(vehicle, space)) {
    return SizeSuitability.PERFECT_FIT; // 絶対に入る
  }

  if (isMaybeFits(vehicle, space)) {
    return SizeSuitability.MARGINAL_FIT; // もしかしたら入る
  }

  return SizeSuitability.NOT_FIT; // その他の場合は絶対に入らない
}

/**
 * Space に sizeSuitability を追加する
 */
export function addSizeSuitabilityToSpace(
  space: Space,
  vehicleDimensions: VehicleDimensions
) {
  return {
    ...space,
    sizeSuitability: calculateSizeSuitability(vehicleDimensions, space),
  };
}
