import { Event } from '../../../shared/models';

const MAX_LIMIT = 200;

export async function listEvents(params: {
  symbol?: string;
  eventType?: string;
  severity?: string;
  start?: string;
  end?: string;
  page: number;
  limit: number;
}) {
  const filter: Record<string, unknown> = {};
  if (params.symbol) filter.symbol = params.symbol.toUpperCase();
  if (params.eventType) filter.eventType = params.eventType;
  if (params.severity) filter.severity = params.severity;
  const range: Record<string, Date> = {};
  if (params.start) range.$gte = new Date(params.start);
  if (params.end) range.$lte = new Date(params.end);
  if (Object.keys(range).length > 0) filter.timestamp = range;

  const limit = Math.min(params.limit, MAX_LIMIT);
  const skip = (params.page - 1) * limit;

  const [items, total] = await Promise.all([
    Event.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
    Event.countDocuments(filter),
  ]);

  return { items, total, page: params.page, limit, pages: Math.ceil(total / limit) };
}

export async function getRecentEvents(limit = 20) {
  return Event.find().sort({ timestamp: -1 }).limit(Math.min(limit, MAX_LIMIT)).lean();
}

export async function getEventById(eventId: string) {
  return Event.findOne({ eventId }).lean();
}
