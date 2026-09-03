import { useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { useMarketSocket, WsMessage } from '../hooks/useMarketSocket';
import { DataMode, MarketEvent, Alert } from '../types';

export interface LiveContext {
  events: MarketEvent[];
  alerts: Alert[];
}

const MAX_FEED_ITEMS = 50;

export function DashboardLayout() {
  const [marketStatus, setMarketStatus] = useState<'OPEN' | 'CLOSED' | null>(null);
  const [dataMode, setDataMode] = useState<DataMode | null>(null);
  const [events, setEvents] = useState<MarketEvent[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const handleMessage = useCallback((msg: WsMessage) => {
    if (msg.type === 'ALERT') {
      setAlerts((prev) => [msg.payload as Alert, ...prev].slice(0, MAX_FEED_ITEMS));
    } else if (msg.type === 'CONNECTED') {
      // no-op — connection acknowledgement
    } else {
      setEvents((prev) => [msg.payload as MarketEvent, ...prev].slice(0, MAX_FEED_ITEMS));
    }
  }, []);

  const { status } = useMarketSocket(handleMessage);

  return (
    <div className="min-h-screen flex flex-col">
      <Header marketStatus={marketStatus} dataMode={dataMode} wsStatus={status} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 max-w-[1400px]">
          <Outlet context={{ events, alerts, setMarketStatus, setDataMode } satisfies LiveContext & Record<string, unknown>} />
        </main>
      </div>
    </div>
  );
}
