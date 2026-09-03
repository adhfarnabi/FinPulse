import { AlertRule, Stock } from '../../../shared/models';
import { ApiError } from '../middleware/error';

const RULE_TYPES = ['PRICE_CHANGE', 'PRICE_TARGET', 'VOLUME'];
const OPERATORS = ['>', '<', '>=', '<=', '='];

export async function listAlertRules(userId: string) {
  return AlertRule.find({ user: userId }).sort({ createdAt: -1 }).lean();
}

export async function createAlertRule(
  userId: string,
  body: { symbol?: string; ruleType?: string; operator?: string; threshold?: number },
) {
  const { symbol, ruleType, operator, threshold } = body;
  if (!symbol) throw new ApiError(400, 'symbol is required');
  if (!ruleType || !RULE_TYPES.includes(ruleType)) throw new ApiError(400, `ruleType must be one of ${RULE_TYPES.join(', ')}`);
  if (!operator || !OPERATORS.includes(operator)) throw new ApiError(400, `operator must be one of ${OPERATORS.join(', ')}`);
  if (typeof threshold !== 'number' || !isFinite(threshold)) throw new ApiError(400, 'threshold must be a number');

  const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
  if (!stock) throw new ApiError(404, `Stock ${symbol} not found`);

  return AlertRule.create({
    user: userId,
    stock: stock._id,
    symbol: stock.symbol,
    ruleType,
    operator,
    threshold,
    isActive: true,
  });
}

async function findOwnedRule(userId: string, id: string) {
  const rule = await AlertRule.findOne({ _id: id, user: userId });
  if (!rule) throw new ApiError(404, 'Alert rule not found');
  return rule;
}

export async function getAlertRule(userId: string, id: string) {
  return findOwnedRule(userId, id);
}

export async function updateAlertRule(userId: string, id: string, updates: Partial<{ operator: string; threshold: number; isActive: boolean }>) {
  const rule = await findOwnedRule(userId, id);
  if (updates.operator !== undefined) {
    if (!OPERATORS.includes(updates.operator)) throw new ApiError(400, 'invalid operator');
    rule.operator = updates.operator as any;
  }
  if (updates.threshold !== undefined) rule.threshold = updates.threshold;
  if (updates.isActive !== undefined) rule.isActive = updates.isActive;
  await rule.save();
  return rule;
}

export async function deleteAlertRule(userId: string, id: string) {
  const rule = await findOwnedRule(userId, id);
  await rule.deleteOne();
  return { deleted: true };
}
