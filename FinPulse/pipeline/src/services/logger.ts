type Level = 'info' | 'warn' | 'error';

function line(level: Level, service: string, msg: string, meta?: Record<string, unknown>) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    service,
    msg,
    ...(meta ?? {}),
  };
  // eslint-disable-next-line no-console
  (level === 'error' ? console.error : console.log)(JSON.stringify(entry));
}

export function makeLogger(service: string) {
  return {
    info: (msg: string, meta?: Record<string, unknown>) => line('info', service, msg, meta),
    warn: (msg: string, meta?: Record<string, unknown>) => line('warn', service, msg, meta),
    error: (msg: string, meta?: Record<string, unknown>) => line('error', service, msg, meta),
  };
}
