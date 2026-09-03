import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error';
import { paginationParams } from './helpers';
import { listStocks, getStockDetail, getStockHistory } from '../services/stockService';

export const getStocks = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = paginationParams(req);
  const result = await listStocks({
    search: req.query.search as string | undefined,
    exchange: req.query.exchange as string | undefined,
    sector: req.query.sector as string | undefined,
    page,
    limit,
  });
  res.json(result);
});

export const getStockBySymbol = asyncHandler(async (req: Request, res: Response) => {
  const result = await getStockDetail(req.params.symbol);
  res.json(result);
});

export const getStockHistoryHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await getStockHistory(req.params.symbol, {
    start: req.query.start as string | undefined,
    end: req.query.end as string | undefined,
    limit: req.query.limit ? parseInt(String(req.query.limit), 10) : undefined,
  });
  res.json(result);
});
