/**
 * Pure, framework-free financial math helpers.
 * These are unit-tested directly (see pipeline/__tests__/finance.test.ts) and
 * imported by the event-detection engine so the formula lives in exactly one place.
 */

/**
 * ((current - previous) / previous) * 100
 * Returns 0 when previousPrice is 0/undefined/invalid instead of throwing or returning
 * Infinity/NaN, since a bad previousPrice must never crash the consumer.
 */
export function percentageChange(current: number, previous: number): number {
  if (!isFinite(current) || !isFinite(previous)) return 0;
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/** currentValue - investedValue, safe against non-finite inputs. */
export function profitAndLoss(currentValue: number, investedValue: number): number {
  if (!isFinite(currentValue) || !isFinite(investedValue)) return 0;
  return currentValue - investedValue;
}

/** pnl / investedValue * 100, 0 when investedValue is 0. */
export function returnPercentage(pnl: number, investedValue: number): number {
  if (!isFinite(pnl) || !isFinite(investedValue)) return 0;
  if (investedValue === 0) return 0;
  return (pnl / investedValue) * 100;
}

export function investedValue(quantity: number, averagePrice: number): number {
  return quantity * averagePrice;
}

export function currentValue(quantity: number, currentPrice: number): number {
  return quantity * currentPrice;
}
