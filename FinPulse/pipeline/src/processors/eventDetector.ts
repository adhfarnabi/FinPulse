import { EventSeverity, EventType } from '../../../shared/types/events';
import { percentageChange } from '../../../shared/utils/finance';

export interface DetectionInput {
  symbol: string;
  price: number;
  previousPrice: number;
  volume: number;
  timestamp: string;
}

/** Historical context needed to evaluate NEW_HIGH / NEW_LOW / HIGH_VOLUME / PRICE_TARGET. */
export interface DetectionContext {
  recentAverageVolume: number | null; // null when there isn't enough history yet
  historicalHigh: number | null;
  historicalLow: number | null;
  priceTargets?: { threshold: number; operator: '>' | '<' | '>=' | '<=' | '=' }[];
}

export interface DetectedEvent {
  eventType: EventType;
  severity: EventSeverity;
  percentageChange: number;
  metadata: Record<string, unknown>;
}

export const DEFAULT_RULES = {
  PRICE_SPIKE_THRESHOLD_PCT: 5,
  PRICE_DROP_THRESHOLD_PCT: -5,
  HIGH_VOLUME_MULTIPLIER: 2,
} as const;

export const SEVERITY_BY_EVENT_TYPE: Record<EventType, EventSeverity> = {
  PRICE_UPDATE: 'INFO',
  PRICE_SPIKE: 'WARNING',
  PRICE_DROP: 'WARNING',
  HIGH_VOLUME: 'WARNING',
  NEW_HIGH: 'INFO',
  NEW_LOW: 'INFO',
  PRICE_TARGET: 'WARNING',
};

function applyOperator(value: number, operator: '>' | '<' | '>=' | '<=' | '=', threshold: number): boolean {
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
  }
}

/**
 * Single source of truth for "what counts as a market event". Both the pipeline
 * processor and (indirectly, via the same shared module) any future re-evaluation
 * logic call this — thresholds are never hard-coded a second time elsewhere.
 */
export function detectEvents(input: DetectionInput, ctx: DetectionContext): DetectedEvent[] {
  const events: DetectedEvent[] = [];
  const pctChange = percentageChange(input.price, input.previousPrice);

  // Always emit the base PRICE_UPDATE event
  events.push({
    eventType: 'PRICE_UPDATE',
    severity: SEVERITY_BY_EVENT_TYPE.PRICE_UPDATE,
    percentageChange: pctChange,
    metadata: {},
  });

  if (pctChange > DEFAULT_RULES.PRICE_SPIKE_THRESHOLD_PCT) {
    events.push({
      eventType: 'PRICE_SPIKE',
      severity: SEVERITY_BY_EVENT_TYPE.PRICE_SPIKE,
      percentageChange: pctChange,
      metadata: { threshold: DEFAULT_RULES.PRICE_SPIKE_THRESHOLD_PCT },
    });
  }

  if (pctChange < DEFAULT_RULES.PRICE_DROP_THRESHOLD_PCT) {
    events.push({
      eventType: 'PRICE_DROP',
      severity: SEVERITY_BY_EVENT_TYPE.PRICE_DROP,
      percentageChange: pctChange,
      metadata: { threshold: DEFAULT_RULES.PRICE_DROP_THRESHOLD_PCT },
    });
  }

  if (ctx.recentAverageVolume !== null && ctx.recentAverageVolume > 0) {
    const ratio = input.volume / ctx.recentAverageVolume;
    if (ratio > DEFAULT_RULES.HIGH_VOLUME_MULTIPLIER) {
      events.push({
        eventType: 'HIGH_VOLUME',
        severity: SEVERITY_BY_EVENT_TYPE.HIGH_VOLUME,
        percentageChange: pctChange,
        metadata: { recentAverageVolume: ctx.recentAverageVolume, ratio },
      });
    }
  }

  if (ctx.historicalHigh !== null && input.price > ctx.historicalHigh) {
    events.push({
      eventType: 'NEW_HIGH',
      severity: SEVERITY_BY_EVENT_TYPE.NEW_HIGH,
      percentageChange: pctChange,
      metadata: { previousHigh: ctx.historicalHigh },
    });
  }

  if (ctx.historicalLow !== null && input.price < ctx.historicalLow) {
    events.push({
      eventType: 'NEW_LOW',
      severity: SEVERITY_BY_EVENT_TYPE.NEW_LOW,
      percentageChange: pctChange,
      metadata: { previousLow: ctx.historicalLow },
    });
  }

  for (const target of ctx.priceTargets ?? []) {
    if (applyOperator(input.price, target.operator, target.threshold)) {
      events.push({
        eventType: 'PRICE_TARGET',
        severity: SEVERITY_BY_EVENT_TYPE.PRICE_TARGET,
        percentageChange: pctChange,
        metadata: { threshold: target.threshold, operator: target.operator },
      });
    }
  }

  return events;
}
