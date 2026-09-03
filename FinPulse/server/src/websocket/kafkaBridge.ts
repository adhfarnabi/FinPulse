import { Consumer } from 'kafkajs';
import { env } from '../config/env';
import { createKafkaClient, createAndConnectConsumer } from '../../../shared/kafka/client';
import { KAFKA_TOPICS } from '../../../shared/types/events';
import { broadcast } from './server';

let consumer: Consumer | null = null;
let status: 'connected' | 'connecting' | 'disconnected' = 'disconnected';
let stopping = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

export function getKafkaStatus() {
  return status;
}

/**
 * The WebSocket server does NOT talk to the pipeline process directly — it runs its own
 * Kafka consumer group so it stays decoupled from the producer/consumer pipeline services,
 * matching: Kafka/Event Processor -> Node.js WebSocket Server -> React Dashboard.
 *
 * On startup, the topics this subscribes to (`market-events`, `alerts`) may not exist yet
 * if the pipeline's producer/consumer containers haven't published to them for the first
 * time. Rather than fail once and stay disconnected forever, this retries with backoff.
 */
export async function startKafkaBridge(attempt = 1) {
  if (stopping) return;
  status = 'connecting';
  try {
    const kafka = createKafkaClient({ brokers: env.KAFKA_BROKERS, clientId: `${env.KAFKA_CLIENT_ID}-ws-bridge` });
    const c = await createAndConnectConsumer(kafka, `${env.KAFKA_CLIENT_ID}-ws-bridge-group`);
    consumer = c;
    await c.subscribe({ topic: KAFKA_TOPICS.MARKET_EVENTS, fromBeginning: false });
    await c.subscribe({ topic: KAFKA_TOPICS.ALERTS, fromBeginning: false });

    await c.run({
      eachMessage: async ({ topic, message }) => {
        const raw = message.value?.toString('utf-8');
        if (!raw) return;
        try {
          const payload = JSON.parse(raw);
          if (topic === KAFKA_TOPICS.MARKET_EVENTS) {
            broadcast(payload.eventType ?? 'MARKET_EVENT', payload);
          } else if (topic === KAFKA_TOPICS.ALERTS) {
            broadcast('ALERT', payload);
          }
        } catch {
          // malformed message on an already-validated topic; drop rather than crash the bridge
        }
      },
    });

    status = 'connected';
    // eslint-disable-next-line no-console
    console.log(JSON.stringify({ level: 'info', service: 'ws-bridge', msg: 'kafka bridge connected', attempt }));
  } catch (err) {
    status = 'disconnected';
    // eslint-disable-next-line no-console
    console.error(
      JSON.stringify({
        level: 'error',
        service: 'ws-bridge',
        msg: 'kafka bridge failed, will retry',
        attempt,
        error: (err as Error).message,
      }),
    );

    try {
      if (consumer) await consumer.disconnect();
    } catch {
      // best-effort cleanup before retrying
    }
    consumer = null;

    if (stopping) return;
    const delay = Math.min(30_000, 1000 * 2 ** Math.min(attempt, 5)); // capped exponential backoff
    retryTimer = setTimeout(() => void startKafkaBridge(attempt + 1), delay);
  }
}

export async function stopKafkaBridge() {
  stopping = true;
  if (retryTimer) clearTimeout(retryTimer);
  if (consumer) await consumer.disconnect();
  status = 'disconnected';
}
