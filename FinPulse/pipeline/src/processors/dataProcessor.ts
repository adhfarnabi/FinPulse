import { Producer } from 'kafkajs';
import { Stock, MarketData, Event, IEvent } from '../../../shared/models';
import { KAFKA_TOPICS, MarketDataEvent, MarketDetectedEvent } from '../../../shared/types/events';
import { detectEvents, DetectionContext } from './eventDetector';
import { evaluateAndCreateAlert } from '../services/alertEngine';
import { makeLogger } from '../services/logger';

const log = makeLogger('processor');

const RECENT_VOLUME_WINDOW = 20; // ticks used to compute the "recent average volume" baseline

const INDEX_SYMBOLS = new Set(['NIFTY50', 'SENSEX']);
const INDEX_DISPLAY_NAME: Record<string, string> = { NIFTY50: 'NIFTY 50', SENSEX: 'S&P BSE SENSEX' };

async function findOrCreateStock(msg: MarketDataEvent) {
  const existing = await Stock.findOne({ symbol: msg.symbol, exchange: msg.exchange });
  if (existing) return existing;

  const isIndex = INDEX_SYMBOLS.has(msg.symbol);
  return Stock.create({
    symbol: msg.symbol,
    companyName: isIndex ? INDEX_DISPLAY_NAME[msg.symbol] : msg.symbol, // placeholder display name until a company-name reference dataset is wired in
    exchange: msg.exchange,
    sector: isIndex ? 'Index' : 'Unknown',
    currency: 'INR',
    isActive: true,
  });
}

async function buildDetectionContext(symbol: string): Promise<DetectionContext> {
  const recent = await MarketData.find({ symbol }).sort({ timestamp: -1 }).limit(RECENT_VOLUME_WINDOW).lean();

  const recentAverageVolume =
    recent.length > 0
      ? recent.reduce((sum: number, d: any) => sum + (d.volume as number), 0) / recent.length
      : null;

  const highAgg = await MarketData.aggregate([{ $match: { symbol } }, { $group: { _id: null, max: { $max: '$price' } } }]);
  const lowAgg = await MarketData.aggregate([{ $match: { symbol } }, { $group: { _id: null, min: { $min: '$price' } } }]);

  return {
    recentAverageVolume,
    historicalHigh: highAgg[0]?.max ?? null,
    historicalLow: lowAgg[0]?.min ?? null,
  };
}

/**
 * Process one validated MarketDataEvent consumed from Kafka:
 * persist raw market data, detect derived events, persist + publish them, evaluate alerts.
 *
 * Returns only after everything is durably written — the consumer must not commit the
 * Kafka offset until this resolves successfully (see consumer/index.ts).
 */
export async function processMarketDataMessage(msg: MarketDataEvent, producer: Producer): Promise<void> {
  const stock = await findOrCreateStock(msg);

  // Idempotency guard at the MarketData layer: skip if we've already stored this exact tick.
  const alreadyStored = await MarketData.findOne({ symbol: msg.symbol, timestamp: new Date(msg.timestamp) }).lean();
  if (alreadyStored) {
    log.info('duplicate market-data tick, skipping persistence', { symbol: msg.symbol, timestamp: msg.timestamp });
  } else {
    const pctChange =
      msg.previousPrice === 0 ? 0 : ((msg.price - msg.previousPrice) / msg.previousPrice) * 100;

    await MarketData.create({
      stock: stock._id,
      symbol: msg.symbol,
      price: msg.price,
      openPrice: msg.openPrice,
      highPrice: msg.highPrice,
      lowPrice: msg.lowPrice,
      previousClose: msg.previousPrice,
      volume: msg.volume,
      currency: 'INR',
      percentageChange: pctChange,
      timestamp: new Date(msg.timestamp),
      source: msg.source,
    });
  }

  const ctx = await buildDetectionContext(msg.symbol);
  const detected = detectEvents(
    { symbol: msg.symbol, price: msg.price, previousPrice: msg.previousPrice, volume: msg.volume, timestamp: msg.timestamp },
    ctx,
  );

  for (const d of detected) {
    // Deterministic, idempotent event id: same source tick + event type always maps to the
    // same Event document, so re-delivery of the same Kafka message can never duplicate it.
    const eventId = `${msg.eventId}:${d.eventType}`;

    let eventDoc: IEvent | null;
    try {
      eventDoc = await Event.create({
        eventId,
        eventType: d.eventType,
        stock: stock._id,
        symbol: msg.symbol,
        price: msg.price,
        previousPrice: msg.previousPrice,
        percentageChange: d.percentageChange,
        volume: msg.volume,
        severity: d.severity,
        metadata: d.metadata,
        timestamp: new Date(msg.timestamp),
        processedAt: new Date(),
      });
    } catch (err: any) {
      if (err?.code === 11000) {
        log.info('duplicate event id, already processed (idempotent)', { eventId });
        eventDoc = await Event.findOne({ eventId });
      } else {
        throw err;
      }
    }

    if (!eventDoc) continue;

    const payload: MarketDetectedEvent = {
      eventId: eventDoc.eventId,
      eventType: eventDoc.eventType,
      symbol: eventDoc.symbol,
      price: eventDoc.price,
      previousPrice: eventDoc.previousPrice,
      percentageChange: eventDoc.percentageChange,
      volume: eventDoc.volume,
      severity: eventDoc.severity,
      metadata: eventDoc.metadata,
      timestamp: eventDoc.timestamp.toISOString(),
    };

    await producer.send({
      topic: KAFKA_TOPICS.MARKET_EVENTS,
      messages: [{ key: eventDoc.symbol, value: JSON.stringify(payload) }],
    });

    await evaluateAndCreateAlert(eventDoc, producer);
  }

  log.info('processed market-data message', { symbol: msg.symbol, detectedEvents: detected.map((d) => d.eventType) });
}
