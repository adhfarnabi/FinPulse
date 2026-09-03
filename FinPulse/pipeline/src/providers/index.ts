import { env, hasLiveCredentials, useYahooProvider } from '../config/env';
import { MarketDataProvider } from './marketDataProvider';
import { DemoMarketDataProvider } from './demoProvider';
import { LiveMarketDataProvider } from './liveProvider';
import { YahooFinanceProvider } from './yahooFinanceProvider';

export function createMarketDataProvider(): MarketDataProvider {
  if (useYahooProvider) {
    // eslint-disable-next-line no-console
    console.log('[provider] MARKET_DATA_PROVIDER=yahoo — using YahooFinanceProvider (real NSE data + indices)');
    return new YahooFinanceProvider();
  }
  if (hasLiveCredentials) {
    // eslint-disable-next-line no-console
    console.log('[provider] LIVE credentials detected — using LiveMarketDataProvider');
    return new LiveMarketDataProvider(env.MARKET_DATA_API_URL, env.MARKET_DATA_API_KEY);
  }
  // eslint-disable-next-line no-console
  console.log('[provider] No live provider configured — using DemoMarketDataProvider (source="demo")');
  return new DemoMarketDataProvider();
}

export * from './marketDataProvider';
