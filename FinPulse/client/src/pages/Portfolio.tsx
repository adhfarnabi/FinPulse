import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { PortfolioSummary } from '../types';
import { formatINR, formatPercent } from '../utils/currency';
import { LoadingBlock, ErrorBlock, EmptyBlock } from '../components/StateBlocks';

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ symbol: '', transactionType: 'BUY', quantity: '', price: '' });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setError(null);
    api
      .get('/portfolio')
      .then((res) => setPortfolio(res.data))
      .catch(() => setError('Could not load your portfolio'));
  };

  useEffect(load, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await api.post('/portfolio/transactions', {
        symbol: form.symbol.toUpperCase(),
        transactionType: form.transactionType,
        quantity: Number(form.quantity),
        price: Number(form.price),
      });
      setForm({ symbol: '', transactionType: 'BUY', quantity: '', price: '' });
      load();
    } catch (err: any) {
      setFormError(err?.response?.data?.error ?? 'Transaction failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (error) return <ErrorBlock message={error} onRetry={load} />;
  if (!portfolio) return <LoadingBlock label="Loading portfolio" />;

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-semibold text-paper-100">Portfolio</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total Investment" value={formatINR(portfolio.totalInvestment)} />
        <Stat label="Current Value" value={formatINR(portfolio.totalCurrentValue)} />
        <Stat label="P&L" value={formatINR(portfolio.totalPnl)} tone={portfolio.totalPnl >= 0 ? 'gain' : 'loss'} />
        <Stat label="Return" value={formatPercent(portfolio.totalReturnPercentage)} tone={portfolio.totalReturnPercentage >= 0 ? 'gain' : 'loss'} />
      </div>

      {portfolio.positions.length === 0 ? (
        <EmptyBlock title="No holdings yet" hint="Record a BUY transaction below to start tracking a position." />
      ) : (
        <div className="border border-ink-border rounded overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-border text-left text-paper-500">
                <th className="px-4 py-2.5 font-normal">Symbol</th>
                <th className="px-4 py-2.5 font-normal text-right">Qty</th>
                <th className="px-4 py-2.5 font-normal text-right">Avg Price</th>
                <th className="px-4 py-2.5 font-normal text-right">Current</th>
                <th className="px-4 py-2.5 font-normal text-right">Invested</th>
                <th className="px-4 py-2.5 font-normal text-right">Value</th>
                <th className="px-4 py-2.5 font-normal text-right">P&L</th>
                <th className="px-4 py-2.5 font-normal text-right">Return %</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.positions.map((p) => (
                <tr key={p.symbol} className="border-b border-ink-border last:border-0">
                  <td className="px-4 py-2.5 text-paper-100 font-medium">{p.symbol}</td>
                  <td className="px-4 py-2.5 text-right tnum text-paper-300">{p.quantity}</td>
                  <td className="px-4 py-2.5 text-right tnum text-paper-300">{formatINR(p.averagePrice)}</td>
                  <td className="px-4 py-2.5 text-right tnum text-paper-300">{formatINR(p.currentPrice)}</td>
                  <td className="px-4 py-2.5 text-right tnum text-paper-300">{formatINR(p.investedValue)}</td>
                  <td className="px-4 py-2.5 text-right tnum text-paper-300">{formatINR(p.currentValue)}</td>
                  <td className={`px-4 py-2.5 text-right tnum ${p.pnl >= 0 ? 'text-gain-400' : 'text-loss-400'}`}>{formatINR(p.pnl)}</td>
                  <td className={`px-4 py-2.5 text-right tnum ${p.returnPercentage >= 0 ? 'text-gain-400' : 'text-loss-400'}`}>{formatPercent(p.returnPercentage)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="border border-ink-border rounded bg-ink-800 p-4 max-w-lg">
        <p className="text-xs text-paper-500 mb-3">Record a transaction</p>
        <form onSubmit={submit} className="grid grid-cols-2 gap-3">
          <input
            required
            placeholder="Symbol (e.g. RELIANCE)"
            value={form.symbol}
            onChange={(e) => setForm({ ...form, symbol: e.target.value })}
            className="col-span-2 bg-ink-900 border border-ink-border rounded-sm px-3 py-2 text-sm text-paper-100 placeholder:text-paper-500"
          />
          <select
            value={form.transactionType}
            onChange={(e) => setForm({ ...form, transactionType: e.target.value })}
            className="bg-ink-900 border border-ink-border rounded-sm px-3 py-2 text-sm text-paper-100"
          >
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
          <input
            required
            type="number"
            min="1"
            placeholder="Quantity"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            className="bg-ink-900 border border-ink-border rounded-sm px-3 py-2 text-sm text-paper-100 placeholder:text-paper-500"
          />
          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Price (₹)"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="col-span-2 bg-ink-900 border border-ink-border rounded-sm px-3 py-2 text-sm text-paper-100 placeholder:text-paper-500"
          />
          {formError && <p className="col-span-2 text-loss-400 text-xs">{formError}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="col-span-2 bg-marigold-500 hover:bg-marigold-600 disabled:opacity-50 text-ink-950 font-medium rounded-sm py-2 text-sm transition-colors"
          >
            {submitting ? 'Recording…' : 'Record transaction'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'gain' | 'loss' }) {
  return (
    <div className="border border-ink-border rounded bg-ink-800 px-4 py-3">
      <p className="text-xs text-paper-500 mb-1">{label}</p>
      <p className={`tnum text-lg font-medium ${tone === 'gain' ? 'text-gain-400' : tone === 'loss' ? 'text-loss-400' : 'text-paper-100'}`}>{value}</p>
    </div>
  );
}
