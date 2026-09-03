/**
 * Shared event schema types.
 * These are the contracts published on Kafka topics: market-data, market-events, alerts.
 * Keep this file framework-agnostic (no Mongoose/Express types) so it can be
 * imported by pipeline/, server/, and client/ alike.
 */

export type MarketDataSource = 'demo' | 'live';

export type EventType =
  | 'PRICE_UPDATE'
  | 'PRICE_SPIKE'
  | 'PRICE_DROP'
  | 'HIGH_VOLUME'
  | 'NEW_HIGH'
  | 'NEW_LOW'
  | 'PRICE_TARGET';

export type EventSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

/** Payload published to the `market-data` topic by the producer. */
export interface MarketDataEvent {
  eventId: string;
  eventType: 'PRICE_UPDATE';
  symbol: string;
  exchange: 'NSE' | 'BSE';
  price: number;
  previousPrice: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  volume: number;
  currency: 'INR';
  timestamp: string; // ISO-8601
  source: MarketDataSource;
}

/** Payload published to the `market-events` topic by the processor after detection. */
export interface MarketDetectedEvent {
  eventId: string;
  eventType: EventType;
  symbol: string;
  price: number;
  previousPrice: number;
  percentageChange: number;
  volume: number;
  severity: EventSeverity;
  metadata: Record<string, unknown>;
  timestamp: string;
}

/** Payload published to the `alerts` topic by the alert engine. */
export interface AlertEvent {
  alertId: string;
  eventId: string;
  symbol: string;
  alertType: EventType;
  message: string;
  severity: EventSeverity;
  triggeredAt: string;
}

export const KAFKA_TOPICS = {
  MARKET_DATA: 'market-data',
  MARKET_EVENTS: 'market-events',
  ALERTS: 'alerts',
  MARKET_DATA_DLQ: 'market-data-dlq',
} as const;

export const TRACKED_SYMBOLS = [
  'RELIANCE',
  'TCS',
  'INFY',
  'HDFCBANK',
  'ICICIBANK',
  'SBIN',
  'ITC',
  'LT',
] as const;

export type TrackedSymbol = (typeof TRACKED_SYMBOLS)[number];

/** Basic runtime validation for a MarketDataEvent. Returns list of errors (empty = valid). */
export function validateMarketDataEvent(payload: unknown): string[] {
  const errors: string[] = [];
  if (typeof payload !== 'object' || payload === null) {
    return ['payload is not an object'];
  }
  const p = payload as Record<string, unknown>;

  if (typeof p.eventId !== 'string' || p.eventId.length === 0) errors.push('eventId missing/invalid');
  if (p.eventType !== 'PRICE_UPDATE') errors.push('eventType must be PRICE_UPDATE');
  if (typeof p.symbol !== 'string' || p.symbol.length === 0) errors.push('symbol missing/invalid');
  if (p.exchange !== 'NSE' && p.exchange !== 'BSE') errors.push('exchange must be NSE or BSE');
  if (typeof p.price !== 'number' || !isFinite(p.price) || p.price < 0) errors.push('price invalid');
  if (typeof p.previousPrice !== 'number' || !isFinite(p.previousPrice) || p.previousPrice < 0) errors.push('previousPrice invalid');
  if (typeof p.openPrice !== 'number' || !isFinite(p.openPrice)) errors.push('openPrice invalid');
  if (typeof p.highPrice !== 'number' || !isFinite(p.highPrice)) errors.push('highPrice invalid');
  if (typeof p.lowPrice !== 'number' || !isFinite(p.lowPrice)) errors.push('lowPrice invalid');
  if (typeof p.volume !== 'number' || !isFinite(p.volume) || p.volume < 0) errors.push('volume invalid');
  if (p.currency !== 'INR') errors.push('currency must be INR');
  if (typeof p.timestamp !== 'string' || isNaN(Date.parse(p.timestamp))) errors.push('timestamp invalid');
  if (p.source !== 'demo' && p.source !== 'live') errors.push('source must be demo or live');

  return errors;
}
