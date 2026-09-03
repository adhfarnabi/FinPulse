import { percentageChange, profitAndLoss, returnPercentage, investedValue, currentValue } from '../../shared/utils/finance';

describe('percentageChange', () => {
  it('computes the documented E2E test case: 1400 -> 1480 is +5.71%', () => {
    expect(percentageChange(1480, 1400)).toBeCloseTo(5.7142857, 5);
  });

  it('returns 0 when previousPrice is 0 instead of Infinity/NaN', () => {
    expect(percentageChange(100, 0)).toBe(0);
  });

  it('returns 0 for non-finite inputs instead of throwing', () => {
    expect(percentageChange(NaN, 100)).toBe(0);
    expect(percentageChange(100, Infinity)).toBe(0);
  });

  it('computes a negative change correctly', () => {
    expect(percentageChange(950, 1000)).toBeCloseTo(-5, 5);
  });
});

describe('portfolio math', () => {
  it('computes invested and current value', () => {
    expect(investedValue(20, 1320)).toBe(26400);
    expect(currentValue(20, 1425.6)).toBeCloseTo(28512, 5);
  });

  it('computes P&L and return percentage', () => {
    const invested = investedValue(20, 1320);
    const current = currentValue(20, 1425.6);
    const pnl = profitAndLoss(current, invested);
    expect(pnl).toBeCloseTo(2112, 5);
    expect(returnPercentage(pnl, invested)).toBeCloseTo(8.0, 1);
  });

  it('returns 0 return percentage when invested value is 0 (no divide-by-zero crash)', () => {
    expect(returnPercentage(500, 0)).toBe(0);
  });
});
