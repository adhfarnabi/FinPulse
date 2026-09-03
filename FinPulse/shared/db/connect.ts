import mongoose from 'mongoose';

let connecting: Promise<typeof mongoose> | null = null;

export async function connectMongo(uri: string): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (connecting) return connecting;

  mongoose.set('strictQuery', true);

  connecting = mongoose
    .connect(uri, {
      serverSelectionTimeoutMS: 8000,
    })
    .then((m) => {
      // eslint-disable-next-line no-console
      console.log('[mongo] connected');
      return m;
    })
    .catch((err) => {
      connecting = null;
      // eslint-disable-next-line no-console
      console.error('[mongo] connection failed', err.message);
      throw err;
    });

  return connecting;
}

export function mongoStatus(): 'connected' | 'connecting' | 'disconnected' | 'disconnecting' {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'] as const;
  const idx = mongoose.connection.readyState;
  return states[idx as 0 | 1 | 2 | 3] ?? 'disconnected';
}

export { mongoose };
