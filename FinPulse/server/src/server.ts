import http from 'http';
import { env } from './config/env';
import { connectMongo, mongoStatus } from '../../shared/db/connect';
import { createApp } from './app';
import { initWebSocketServer } from './websocket/server';
import { startKafkaBridge, stopKafkaBridge } from './websocket/kafkaBridge';

function makeLog(msg: string, meta: Record<string, unknown> = {}) {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ ts: new Date().toISOString(), level: 'info', service: 'server', msg, ...meta }));
}

async function main() {
  makeLog('starting server', { nodeEnv: env.NODE_ENV, port: env.PORT });

  await connectMongo(env.MONGODB_URI);
  makeLog('mongodb status', { status: mongoStatus() });

  const app = createApp();

  const server = http.createServer(app);
  initWebSocketServer(server);

  server.listen(env.PORT, () => {
    makeLog('server listening', { port: env.PORT });
  });

  await startKafkaBridge();

  const shutdown = async (signal: string) => {
    makeLog('shutting down server', { signal });
    await stopKafkaBridge();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(JSON.stringify({ level: 'error', service: 'server', msg: 'failed to start', error: err.message }));
  process.exit(1);
});
