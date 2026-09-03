import { Alert } from '../types';
import { formatISTTime } from '../utils/currency';

const SEVERITY_STYLE: Record<string, string> = {
  INFO: 'border-ink-border text-paper-300',
  WARNING: 'border-marigold-600 text-marigold-400',
  CRITICAL: 'border-loss-600 text-loss-400',
};

export function AlertPanel({
  alerts,
  onMarkRead,
  onMarkAllRead,
}: {
  alerts: Alert[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}) {
  const unreadCount = alerts.filter((a) => !a.isRead).length;

  return (
    <div className="border border-ink-border rounded bg-ink-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-paper-500">Alerts {unreadCount > 0 && <span className="text-marigold-400">({unreadCount} unread)</span>}</p>
        {unreadCount > 0 && (
          <button onClick={onMarkAllRead} className="text-xs text-marigold-400 hover:text-marigold-500">
            Mark all read
          </button>
        )}
      </div>

      {alerts.length === 0 ? (
        <p className="text-sm text-paper-500">No alerts yet</p>
      ) : (
        <ul className="space-y-2 max-h-96 overflow-y-auto">
          {alerts.map((a) => (
            <li key={a._id} className={`border rounded-sm px-3 py-2 text-sm ${a.isRead ? 'border-ink-border opacity-60' : SEVERITY_STYLE[a.severity]}`}>
              <div className="flex items-center justify-between">
                <span className="font-medium">{a.symbol}</span>
                <span className="text-xs tnum text-paper-500">{formatISTTime(a.triggeredAt)}</span>
              </div>
              <p className="text-paper-300 mt-0.5">{a.message}</p>
              {!a.isRead && (
                <button onClick={() => onMarkRead(a._id)} className="text-xs text-marigold-400 hover:text-marigold-500 mt-1">
                  Mark read
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
