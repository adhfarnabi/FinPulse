import { MarketDataProvider, RawQuote } from './marketDataProvider';

/**
 * Generic REST adapter for a live market-data vendor.
 *
 * HONESTY NOTE: no specific vendor/API contract was given, so this talks to
 * `MARKET_DATA_API_URL` with a conventional `?symbols=A,B,C` + `Authorization: Bearer <key>`
 * shape and expects an array of `{ symbol, price, previousClose, open, high, low, volume }`
 * objects back. Before using this in production, adapt `parseResponse()` to whatever
 * vendor you actually integrate (e.g. NSE data vendor, broker API, etc.) — this class
 * is a real, wired-up implementation, but it has not been exercised against a real
 * upstream API in this environment (no network egress to arbitrary hosts here).
 */
export class LiveMarketDataProvider implements MarketDataProvider {
  readonly source = 'live' as const;

  constructor(
    private readonly apiUrl: string,
    private readonly apiKey: string,
  ) {}

  async fetchQuotes(symbols: readonly string[]): Promise<RawQuote[]> {
    const url = `${this.apiUrl}?symbols=${encodeURIComponent(symbols.join(','))}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });

    if (!res.ok) {
      throw new Error(`Live market data provider responded with ${res.status}`);
    }

    const body = (await res.json()) as unknown;
    return this.parseResponse(body);
  }

  private parseResponse(body: unknown): RawQuote[] {
    if (!Array.isArray(body)) {
      throw new Error('Unexpected live provider response shape (expected an array)');
    }

    return body
      .map((raw: any): RawQuote | null => {
        if (
          typeof raw?.symbol !== 'string' ||
          typeof raw?.price !== 'number' ||
          typeof raw?.previousClose !== 'number'
        ) {
          return null; // skip malformed entries rather than crash the whole batch
        }
        return {
          symbol: raw.symbol,
          exchange: raw.exchange === 'BSE' ? 'BSE' : 'NSE',
          price: raw.price,
          previousPrice: raw.previousClose,
          openPrice: raw.open ?? raw.price,
          highPrice: raw.high ?? raw.price,
          lowPrice: raw.low ?? raw.price,
          volume: raw.volume ?? 0,
        };
      })
      .filter((q): q is RawQuote => q !== null);
  }
}
