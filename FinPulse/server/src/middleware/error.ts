import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: 'Not found' });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const isApiError = err instanceof ApiError;
  const status = isApiError ? err.status : 500;
  const message = isApiError ? err.message : 'Internal server error';

  // eslint-disable-next-line no-console
  console.error(JSON.stringify({ level: 'error', msg: 'request failed', status, error: (err as Error)?.message }));

  const body: Record<string, unknown> = { error: message };
  if (env.NODE_ENV !== 'production' && !isApiError) {
    body.detail = (err as Error)?.message;
  }
  res.status(status).json(body);
}

export function asyncHandler<T extends (...args: any[]) => Promise<any>>(fn: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
