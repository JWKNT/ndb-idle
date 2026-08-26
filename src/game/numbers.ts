import Decimal from "break_eternity.js";

export type GameAmount = Decimal;

export function amount(value: Decimal | number | string): Decimal {
  return value instanceof Decimal ? value : new Decimal(value);
}
export function formatAmount(value: Decimal): string {
  if (value.lt(1_000)) return value.toFixed(1);
  if (value.lt(1_000_000)) {
    return value.toNumber().toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
  return value.toExponential(2).replace("e+", "e");
}

export function formatWholeAmount(value: Decimal): string {
  if (value.lt(1_000_000)) return value.toFixed(0);
  return value.toExponential(2).replace("e+", "e");
}
