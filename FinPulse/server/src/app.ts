import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import apiRoutes from './routes';
import { health } from './controllers/healthController';
import { errorHandler, notFoundHandler } from './middleware/error';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
  app.use(express.json({ limit: '1mb' }));

  const limiter = rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: true, legacyHeaders: false });
  app.use('/api', limiter);

  app.get('/api/health', health);
  app.use('/api/v1', apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
