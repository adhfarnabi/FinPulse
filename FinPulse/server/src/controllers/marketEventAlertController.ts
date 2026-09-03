import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error';
import { paginationParams } from './helpers';
import { getMarketOverview } from '../services/marketService';
import { listEvents, getRecentEvents, getEventById } from '../services/eventService';
import { listAlerts, getRecentAlerts, setAlertRead, markAllAlertsRead } from '../services/alertService';
import { ApiError } from '../middleware/error';

export const getMarketOverviewHandler = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await getMarketOverview());
});

export const getEvents = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = paginationParams(req);
  res.json(
    await listEvents({
      symbol: req.query.symbol as string | undefined,
      eventType: req.query.eventType as string | undefined,
      severity: req.query.severity as string | undefined,
      start: req.query.start as string | undefined,
      end: req.query.end as string | undefined,
      page,
      limit,
    }),
  );
});

export const getRecentEventsHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json(await getRecentEvents(req.query.limit ? parseInt(String(req.query.limit), 10) : undefined));
});

export const getEventByIdHandler = asyncHandler(async (req: Request, res: Response) => {
  const evt = await getEventById(req.params.eventId);
  if (!evt) throw new ApiError(404, 'Event not found');
  res.json(evt);
});

export const getAlerts = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = paginationParams(req);
  res.json(
    await listAlerts({
      symbol: req.query.symbol as string | undefined,
      severity: req.query.severity as string | undefined,
      isRead: req.query.isRead as string | undefined,
      page,
      limit,
    }),
  );
});

export const getRecentAlertsHandler = asyncHandler(async (req: Request, res: Response) => {
  res.json(await getRecentAlerts(req.query.limit ? parseInt(String(req.query.limit), 10) : undefined));
});

export const markAlertRead = asyncHandler(async (req: Request, res: Response) => {
  res.json(await setAlertRead(req.params.id, true));
});

export const markAlertUnread = asyncHandler(async (req: Request, res: Response) => {
  res.json(await setAlertRead(req.params.id, false));
});

export const markAllRead = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await markAllAlertsRead());
});
