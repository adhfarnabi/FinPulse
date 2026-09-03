import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AlertRule } from '../types';
import { LoadingBlock, ErrorBlock, EmptyBlock } from '../components/StateBlocks';

export default function AlertRules() {
  const [rules, setRules] = useState<AlertRule[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ symbol: '', ruleType: 'PRICE_CHANGE', operator: '>', threshold: '' });
  const [formError, setFormError] = useState<string | null>(null);

  const load = () => {
    setError(null);
    api
      .get('/alert-rules')
      .then((res) => setRules(res.data))
      .catch(() => setError('Could not load alert rules'));
  };

  useEffect(load, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await api.post('/alert-rules', {
        symbol: form.symbol.toUpperCase(),
        ruleType: form.ruleType,
        operator: form.operator,
        threshold: Number(form.threshold),
      });
      setForm({ symbol: '', ruleType: 'PRICE_CHANGE', operator: '>', threshold: '' });
      load();
    } catch (err: any) {
      setFormError(err?.response?.data?.error ?? 'Could not create rule');
    }
  };

  const toggle = async (rule: AlertRule) => {
    await api.patch(`/alert-rules/${rule._id}`, { isActive: !rule.isActive });
    load();
  };

  const remove = async (id: string) => {
    await api.delete(`/alert-rules/${id}`);
    load();
  };

  if (error) return <ErrorBlock message={error} onRetry={load} />;
  if (!rules) return <LoadingBlock label="Loading alert rules" />;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold text-paper-100">Alert Rules</h1>

      <form onSubmit={submit} className="border border-ink-border rounded bg-ink-800 p-4 grid grid-cols-2 gap-3">
        <input
          required
          placeholder="Symbol (e.g. RELIANCE)"
          value={form.symbol}
          onChange={(e) => setForm({ ...form, symbol: e.target.value })}
          className="col-span-2 bg-ink-900 border border-ink-border rounded-sm px-3 py-2 text-sm text-paper-100 placeholder:text-paper-500"
        />
        <select
          value={form.ruleType}
          onChange={(e) => setForm({ ...form, ruleType: e.target.value })}
          className="bg-ink-900 border border-ink-border rounded-sm px-3 py-2 text-sm text-paper-100"
        >
          <option value="PRICE_CHANGE">Price Change %</option>
          <option value="PRICE_TARGET">Price Target</option>
          <option value="VOLUME">Volume</option>
        </select>
        <select
          value={form.operator}
          onChange={(e) => setForm({ ...form, operator: e.target.value })}
          className="bg-ink-900 border border-ink-border rounded-sm px-3 py-2 text-sm text-paper-100"
        >
          <option value=">">&gt;</option>
          <option value="<">&lt;</option>
          <option value=">=">&gt;=</option>
          <option value="<=">&lt;=</option>
          <option value="=">=</option>
        </select>
        <input
          required
          type="number"
          step="0.01"
          placeholder="Threshold"
          value={form.threshold}
          onChange={(e) => setForm({ ...form, threshold: e.target.value })}
          className="col-span-2 bg-ink-900 border border-ink-border rounded-sm px-3 py-2 text-sm text-paper-100 placeholder:text-paper-500"
        />
        {formError && <p className="col-span-2 text-loss-400 text-xs">{formError}</p>}
        <button type="submit" className="col-span-2 bg-marigold-500 hover:bg-marigold-600 text-ink-950 font-medium rounded-sm py-2 text-sm">
          Create Rule
        </button>
      </form>

      {rules.length === 0 ? (
        <EmptyBlock title="No alert rules yet" />
      ) : (
        <ul className="border border-ink-border rounded divide-y divide-ink-border">
          {rules.map((r) => (
            <li key={r._id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-paper-100">
                {r.symbol} {r.ruleType.replace('_', ' ')} {r.operator} {r.threshold}
              </span>
              <div className="flex items-center gap-3">
                <button onClick={() => toggle(r)} className={r.isActive ? 'text-gain-400' : 'text-paper-500'}>
                  {r.isActive ? 'Enabled' : 'Disabled'}
                </button>
                <button onClick={() => remove(r._id)} className="text-paper-500 hover:text-loss-400">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
