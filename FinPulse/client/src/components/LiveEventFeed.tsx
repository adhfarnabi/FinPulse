import { MarketEvent } from '../types';
import { formatINR, formatPercent, formatISTTime } from '../utils/currency';

const EVENT_ICON: Record<string, string> = {
  PRICE_SPIKE: '🚨',
  PRICE_DROP: '🔻',
  HIGH_VOLUME: '📊',
  NEW_HIGH: '⬆️',
  NEW_LOW: '⬇️',
  PRICE_TARGET: '🎯',
  PRICE_UPDATE: '•',
};

export function LiveEventFeed({ events }: { events: MarketEvent[] }) {
  return (
    <div className="border border-ink-border rounded bg-ink-800 p-4">
      <p className="text-xs text-paper-500 mb-3">Live Event Feed</p>
      {events.length === 0 ? (
        <p className="text-sm text-paper-500">Waiting for market events…</p>
      ) : (
        <ul className="space-y-2.5 max-h-96 overflow-y-auto">
          {events.map((e) => (
            <li key={e.eventId} className="flex items-start gap-2.5 text-sm border-b border-ink-border last:border-0 pb-2.5 last:pb-0">
              <span aria-hidden>{EVENT_ICON[e.eventType] ?? '•'}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-paper-100 font-medium">{e.eventType.replace('_', ' ')}</span>
                  <span className="text-paper-500 text-xs tnum">{formatISTTime(e.timestamp)}</span>
                </div>
                <div className="flex items-center gap-3 text-paper-300 mt-0.5">
                  <span>{e.symbol}</span>
                  <span className="tnum">{formatINR(e.price)}</span>
                  <span className={`tnum ${e.percentageChange >= 0 ? 'text-gain-400' : 'text-loss-400'}`}>{formatPercent(e.percentageChange)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
