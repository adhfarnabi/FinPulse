import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { WsStatus } from '../hooks/useMarketSocket';
import { useAuth } from '../hooks/useAuth';
import { DataMode } from '../types';

interface Props {
  marketStatus: 'OPEN' | 'CLOSED' | null;
  dataMode: DataMode | null;
  wsStatus: WsStatus;
}

export function Header({ marketStatus, dataMode, wsStatus }: Props) {
  const { user, logout } = useAuth();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const istTime = now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <header className="flex items-center justify-between border-b border-ink-border px-6 py-3 bg-ink-900">
      <div className="flex items-center gap-5">
        <Link to="/" className="text-lg font-semibold tracking-tight text-paper-100">
          FinPulse
        </Link>

        <span
          className={`text-xs px-2 py-1 rounded-sm border ${
            marketStatus === 'OPEN' ? 'border-gain-600 text-gain-400' : 'border-ink-border text-paper-500'
          }`}
        >
          Market {marketStatus ?? '—'}
        </span>

        <span
          className={`text-xs px-2 py-1 rounded-sm border ${
            dataMode === 'LIVE' ? 'border-gain-600 text-gain-400' : 'border-marigold-600 text-marigold-400'
          }`}
        >
          {dataMode ?? '—'}
        </span>
      </div>

      <div className="flex items-center gap-5 text-sm">
        <span className="tnum text-paper-500">{istTime} IST</span>

        <span className="flex items-center gap-1.5 text-paper-500">
          <span
            className={`h-2 w-2 rounded-full ${
              wsStatus === 'connected' ? 'bg-gain-500' : wsStatus === 'connecting' ? 'bg-marigold-500' : 'bg-loss-500'
            }`}
          />
          {wsStatus === 'connected' ? 'Live' : wsStatus === 'connecting' ? 'Connecting' : 'Offline'}
        </span>

        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-paper-300">{user.name}</span>
            <button onClick={logout} className="text-paper-500 hover:text-paper-100 transition-colors">
              Sign out
            </button>
          </div>
        ) : (
          <Link to="/login" className="text-marigold-400 hover:text-marigold-500 transition-colors">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
