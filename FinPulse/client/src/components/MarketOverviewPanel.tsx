import { MarketOverview } from '../types';
import { formatIndianNumber, formatPercent } from '../utils/currency';

function MoversList({ title, items, tone }: { title: string; items: MarketOverview['topGainers']; tone: 'gain' | 'loss' }) {
  return (
    <div>
      <p className="text-xs text-paper-500 mb-2">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm text-paper-500">No data yet</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((i) => (
            <li key={i.symbol} className="flex items-center justify-between text-sm">
              <span className="text-paper-100">{i.symbol}</span>
              <span className={`tnum ${tone === 'gain' ? 'text-gain-400' : 'text-loss-400'}`}>{formatPercent(i.percentageChange)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function MarketOverviewPanel({ overview }: { overview: MarketOverview }) {
  return (
    <div className="border border-ink-border rounded bg-ink-800 p-4">
      <div className="grid grid-cols-2 gap-4 mb-5">
        <IndexBlock label="NIFTY 50" value={overview.nifty50} />
        <IndexBlock label="SENSEX" value={overview.sensex} />
      </div>
      <div className="grid grid-cols-2 gap-6">
        <MoversList title="Top Gainers" items={overview.topGainers} tone="gain" />
        <MoversList title="Top Losers" items={overview.topLosers} tone="loss" />
      </div>
    </div>
  );
}

function IndexBlock({ label, value }: { label: string; value: { price: number; percentageChange: number } | null }) {
  return (
    <div>
      <p className="text-xs text-paper-500 mb-1">{label}</p>
      {value ? (
        <div className="flex items-baseline gap-2">
          <p className="tnum text-paper-100">{formatIndianNumber(value.price)}</p>
          <p className={`tnum text-xs ${value.percentageChange >= 0 ? 'text-gain-400' : 'text-loss-400'}`}>
            {formatPercent(value.percentageChange)}
          </p>
        </div>
      ) : (
        <p className="text-sm text-paper-500 italic">Unavailable</p>
      )}
    </div>
  );
}
