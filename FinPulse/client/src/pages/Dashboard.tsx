import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Stock, MarketOverview, Alert } from '../types';
import { KpiCards, buildPortfolioKpis } from '../components/KpiCards';
import { MarketOverviewPanel } from '../components/MarketOverviewPanel';
import { StockTable } from '../components/StockTable';
import { LiveEventFeed } from '../components/LiveEventFeed';
import { AlertPanel } from '../components/AlertPanel';
import { LoadingBlock, ErrorBlock } from '../components/StateBlocks';

interface Ctx {
  events: any[];
  alerts: Alert[];
  setMarketStatus: (s: 'OPEN' | 'CLOSED') => void;
  setDataMode: (d: 'LIVE' | 'DEMO') => void;
}

export default function Dashboard() {
  const { events, alerts: liveAlerts, setMarketStatus, setDataMode } = useOutletContext<Ctx>();
  const { isAuthenticated } = useAuth();

  const [stocks, setStocks] = useState<Stock[] | null>(null);
  const [overview, setOverview] = useState<MarketOverview | null>(null);
  const [restAlerts, setRestAlerts] = useState<Alert[]>([]);
  const [summary, setSummary] = useState<{ totalCurrentValue: number; pnl: number; returnPercentage: number; activeAlerts: number; trackedStocks: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setError(null);
    Promise.all([
      api.get('/stocks', { params: { limit: 20 } }),
      api.get('/market/overview'),
      api.get('/alerts/recent', { params: { limit: 20 } }),
    ])
      .then(([stocksRes, overviewRes, alertsRes]) => {
        setStocks(stocksRes.data.items);
        setOverview(overviewRes.data);
        setMarketStatus(overviewRes.data.marketStatus);
        setDataMode(overviewRes.data.dataMode);
        setRestAlerts(alertsRes.data);
      })
      .catch(() => setError('Could not load dashboard data. Is the API server running?'));

    if (isAuthenticated) {
      api
        .get('/analytics/summary')
        .then((res) => setSummary(res.data))
        .catch(() => {
          /* portfolio summary is a nice-to-have; dashboard still works without it */
        });
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [isAuthenticated]);

  const combinedAlerts = [...liveAlerts, ...restAlerts.filter((a) => !liveAlerts.some((l) => l._id === a._id))].slice(0, 30);

  const markRead = (id: string) => {
    api.patch(`/alerts/${id}/read`).then(() => setRestAlerts((prev) => prev.map((a) => (a._id === id ? { ...a, isRead: true } : a))));
  };
  const markAllRead = () => {
    api.post('/alerts/mark-all-read').then(() => setRestAlerts((prev) => prev.map((a) => ({ ...a, isRead: true }))));
  };

  if (error) return <ErrorBlock message={error} onRetry={load} />;
  if (!stocks || !overview) return <LoadingBlock label="Loading market data" />;

  return (
    <div className="space-y-6">
      <KpiCards
        kpis={buildPortfolioKpis({
          totalCurrentValue: summary?.totalCurrentValue ?? 0,
          totalPnl: summary?.pnl ?? 0,
          totalReturnPercentage: summary?.returnPercentage ?? 0,
          activeAlerts: summary?.activeAlerts ?? combinedAlerts.filter((a) => !a.isRead).length,
          trackedStocks: overview.trackedStockCount,
        })}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <StockTable stocks={stocks} />
        </div>
        <MarketOverviewPanel overview={overview} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LiveEventFeed events={events} />
        <AlertPanel alerts={combinedAlerts} onMarkRead={markRead} onMarkAllRead={markAllRead} />
      </div>
    </div>
  );
}
