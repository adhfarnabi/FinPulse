import * as dotenv from 'dotenv';
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 4000),
  MONGODB_URI: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/finpulse',
  KAFKA_BROKERS: (process.env.KAFKA_BROKERS ?? 'localhost:9092').split(',').map((s) => s.trim()),
  KAFKA_CLIENT_ID: process.env.KAFKA_CLIENT_ID ?? 'finpulse-server',
  FRONTEND_URL: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  JWT_SECRET: process.env.JWT_SECRET ?? '',
  MARKET_DATA_API_KEY: process.env.MARKET_DATA_API_KEY ?? '',
  MARKET_DATA_API_URL: process.env.MARKET_DATA_API_URL ?? '',
  MARKET_DATA_PROVIDER: (process.env.MARKET_DATA_PROVIDER ?? 'demo').toLowerCase(),
};

export const isLiveDataConfigured =
  env.MARKET_DATA_PROVIDER === 'yahoo' || Boolean(env.MARKET_DATA_API_KEY && env.MARKET_DATA_API_URL);

if (!env.JWT_SECRET && env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be set in production');
}
