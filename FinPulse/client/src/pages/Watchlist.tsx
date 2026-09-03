import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Watchlist, WatchlistDetail } from '../types';
import { formatINR, formatPercent } from '../utils/currency';
import { LoadingBlock, ErrorBlock, EmptyBlock } from '../components/StateBlocks';

export default function WatchlistPage() {
  const [watchlists, setWatchlists] = useState<Watchlist[] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detail, setDetail] = useState<WatchlistDetail | null>(null);
  const [symbolInput, setSymbolInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadLists = () => {
    setError(null);
    api
      .get('/watchlists')
      .then((res) => {
        setWatchlists(res.data);
        if (res.data.length > 0 && !activeId) setActiveId(res.data[0]._id);
      })
      .catch(() => setError('Could not load watchlists'));
  };

  const loadDetail = (id: string) => {
    api.get(`/watchlists/${id}`).then((res) => setDetail(res.data));
  };

  useEffect(loadLists, []);
  useEffect(() => {
    if (activeId) loadDetail(activeId);
  }, [activeId]);

  const createList = async () => {
    const res = await api.post('/watchlists', { name: 'My Watchlist' });
    setWatchlists((prev) => [...(prev ?? []), res.data]);
    setActiveId(res.data._id);
  };

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeId || !symbolInput) return;
    try {
      await api.post(`/watchlists/${activeId}/items`, { symbol: symbolInput.toUpperCase() });
      setSymbolInput('');
      loadDetail(activeId);
    } catch {
      /* surfaced implicitly by the item not appearing; kept simple for this build */
    }
  };

  const removeItem = async (symbol: string) => {
    if (!activeId) return;
    await api.delete(`/watchlists/${activeId}/items/${symbol}`);
    loadDetail(activeId);
  };

  if (error) return <ErrorBlock message={error} onRetry={loadLists} />;
  if (!watchlists) return <LoadingBlock label="Loading watchlists" />;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-paper-100">Watchlist</h1>
        <button onClick={createList} className="text-sm text-marigold-400 hover:text-marigold-500">
          + New list
        </button>
      </div>

      {watchlists.length === 0 ? (
        <EmptyBlock title="No watchlists yet" hint="Create one to start tracking stocks." />
      ) : (
        <>
          <div className="flex gap-2">
            {watchlists.map((w) => (
              <button
                key={w._id}
                onClick={() => setActiveId(w._id)}
                className={`text-sm px-3 py-1.5 rounded-sm border ${
                  activeId === w._id ? 'border-marigold-500 text-marigold-400' : 'border-ink-border text-paper-500'
                }`}
              >
                {w.name}
              </button>
            ))}
          </div>

          <form onSubmit={addItem} className="flex gap-2">
            <input
              value={symbolInput}
              onChange={(e) => setSymbolInput(e.target.value)}
              placeholder="Add symbol (e.g. TCS)"
              className="flex-1 bg-ink-900 border border-ink-border rounded-sm px-3 py-2 text-sm text-paper-100 placeholder:text-paper-500"
            />
            <button type="submit" className="bg-marigold-500 hover:bg-marigold-600 text-ink-950 font-medium rounded-sm px-4 text-sm">
              Add
            </button>
          </form>

          {detail && detail.items.length === 0 && <EmptyBlock title="No stocks in this list yet" />}
          {detail && detail.items.length > 0 && (
            <ul className="border border-ink-border rounded divide-y divide-ink-border">
              {detail.items.map((item) => (
                <li key={item.symbol} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-paper-100">{item.symbol}</span>
                  <div className="flex items-center gap-4">
                    <span className="tnum text-paper-300">{formatINR(item.price)}</span>
                    <span className={`tnum ${(item.percentageChange ?? 0) >= 0 ? 'text-gain-400' : 'text-loss-400'}`}>
                      {formatPercent(item.percentageChange)}
                    </span>
                    <button onClick={() => removeItem(item.symbol)} className="text-paper-500 hover:text-loss-400">
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
