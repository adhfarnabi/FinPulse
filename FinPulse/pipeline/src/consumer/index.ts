import { Consumer, Producer, EachMessagePayload } from 'kafkajs';
import { env } from '../config/env';
import { connectMongo } from '../../../shared/db/connect';
import { createKafkaClient, createAndConnectConsumer, createAndConnectProducer } from '../../../shared/kafka/client';
import { KAFKA_TOPICS, validateMarketDataEvent, MarketDataEvent } from '../../../shared/types/events';
import { processMarketDataMessage } from '../processors/dataProcessor';
import { makeLogger } from '../services/logger';

const log = makeLogger('consumer');

let consumer: Consumer | null = null;
let producer: Producer | null = null;
let shuttingDown = false;

async function handleMessage(payload: EachMessagePayload, dlqProducer: Producer) {
  const { message, topic, partition } = payload;
  const raw = message.value?.toString('utf-8');

  if (!raw) {
    log.warn('empty message value, skipping', { topic, partition, offset: message.offset });
    return; // safe to "succeed" (advance offset) on an empty message — nothing to process
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    log.warn('malformed JSON message, routing to DLQ', { topic, partition, offset: message.offset });
    await sendToDlq(dlqProducer, raw, 'invalid_json');
    return; // offset can advance — this message will never become processable
  }

  const errors = validateMarketDataEvent(parsed);
  if (errors.length > 0) {
    log.warn('schema validation failed, routing to DLQ', { errors, offset: message.offset });
    await sendToDlq(dlqProducer, raw, 'schema_validation_failed');
    return;
  }

  const event = parsed as MarketDataEvent;

  // Retry a handful of times on transient DB/Kafka failures before giving up on this message.
  const MAX_ATTEMPTS = 3;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await processMarketDataMessage(event, dlqProducer);
      return; // success — safe for the caller to let the offset commit
    } catch (err) {
      log.error('processing attempt failed', {
        attempt,
        eventId: event.eventId,
        symbol: event.symbol,
        error: (err as Error).message,
      });
      if (attempt === MAX_ATTEMPTS) {
        await sendToDlq(dlqProducer, raw, 'processing_failed_after_retries');
        return; // give up on this message but do not crash the consumer loop
      }
      await new Promise((r) => setTimeout(r, 250 * attempt));
    }
  }
}

async function sendToDlq(producerRef: Producer, raw: string, reason: string) {
  try {
    await producerRef.send({
      topic: KAFKA_TOPICS.MARKET_DATA_DLQ,
      messages: [{ value: JSON.stringify({ reason, raw, failedAt: new Date().toISOString() }) }],
    });
  } catch (err) {
    log.error('failed to publish to DLQ (message effectively dropped, logged here)', {
      reason,
      raw,
      error: (err as Error).message,
    });
  }
}

async function main() {
  log.info('starting consumer', { brokers: env.KAFKA_BROKERS, groupId: env.KAFKA_GROUP_ID });

  await connectMongo(env.MONGODB_URI);

  const kafka = createKafkaClient({ brokers: env.KAFKA_BROKERS, clientId: `${env.KAFKA_CLIENT_ID}-consumer` });
  producer = await createAndConnectProducer(kafka); // used to publish market-events, alerts, and DLQ
  consumer = await createAndConnectConsumer(kafka, env.KAFKA_GROUP_ID);

  await consumer.subscribe({ topic: KAFKA_TOPICS.MARKET_DATA, fromBeginning: false });

  await consumer.run({
    // autoCommit stays on KafkaJS's default (post-handler, per batch) — because we only
    // return from eachMessage after processMarketDataMessage has durably persisted to
    // MongoDB and published derived events, the offset is never committed ahead of that work.
    eachMessage: async (payload) => {
      await handleMessage(payload, producer as Producer);
    },
  });

  log.info('consumer running');
}

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  log.info('shutting down consumer', { signal });
  try {
    if (consumer) await (consumer as Consumer).disconnect();
    if (producer) await (producer as Producer).disconnect();
  } catch (err) {
    log.error('error during consumer shutdown', { error: (err as Error).message });
  }
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

main().catch((err) => {
  log.error('consumer failed to start', { error: (err as Error).message });
  process.exit(1);
});
