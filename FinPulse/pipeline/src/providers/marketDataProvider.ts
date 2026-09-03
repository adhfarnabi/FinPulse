import { MarketDataSource } from '../../../shared/types/events';

export interface RawQuote {
  symbol: string;
  exchange: 'NSE' | 'BSE';
  price: number;
  previousPrice: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
}

/**
 * Every market data source (demo simulator, or a real broker/data-vendor API)
 * implements this interface. The producer only ever talks to `MarketDataProvider`,
 * never to a concrete API, so swapping/adding providers never touches producer code.
 */
export interface MarketDataProvider {
  readonly source: MarketDataSource;
  /** Fetch the latest quote for every tracked symbol. */
  fetchQuotes(symbols: readonly string[]): Promise<RawQuote[]>;
  /**
   * Optional: fetch index quotes (NIFTY 50 / SENSEX). Providers that don't support
   * index data simply omit this method — the producer checks for it before calling.
   */
  fetchIndices?(): Promise<RawQuote[]>;
}
