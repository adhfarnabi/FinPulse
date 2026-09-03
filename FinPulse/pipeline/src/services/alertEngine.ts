import { v4 as uuidv4 } from 'uuid';
import { Producer } from 'kafkajs';
import { Alert, AlertRule, IEvent } from '../../../shared/models';
import { KAFKA_TOPICS, AlertEvent } from '../../../shared/types/events';
import { makeLogger } from './logger';

const log = makeLogger('alert-engine');

/** Default: any WARNING/CRITICAL detected event becomes an alert, in addition to any matching AlertRule. */
function defaultMessage(evt: IEvent): string {
  const sign = evt.percentageChange >= 0 ? '+' : '';
  switch (evt.eventType) {
    case 'PRICE_SPIKE':
      return `${evt.symbol} price increased by ${sign}${evt.percentageChange.toFixed(2)}%`;
    case 'PRICE_DROP':
      return `${evt.symbol} price dropped by ${sign}${evt.percentageChange.toFixed(2)}%`;
    case 'HIGH_VOLUME':
      return `${evt.symbol} trading volume surged (${evt.volume.toLocaleString('en-IN')})`;
    case 'NEW_HIGH':
      return `${evt.symbol} hit a new high of ₹${evt.price}`;
    case 'NEW_LOW':
      return `${evt.symbol} hit a new low of ₹${evt.price}`;
    case 'PRICE_TARGET':
      return `${evt.symbol} reached target price ₹${evt.price}`;
    default:
      return `${evt.symbol} update: ${sign}${evt.percentageChange.toFixed(2)}%`;
  }
}

/**
 * Evaluate a persisted Event against default severity rules + active user AlertRules.
 * Idempotent: relies on the unique index on Alert.eventId, so re-processing the same
 * event (e.g. after a consumer restart before offset commit) never creates a duplicate alert.
 */
export async function evaluateAndCreateAlert(evt: IEvent, producer: Producer): Promise<void> {
  if (evt.eventType === 'PRICE_UPDATE') return; // base updates never alert on their own

  // Confirm at least one reason to alert: default WARNING+/CRITICAL severity,
  // or a matching active AlertRule for this symbol.
  const matchingRules = await AlertRule.find({ symbol: evt.symbol, isActive: true }).lean();
  const ruleMatched = matchingRules.some((rule: any) => {
    if (rule.ruleType === 'PRICE_CHANGE') return matchesOperator(evt.percentageChange, rule.operator, rule.threshold);
    if (rule.ruleType === 'PRICE_TARGET') return matchesOperator(evt.price, rule.operator, rule.threshold);
    if (rule.ruleType === 'VOLUME') return matchesOperator(evt.volume, rule.operator, rule.threshold);
    return false;
  });

  const shouldAlert = evt.severity !== 'INFO' || ruleMatched;
  if (!shouldAlert) return;

  const message = defaultMessage(evt);

  try {
    const alertDoc = await Alert.create({
      event: evt._id,
      eventId: evt.eventId,
      symbol: evt.symbol,
      alertType: evt.eventType,
      message,
      severity: evt.severity,
      triggeredAt: evt.timestamp,
    });

    const payload: AlertEvent = {
      alertId: String(alertDoc._id),
      eventId: evt.eventId,
      symbol: evt.symbol,
      alertType: evt.eventType,
      message,
      severity: evt.severity,
      triggeredAt: evt.timestamp.toISOString(),
    };

    await producer.send({
      topic: KAFKA_TOPICS.ALERTS,
      messages: [{ key: evt.symbol, value: JSON.stringify(payload) }],
    });

    log.info('alert created + published', { eventId: evt.eventId, symbol: evt.symbol, alertType: evt.eventType });
  } catch (err: any) {
    if (err?.code === 11000) {
      // Duplicate-key on eventId: this event already produced an alert. Not an error.
      log.info('alert already exists for event, skipping (idempotent)', { eventId: evt.eventId });
      return;
    }
    log.error('failed to create/publish alert', { eventId: evt.eventId, error: err.message });
    throw err;
  }
}

function matchesOperator(value: number, operator: string, threshold: number): boolean {
  switch (operator) {
    case '>':
      return value > threshold;
    case '<':
      return value < threshold;
    case '>=':
      return value >= threshold;
    case '<=':
      return value <= threshold;
    case '=':
      return value === threshold;
    default:
      return false;
  }
}
