import { Link } from 'react-router-dom';
import { Stock } from '../types';
import { formatINR, formatPercent, formatIndianNumber } from '../utils/currency';

export function StockTable({ stocks }: { stocks: Stock[] }) {
  return (
    <div className="overflow-x-auto border border-ink-border rounded">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink-border text-left text-paper-500">
            <th className="px-4 py-2.5 font-normal">Symbol</th>
            <th className="px-4 py-2.5 font-normal hidden md:table-cell">Company</th>
            <th className="px-4 py-2.5 font-normal text-right">Price</th>
            <th className="px-4 py-2.5 font-normal text-right">Change</th>
            <th className="px-4 py-2.5 font-normal text-right">Change %</th>
            <th className="px-4 py-2.5 font-normal text-right hidden lg:table-cell">Volume</th>
            <th className="px-4 py-2.5 font-normal text-right">Status</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((s) => {
            const change = s.latestPrice !== null && s.percentageChange !== null ? (s.latestPrice * s.percentageChange) / (100 + s.percentageChange) : null;
            const positive = (s.percentageChange ?? 0) >= 0;
            return (
              <tr key={s.symbol} className="border-b border-ink-border last:border-0 hover:bg-ink-700/50 transition-colors">
                <td className="px-4 py-2.5">
                  <Link to={`/stocks/${s.symbol}`} className="text-marigold-400 hover:text-marigold-500 font-medium">
                    {s.symbol}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-paper-300 hidden md:table-cell">{s.companyName}</td>
                <td className="px-4 py-2.5 text-right tnum text-paper-100">{formatINR(s.latestPrice)}</td>
                <td className={`px-4 py-2.5 text-right tnum ${positive ? 'text-gain-400' : 'text-loss-400'}`}>
                  {change !== null ? formatINR(change) : '—'}
                </td>
                <td className={`px-4 py-2.5 text-right tnum ${positive ? 'text-gain-400' : 'text-loss-400'}`}>{formatPercent(s.percentageChange)}</td>
                <td className="px-4 py-2.5 text-right tnum text-paper-300 hidden lg:table-cell">{formatIndianNumber(s.volume)}</td>
                <td className="px-4 py-2.5 text-right">
                  <span className={`text-xs px-1.5 py-0.5 rounded-sm border ${s.source?.toUpperCase() === 'LIVE' ? 'border-gain-600 text-gain-400' : 'border-marigold-600 text-marigold-400'}`}>
                    {s.source?.toUpperCase() ?? 'DEMO'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
