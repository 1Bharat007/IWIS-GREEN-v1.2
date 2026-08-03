/**
 * money.ts
 *
 * Money precision helper for rounding monetary calculations to exactly
 * 2 decimal places, eliminating floating-point arithmetic drift in database
 * records, payments, platform fees, and user earnings.
 */

export function roundMoney(value: number): number {
  if (typeof value !== "number" || isNaN(value)) {
    return 0;
  }
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
