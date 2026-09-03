import { v4 as uuidv4 } from 'uuid';
import { Producer } from 'kafkajs';
import { env } from '../config/env';
import { createKafkaClient, createAndConnectProducer } from '../../../shared/kafka/client';
import { KAFKA_TOPICS, MarketDataEvent, TRACKED_SYMBOLS, validateMarketDataEvent } from '../../../shared/types/events';
import { createMarketDataProvider } from '../providers';
import { makeLogger } from '../services/logger';

const log = makeLogger('producer');

let producer: Producer | null = null;
let timer: NodeJS.Timeout | null = null;
let shuttingDown = false;

async function publishTick(producerRef: Producer) {
  const provider = producerState.provider;
  try {
    const [stockQuotes, indexQuotes] = await Promise.all([
      provider.fetchQuotes(TRACKED_SYMBOLS),
      provider.fetchIndices ? provider.fetchIndices() : Promise.resolve([]),
    ]);
    const quotes = [...stockQuotes, ...indexQuotes];
    const timestamp = new Date().toISOString();

    const events: MarketDataEvent[] = quotes.map((q) => ({
      eventId: uuidv4(),
      eventType: 'PRICE_UPDATE',
      symbol: q.symbol,
      exchange: q.exchange,
      price: q.price,
      previousPrice: q.previousPrice,
      openPrice: q.openPrice,
      highPrice: q.highPrice,
      lowPrice: q.lowPrice,
      volume: q.volume,
      currency: 'INR',
      timestamp,
      source: provider.source,
    }));

    const valid = events.filter((e) => {
      const errors = validateMarketDataEvent(e);
      if (errors.length > 0) {
        log.warn('dropping invalid market data event before publish', { symbol: e.symbol, errors });
        return false;
      }
      return true;
    });

    if (valid.length === 0) return;

    await producerRef.send({
      topic: KAFKA_TOPICS.MARKET_DATA,
      messages: valid.map((e) => ({ key: e.symbol, value: JSON.stringify(e) })),
    });

    log.info('published market-data batch', { count: valid.length, source: provider.source });
  } catch (err) {
    log.error('failed to publish market-data tick', { error: (err as Error).message });
    // Do not crash the interval loop on a transient provider/broker failure —
    // the next tick will retry. KafkaJS's own producer retry policy also applies.
  }
}

// small mutable holder so publishTick can reach the provider without changing signature everywhere
const producerState: { provider: ReturnType<typeof createMarketDataProvider> } = {
  provider: createMarketDataProvider(),
};

async function main() {
  log.info('starting producer', {
    brokers: env.KAFKA_BROKERS,
    intervalSeconds: env.MARKET_DATA_INTERVAL_SECONDS,
  });

  const kafka = createKafkaClient({ brokers: env.KAFKA_BROKERS, clientId: `${env.KAFKA_CLIENT_ID}-producer` });
  producer = await createAndConnectProducer(kafka);
  log.info('producer connected to kafka');

  const intervalMs = Math.max(1, env.MARKET_DATA_INTERVAL_SECONDS) * 1000;
  const producerRef = producer;
  timer = setInterval(() => {
    if (shuttingDown) return;
    void publishTick(producerRef);
  }, intervalMs);

  // fire the first tick immediately instead of waiting a full interval
  void publishTick(producerRef);
}

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  log.info('shutting down producer', { signal });
  if (timer) clearInterval(timer);
  try {
    if (producer) await producer.disconnect();
  } catch (err) {
    log.error('error during producer disconnect', { error: (err as Error).message });
  }
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

main().catch((err) => {
  log.error('producer failed to start', { error: (err as Error).message });
  process.exit(1);
});
