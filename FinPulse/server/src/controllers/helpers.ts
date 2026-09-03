import { Request } from 'express';

export function paginationParams(req: Request, defaultLimit = 20, maxLimit = 100) {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(String(req.query.limit ?? String(defaultLimit)), 10) || defaultLimit));
  return { page, limit };
}
