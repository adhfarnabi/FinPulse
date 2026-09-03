import { MarketDataProvider, RawQuote } from './marketDataProvider';

/**
 * Realistic starting prices for the initially-supported NSE instruments (₹, approximate).
 * These are only seed/base values for the simulator — never presented to users as live quotes.
 */
const BASE_PRICES: Record<string, number> = {
  RELIANCE: 1400,
  TCS: 3850,
  INFY: 1780,
  HDFCBANK: 1650,
  ICICIBANK: 1180,
  SBIN: 810,
  ITC: 460,
  LT: 3550,
};

const BASE_VOLUME: Record<string, number> = {
  RELIANCE: 6_500_000,
  TCS: 2_100_000,
  INFY: 4_800_000,
  HDFCBANK: 5_200_000,
  ICICIBANK: 5_900_000,
  SBIN: 9_100_000,
  ITC: 7_400_000,
  LT: 1_600_000,
};

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export class DemoMarketDataProvider implements MarketDataProvider {
  readonly source = 'demo' as const;

  // in-memory "last price" state so each tick evolves from the previous one
  private lastPrice = new Map<string, number>(Object.entries(BASE_PRICES));
  private dayOpen = new Map<string, number>(Object.entries(BASE_PRICES));
  private dayHigh = new Map<string, number>(Object.entries(BASE_PRICES));
  private dayLow = new Map<string, number>(Object.entries(BASE_PRICES));

  async fetchQuotes(symbols: readonly string[]): Promise<RawQuote[]> {
    return symbols.map((symbol) => this.tick(symbol));
  }

  private tick(symbol: string): RawQuote {
    const previousPrice = this.lastPrice.get(symbol) ?? BASE_PRICES[symbol] ?? 1000;

    // 90% of ticks: normal small movement (-1.2% to +1.2%)
    // 10% of ticks: a larger move (-7% to +7%) so PRICE_SPIKE/PRICE_DROP can be demonstrated
    const isBigMove = Math.random() < 0.1;
    const pctMove = isBigMove ? randomBetween(-7, 7) : randomBetween(-1.2, 1.2);
    let price = previousPrice * (1 + pctMove / 100);
    price = Math.round(price * 100) / 100;

    const open = this.dayOpen.get(symbol) ?? previousPrice;
    const prevHigh = this.dayHigh.get(symbol) ?? open;
    const prevLow = this.dayLow.get(symbol) ?? open;
    const high = Math.max(prevHigh, price);
    const low = Math.min(prevLow, price);

    this.lastPrice.set(symbol, price);
    this.dayHigh.set(symbol, high);
    this.dayLow.set(symbol, low);

    const baseVolume = BASE_VOLUME[symbol] ?? 1_000_000;
    // occasionally spike volume too, correlated-ish with big price moves
    const volumeFactor = isBigMove ? randomBetween(2, 4) : randomBetween(0.6, 1.3);
    const volume = Math.round(baseVolume * volumeFactor * randomBetween(0.9, 1.1));

    return {
      symbol,
      exchange: 'NSE',
      price,
      previousPrice,
      openPrice: open,
      highPrice: high,
      lowPrice: low,
      volume,
    };
  }
}
