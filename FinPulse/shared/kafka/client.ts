import { Kafka, logLevel, Producer, Consumer } from 'kafkajs';

export interface KafkaSettings {
  brokers: string[];
  clientId: string;
}

export function createKafkaClient(settings: KafkaSettings): Kafka {
  return new Kafka({
    clientId: settings.clientId,
    brokers: settings.brokers,
    logLevel: logLevel.NOTHING, // we do our own structured logging
    retry: {
      initialRetryTime: 300,
      retries: 10,
    },
  });
}

export async function createAndConnectProducer(kafka: Kafka): Promise<Producer> {
  const producer = kafka.producer({ allowAutoTopicCreation: true, idempotent: true });
  await producer.connect();
  return producer;
}

export async function createAndConnectConsumer(kafka: Kafka, groupId: string): Promise<Consumer> {
  const consumer = kafka.consumer({ groupId, allowAutoTopicCreation: true });
  await consumer.connect();
  return consumer;
}
