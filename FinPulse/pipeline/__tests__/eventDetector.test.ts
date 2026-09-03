import { detectEvents, DetectionContext } from '../src/processors/eventDetector';

const emptyCtx: DetectionContext = { recentAverageVolume: null, historicalHigh: null, historicalLow: null };

describe('detectEvents', () => {
  it('always includes PRICE_UPDATE', () => {
    const events = detectEvents(
      { symbol: 'RELIANCE', price: 1410, previousPrice: 1400, volume: 1000, timestamp: new Date().toISOString() },
      emptyCtx,
    );
    expect(events.map((e) => e.eventType)).toContain('PRICE_UPDATE');
  });

  it('detects PRICE_SPIKE on the documented E2E scenario (1400 -> 1480, +5.71%)', () => {
    const events = detectEvents(
      { symbol: 'RELIANCE', price: 1480, previousPrice: 1400, volume: 1000, timestamp: new Date().toISOString() },
      emptyCtx,
    );
    const spike = events.find((e) => e.eventType === 'PRICE_SPIKE');
    expect(spike).toBeDefined();
    expect(spike!.severity).toBe('WARNING');
    expect(spike!.percentageChange).toBeCloseTo(5.7142857, 5);
  });

  it('does NOT detect PRICE_SPIKE for a move under the 5% threshold', () => {
    const events = detectEvents(
      { symbol: 'TCS', price: 1440, previousPrice: 1400, volume: 1000, timestamp: new Date().toISOString() }, // +2.86%
      emptyCtx,
    );
    expect(events.find((e) => e.eventType === 'PRICE_SPIKE')).toBeUndefined();
  });

  it('detects PRICE_DROP below -5%', () => {
    const events = detectEvents(
      { symbol: 'INFY', price: 1300, previousPrice: 1400, volume: 1000, timestamp: new Date().toISOString() }, // -7.14%
      emptyCtx,
    );
    expect(events.find((e) => e.eventType === 'PRICE_DROP')).toBeDefined();
  });

  it('detects HIGH_VOLUME when volume exceeds 2x the recent average', () => {
    const ctx: DetectionContext = { recentAverageVolume: 1_000_000, historicalHigh: null, historicalLow: null };
    const events = detectEvents(
      { symbol: 'SBIN', price: 810, previousPrice: 808, volume: 2_500_000, timestamp: new Date().toISOString() },
      ctx,
    );
    expect(events.find((e) => e.eventType === 'HIGH_VOLUME')).toBeDefined();
  });

  it('does not flag HIGH_VOLUME under the 2x multiplier', () => {
    const ctx: DetectionContext = { recentAverageVolume: 1_000_000, historicalHigh: null, historicalLow: null };
    const events = detectEvents(
      { symbol: 'SBIN', price: 810, previousPrice: 808, volume: 1_500_000, timestamp: new Date().toISOString() },
      ctx,
    );
    expect(events.find((e) => e.eventType === 'HIGH_VOLUME')).toBeUndefined();
  });

  it('detects NEW_HIGH / NEW_LOW against historical bounds', () => {
    const ctx: DetectionContext = { recentAverageVolume: null, historicalHigh: 1450, historicalLow: 1380 };
    const high = detectEvents(
      { symbol: 'RELIANCE', price: 1460, previousPrice: 1440, volume: 1000, timestamp: new Date().toISOString() },
      ctx,
    );
    expect(high.find((e) => e.eventType === 'NEW_HIGH')).toBeDefined();

    const low = detectEvents(
      { symbol: 'RELIANCE', price: 1370, previousPrice: 1390, volume: 1000, timestamp: new Date().toISOString() },
      ctx,
    );
    expect(low.find((e) => e.eventType === 'NEW_LOW')).toBeDefined();
  });

  it('detects PRICE_TARGET when a configured target rule matches', () => {
    const ctx: DetectionContext = {
      recentAverageVolume: null,
      historicalHigh: null,
      historicalLow: null,
      priceTargets: [{ threshold: 1500, operator: '>=' }],
    };
    const events = detectEvents(
      { symbol: 'RELIANCE', price: 1500, previousPrice: 1490, volume: 1000, timestamp: new Date().toISOString() },
      ctx,
    );
    expect(events.find((e) => e.eventType === 'PRICE_TARGET')).toBeDefined();
  });

  it('never throws when previousPrice is 0', () => {
    expect(() =>
      detectEvents({ symbol: 'ITC', price: 460, previousPrice: 0, volume: 1000, timestamp: new Date().toISOString() }, emptyCtx),
    ).not.toThrow();
  });
});
