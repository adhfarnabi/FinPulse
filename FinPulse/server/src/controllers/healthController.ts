import { Request, Response } from 'express';
import { mongoStatus } from '../../../shared/db/connect';
import { getKafkaStatus } from '../websocket/kafkaBridge';
import { isLiveDataConfigured } from '../config/env';

export function health(_req: Request, res: Response) {
  const mongo = mongoStatus();
  const kafka = getKafkaStatus();

  const healthy = mongo === 'connected' && kafka === 'connected';

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    dataMode: isLiveDataConfigured ? 'LIVE' : 'DEMO',
    dependencies: { mongodb: mongo, kafka },
    timestamp: new Date().toISOString(),
  });
}
