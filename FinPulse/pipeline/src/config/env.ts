import * as dotenv from 'dotenv';
dotenv.config();

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  MONGODB_URI: required('MONGODB_URI', 'mongodb://localhost:27017/finpulse'),
  KAFKA_BROKERS: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(',').map((s) => s.trim()),
  KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID ?? 'finpulse-pipeline',
  KAFKA_GROUP_ID: process.env.KAFKA_GROUP_ID ?? 'finpulse-consumer-group',
  MARKET_DATA_INTERVAL_SECONDS: Number(process.env.MARKET_DATA_INTERVAL_SECONDS ?? 5),
  MARKET_DATA_API_KEY: process.env.MARKET_DATA_API_KEY ?? '',
  MARKET_DATA_API_URL: process.env.MARKET_DATA_API_URL ?? '',
  // 'demo' (default) | 'yahoo' (free, no-key NSE/BSE + index data) | anything else falls through
  // to the generic LiveMarketDataProvider if MARKET_DATA_API_KEY/URL are set.
  MARKET_DATA_PROVIDER: (process.env.MARKET_DATA_PROVIDER ?? 'demo').toLowerCase(),
};

/** True only when a live provider is actually configured. Never assume live. */
export const hasLiveCredentials = Boolean(env.MARKET_DATA_API_KEY && env.MARKET_DATA_API_URL);
export const useYahooProvider = env.MARKET_DATA_PROVIDER === 'yahoo';
