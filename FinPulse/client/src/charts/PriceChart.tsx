import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../services/api';
import { formatINR } from '../utils/currency';
import { LoadingBlock, ErrorBlock, EmptyBlock } from '../components/StateBlocks';

type Range = '1D' | '1W' | '1M' | '3M' | '1Y';

const RANGE_TO_MS: Record<Range, number> = {
  '1D': 24 * 60 * 60 * 1000,
  '1W': 7 * 24 * 60 * 60 * 1000,
  '1M': 30 * 24 * 60 * 60 * 1000,
  '3M': 90 * 24 * 60 * 60 * 1000,
  '1Y': 365 * 24 * 60 * 60 * 1000,
};

interface HistoryPoint {
  price: number;
  timestamp: string;
}

export function PriceChart({ symbol }: { symbol: string }) {
  const [range, setRange] = useState<Range>('1D');
  const [data, setData] = useState<HistoryPoint[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setData(null);
    setError(null);
    const start = new Date(Date.now() - RANGE_TO_MS[range]).toISOString();
    api
      .get(`/stocks/${symbol}/history`, { params: { start, limit: 500 } })
      .then((res) => setData(res.data))
      .catch(() => setError('Could not load price history'));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [symbol, range]);

  return (
    <div className="border border-ink-border rounded bg-ink-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-paper-500">Price Chart</p>
        <div className="flex gap-1">
          {(Object.keys(RANGE_TO_MS) as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`text-xs px-2 py-1 rounded-sm border ${
                range === r ? 'border-marigold-500 text-marigold-400' : 'border-ink-border text-paper-500 hover:text-paper-100'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorBlock message={error} onRetry={load} />}
      {!error && data === null && <LoadingBlock label="Loading chart" />}
      {!error && data !== null && data.length === 0 && <EmptyBlock title="No price history yet for this range" />}
      {!error && data !== null && data.length > 0 && (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid stroke="#2A312D" strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tick={{ fill: '#9CA79F', fontSize: 11 }}
              tickFormatter={(v) => new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              stroke="#2A312D"
            />
            <YAxis
              tick={{ fill: '#9CA79F', fontSize: 11 }}
              tickFormatter={(v) => formatINR(v, { decimals: false })}
              stroke="#2A312D"
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{ background: '#171C19', border: '1px solid #2A312D', borderRadius: 4 }}
              labelStyle={{ color: '#9CA79F' }}
              formatter={(value: number) => [formatINR(value), 'Price']}
              labelFormatter={(v) => new Date(v).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
            />
            <Line type="monotone" dataKey="price" stroke="#D98E2B" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
