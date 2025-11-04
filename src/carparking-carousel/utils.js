export const ROOF_ENUM = {
    INDOOR: 1,    // 屋内
    OUTDOOR: 2,   // 屋外
};

export function decodeBigQueryDecimal(obj) {
  const { s, e, c } = obj;
  const numStr = c.join("");
  const decimalPosition = e + 1;
  const integerPart = numStr.slice(0, decimalPosition);
  const decimalPart = numStr.slice(decimalPosition);
  const value = Number(
    `${s < 0 ? "-" : ""}${integerPart || "0"}.${decimalPart}`
  );
  return value;
}
