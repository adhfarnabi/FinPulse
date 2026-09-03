import { MarketDataProvider, RawQuote } from './marketDataProvider';

/**
 * HONESTY NOTE: query1.finance.yahoo.com is Yahoo's public chart/quote endpoint. It is
 * NOT an officially documented or supported API — Yahoo could change its response shape
 * or start rate-limiting/blocking requests at any time without notice. It requires no API
 * key, which is what makes it usable for a project like this without a paid data vendor
 * contract. This has NOT been exercised against the live endpoint in the environment this
 * was built in (that sandbox only allows outbound requests to package registries) — this
 * is real, best-effort code based on the endpoint's well-documented public shape, but you
 * are effectively the first real test of it. If Yahoo has changed the response shape,
 * `parseChartResponse()` below is the one place to fix it.
 *
 * For anything beyond personal/dev use, a licensed vendor (e.g. a broker's market-data
 * API — Zerodha Kite Connect, Upstox, etc. — or a paid data vendor) is the correct choice.
 */

const YAHOO_CHART_URL = 'https://query1.finance.yahoo.com/v8/finance/chart';

// NSE tickers need a ".NS" suffix on Yahoo; BSE would be ".BO". This app tracks NSE only.
const YAHOO_SUFFIX = '.NS';

// Yahoo's own symbols for the two Indian benchmark indices.
const INDEX_SYMBOLS: { yahooSymbol: string; symbol: string; exchange: 'NSE' | 'BSE' }[] = [
  { yahooSymbol: '%5ENSEI', symbol: 'NIFTY50', exchange: 'NSE' }, // ^NSEI, URL-encoded
  { yahooSymbol: '%5EBSESN', symbol: 'SENSEX', exchange: 'BSE' }, // ^BSESN, URL-encoded
];

interface YahooChartMeta {
  regularMarketPrice?: number;
  previousClose?: number;
  chartPreviousClose?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketOpen?: number;
  regularMarketVolume?: number;
}

interface YahooChartResponse {
  chart: {
    result: {
      meta: YahooChartMeta;
      indicators?: { quote?: { open?: number[]; high?: number[]; low?: number[]; volume?: number[] }[] };
    }[];
    error: unknown;
  };
}

async function fetchYahooChart(yahooSymbol: string): Promise<YahooChartMeta | null> {
  const url = `${YAHOO_CHART_URL}/${yahooSymbol}?range=1d&interval=5m`;
  const res = await fetch(url, {
    headers: {
      // Yahoo's endpoint tends to reject requests with no User-Agent at all.
      'User-Agent': 'Mozilla/5.0 (compatible; FinPulse/1.0)',
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`Yahoo Finance responded ${res.status} for ${yahooSymbol}`);
  }

  const body = (await res.json()) as YahooChartResponse;
  const result = body?.chart?.result?.[0];
  if (!result?.meta) return null;
  return result.meta;
}

function metaToQuote(symbol: string, exchange: 'NSE' | 'BSE', meta: YahooChartMeta): RawQuote | null {
  const price = meta.regularMarketPrice;
  const previousClose = meta.previousClose ?? meta.chartPreviousClose;

  if (typeof price !== 'number' || typeof previousClose !== 'number') return null;

  return {
    symbol,
    exchange,
    price,
    previousPrice: previousClose,
    openPrice: meta.regularMarketOpen ?? price,
    highPrice: meta.regularMarketDayHigh ?? price,
    lowPrice: meta.regularMarketDayLow ?? price,
    volume: meta.regularMarketVolume ?? 0,
  };
}

export class YahooFinanceProvider implements MarketDataProvider {
  readonly source = 'live' as const;

  async fetchQuotes(symbols: readonly string[]): Promise<RawQuote[]> {
    const results = await Promise.allSettled(
      symbols.map(async (symbol) => {
        const meta = await fetchYahooChart(`${symbol}${YAHOO_SUFFIX}`);
        return meta ? metaToQuote(symbol, 'NSE', meta) : null;
      }),
    );

    const quotes: RawQuote[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) quotes.push(r.value);
      // rejected/null entries are silently skipped — a single symbol failing (e.g. a
      // transient Yahoo hiccup) should never take down the whole tick.
    }
    return quotes;
  }

  async fetchIndices(): Promise<RawQuote[]> {
    const results = await Promise.allSettled(
      INDEX_SYMBOLS.map(async ({ yahooSymbol, symbol, exchange }) => {
        const meta = await fetchYahooChart(yahooSymbol);
        return meta ? metaToQuote(symbol, exchange, meta) : null;
      }),
    );

    const quotes: RawQuote[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) quotes.push(r.value);
    }
    return quotes;
  }
}
