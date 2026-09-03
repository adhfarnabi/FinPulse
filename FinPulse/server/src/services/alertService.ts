import { Alert } from '../../../shared/models';
import { ApiError } from '../middleware/error';

const MAX_LIMIT = 200;

export async function listAlerts(params: { symbol?: string; severity?: string; isRead?: string; page: number; limit: number }) {
  const filter: Record<string, unknown> = {};
  if (params.symbol) filter.symbol = params.symbol.toUpperCase();
  if (params.severity) filter.severity = params.severity;
  if (params.isRead !== undefined) filter.isRead = params.isRead === 'true';

  const limit = Math.min(params.limit, MAX_LIMIT);
  const skip = (params.page - 1) * limit;

  const [items, total] = await Promise.all([
    Alert.find(filter).sort({ triggeredAt: -1 }).skip(skip).limit(limit).lean(),
    Alert.countDocuments(filter),
  ]);

  return { items, total, page: params.page, limit, pages: Math.ceil(total / limit) };
}

export async function getRecentAlerts(limit = 20) {
  return Alert.find().sort({ triggeredAt: -1 }).limit(Math.min(limit, MAX_LIMIT)).lean();
}

export async function setAlertRead(id: string, isRead: boolean) {
  const alert = await Alert.findByIdAndUpdate(id, { isRead }, { new: true });
  if (!alert) throw new ApiError(404, 'Alert not found');
  return alert;
}

export async function markAllAlertsRead() {
  const result = await Alert.updateMany({ isRead: false }, { isRead: true });
  return { modified: result.modifiedCount };
}
