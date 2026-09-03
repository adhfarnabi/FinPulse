import { Response } from 'express';
import { AuthedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { getPortfolioSummary, getPositions, createTransaction } from '../services/portfolioService';
import {
  listWatchlists,
  createWatchlist,
  getWatchlistDetail,
  deleteWatchlist,
  addWatchlistItem,
  removeWatchlistItem,
} from '../services/watchlistService';
import { getAnalyticsSummary, getPerformanceSeries, getEventAnalytics, getGainersLosers } from '../services/analyticsService';

// ---- Portfolio ----
export const getPortfolio = asyncHandler(async (req: AuthedRequest, res: Response) => {
  res.json(await getPortfolioSummary(req.userId as string));
});

export const getPortfolioPositions = asyncHandler(async (req: AuthedRequest, res: Response) => {
  res.json(await getPositions(req.userId as string));
});

export const postTransaction = asyncHandler(async (req: AuthedRequest, res: Response) => {
  res.status(201).json(await createTransaction(req.userId as string, req.body ?? {}));
});

// ---- Watchlists ----
export const getWatchlists = asyncHandler(async (req: AuthedRequest, res: Response) => {
  res.json(await listWatchlists(req.userId as string));
});

export const postWatchlist = asyncHandler(async (req: AuthedRequest, res: Response) => {
  res.status(201).json(await createWatchlist(req.userId as string, req.body?.name));
});

export const getWatchlistById = asyncHandler(async (req: AuthedRequest, res: Response) => {
  res.json(await getWatchlistDetail(req.userId as string, req.params.id));
});

export const removeWatchlist = asyncHandler(async (req: AuthedRequest, res: Response) => {
  res.json(await deleteWatchlist(req.userId as string, req.params.id));
});

export const postWatchlistItem = asyncHandler(async (req: AuthedRequest, res: Response) => {
  res.status(201).json(await addWatchlistItem(req.userId as string, req.params.id, req.body?.symbol));
});

export const removeWatchlistItemHandler = asyncHandler(async (req: AuthedRequest, res: Response) => {
  res.json(await removeWatchlistItem(req.userId as string, req.params.id, req.params.symbol));
});

// ---- Analytics ----
export const getAnalyticsSummaryHandler = asyncHandler(async (req: AuthedRequest, res: Response) => {
  res.json(await getAnalyticsSummary(req.userId as string));
});

export const getAnalyticsPerformance = asyncHandler(async (req: AuthedRequest, res: Response) => {
  res.json(await getPerformanceSeries(req.userId as string, req.query.symbol as string | undefined));
});

export const getAnalyticsEvents = asyncHandler(async (_req: AuthedRequest, res: Response) => {
  res.json(await getEventAnalytics());
});

export const getAnalyticsGainersLosers = asyncHandler(async (req: AuthedRequest, res: Response) => {
  res.json(await getGainersLosers(req.query.limit ? parseInt(String(req.query.limit), 10) : undefined));
});
