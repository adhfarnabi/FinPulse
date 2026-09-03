import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../services/api';
import { formatPercent } from '../utils/currency';
import { LoadingBlock, ErrorBlock } from '../components/StateBlocks';

interface EventAnalytics {
  eventTypeDistribution: { eventType: string; count: number }[];
  severityDistribution: { severity: string; count: number }[];
  topSymbolsByEventCount: { symbol: string; count: number }[];
}

interface GainersLosers {
  gainers: { symbol: string; percentageChange: number }[];
  losers: { symbol: string; percentageChange: number }[];
}

export default function Analytics() {
  const [events, setEvents] = useState<EventAnalytics | null>(null);
  const [movers, setMovers] = useState<GainersLosers | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setError(null);
    Promise.all([api.get('/analytics/events'), api.get('/analytics/gainers-losers')])
      .then(([e, m]) => {
        setEvents(e.data);
        setMovers(m.data);
      })
      .catch(() => setError('Could not load analytics'));
  };

  useEffect(load, []);

  if (error) return <ErrorBlock message={error} onRetry={load} />;
  if (!events || !movers) return <LoadingBlock label="Loading analytics" />;

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-semibold text-paper-100">Analytics</h1>

      <div className="border border-ink-border rounded bg-ink-800 p-4">
        <p className="text-xs text-paper-500 mb-3">Event Frequency by Type</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={events.eventTypeDistribution}>
            <CartesianGrid stroke="#2A312D" strokeDasharray="3 3" />
            <XAxis dataKey="eventType" tick={{ fill: '#9CA79F', fontSize: 10 }} stroke="#2A312D" />
            <YAxis tick={{ fill: '#9CA79F', fontSize: 11 }} stroke="#2A312D" allowDecimals={false} />
            <Tooltip contentStyle={{ background: '#171C19', border: '1px solid #2A312D', borderRadius: 4 }} />
            <Bar dataKey="count" fill="#D98E2B" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-ink-border rounded bg-ink-800 p-4">
          <p className="text-xs text-paper-500 mb-3">Top Gainers</p>
          <MoverList items={movers.gainers} tone="gain" />
        </div>
        <div className="border border-ink-border rounded bg-ink-800 p-4">
          <p className="text-xs text-paper-500 mb-3">Top Losers</p>
          <MoverList items={movers.losers} tone="loss" />
        </div>
      </div>

      <div className="border border-ink-border rounded bg-ink-800 p-4">
        <p className="text-xs text-paper-500 mb-3">Most Active Symbols (by event count)</p>
        <ul className="space-y-1.5 text-sm">
          {events.topSymbolsByEventCount.map((s) => (
            <li key={s.symbol} className="flex justify-between">
              <span className="text-paper-100">{s.symbol}</span>
              <span className="tnum text-paper-300">{s.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MoverList({ items, tone }: { items: { symbol: string; percentageChange: number }[]; tone: 'gain' | 'loss' }) {
  if (items.length === 0) return <p className="text-sm text-paper-500">No data yet</p>;
  return (
    <ul className="space-y-1.5 text-sm">
      {items.map((i) => (
        <li key={i.symbol} className="flex justify-between">
          <span className="text-paper-100">{i.symbol}</span>
          <span className={`tnum ${tone === 'gain' ? 'text-gain-400' : 'text-loss-400'}`}>{formatPercent(i.percentageChange)}</span>
        </li>
      ))}
    </ul>
  );
}
