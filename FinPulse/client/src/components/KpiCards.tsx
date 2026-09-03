import { formatINR, formatPercent } from '../utils/currency';

interface Kpi {
  label: string;
  value: string;
  tone?: 'gain' | 'loss' | 'neutral';
}

export function KpiCards({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="border border-ink-border rounded bg-ink-800 px-4 py-3">
          <p className="text-xs text-paper-500 mb-1">{kpi.label}</p>
          <p
            className={`tnum text-lg font-medium ${
              kpi.tone === 'gain' ? 'text-gain-400' : kpi.tone === 'loss' ? 'text-loss-400' : 'text-paper-100'
            }`}
          >
            {kpi.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export function buildPortfolioKpis(params: {
  totalCurrentValue: number;
  totalPnl: number;
  totalReturnPercentage: number;
  activeAlerts: number;
  trackedStocks: number;
}): Kpi[] {
  return [
    { label: 'Portfolio Value', value: formatINR(params.totalCurrentValue) },
    { label: "Today's P&L", value: formatINR(params.totalPnl), tone: params.totalPnl >= 0 ? 'gain' : 'loss' },
    { label: 'Total Return', value: formatPercent(params.totalReturnPercentage), tone: params.totalReturnPercentage >= 0 ? 'gain' : 'loss' },
    { label: 'Active Alerts', value: String(params.activeAlerts) },
    { label: 'Tracked Stocks', value: String(params.trackedStocks) },
  ];
}
