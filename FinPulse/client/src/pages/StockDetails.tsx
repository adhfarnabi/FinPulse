import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { Stock } from '../types';
import { formatINR, formatPercent, formatIndianNumber } from '../utils/currency';
import { PriceChart } from '../charts/PriceChart';
import { LoadingBlock, ErrorBlock } from '../components/StateBlocks';

export default function StockDetails() {
  const { symbol = '' } = useParams();
  const [stock, setStock] = useState<Stock | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setStock(null);
    setError(null);
    api
      .get(`/stocks/${symbol}`)
      .then((res) => setStock(res.data))
      .catch(() => setError(`Could not load ${symbol}`));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [symbol]);

  if (error) return <ErrorBlock message={error} onRetry={load} />;
  if (!stock) return <LoadingBlock label={`Loading ${symbol}`} />;

  const positive = (stock.percentageChange ?? 0) >= 0;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-semibold text-paper-100">{stock.symbol}</h1>
          <span className="text-paper-500">{stock.companyName}</span>
        </div>
        <p className="text-sm text-paper-500 mt-1">
          {stock.exchange} · {stock.sector}
        </p>
      </div>

      <div className="flex items-baseline gap-4">
        <span className="tnum text-3xl text-paper-100">{formatINR(stock.latestPrice)}</span>
        <span className={`tnum text-lg ${positive ? 'text-gain-400' : 'text-loss-400'}`}>{formatPercent(stock.percentageChange)}</span>
        <span className="text-xs text-paper-500">Volume {formatIndianNumber(stock.volume)}</span>
      </div>

      <PriceChart symbol={stock.symbol} />
    </div>
  );
}
