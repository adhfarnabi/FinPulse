import { MarketData, Stock } from '../../../shared/models';
import { isLiveDataConfigured } from '../config/env';

/**
 * NIFTY 50 / SENSEX are stored as ordinary MarketData ticks under symbols "NIFTY50" and
 * "SENSEX" (see pipeline/src/processors/dataProcessor.ts, which tags them sector="Index").
 * They only have real values once the pipeline's provider actually supplies index data
 * (MARKET_DATA_PROVIDER=yahoo, or a custom live provider that implements fetchIndices()).
 * In DEMO mode, or before the first tick lands, this correctly reports null/unavailable —
 * it never fabricates a number.
 */
async function getIndexSnapshot(symbol: 'NIFTY50' | 'SENSEX') {
  const latest = await MarketData.findOne({ symbol }).sort({ timestamp: -1 }).lean();
  if (!latest) return null;
  return { price: latest.price, percentageChange: latest.percentageChange, timestamp: latest.timestamp };
}

export async function getMarketOverview() {
  const trackedStockCount = await Stock.countDocuments({ isActive: true, sector: { $ne: 'Index' } });

  // Latest tick per symbol, via aggregation (avoids N+1 queries). Excludes indices — they
  // aren't tradeable stocks and shouldn't appear in the gainers/losers ranking.
  const latestPerSymbol = await MarketData.aggregate([
    { $sort: { timestamp: -1 } },
    { $group: { _id: '$symbol', doc: { $first: '$$ROOT' } } },
    { $replaceRoot: { newRoot: '$doc' } },
    { $match: { symbol: { $nin: ['NIFTY50', 'SENSEX'] } } },
  ]);

  const sorted = [...latestPerSymbol].sort((a, b) => b.percentageChange - a.percentageChange);
  const topGainers = sorted.slice(0, 5).map(toSummary);
  const topLosers = sorted
    .slice(-5)
    .reverse()
    .map(toSummary);

  const latestUpdate = latestPerSymbol.reduce<Date | null>((max, d) => {
    const ts: Date = d.timestamp;
    return !max || ts > max ? ts : max;
  }, null);

  return {
    marketStatus: isMarketOpenIST() ? 'OPEN' : 'CLOSED',
    dataMode: isLiveDataConfigured ? 'LIVE' : 'DEMO',
    nifty50: await getIndexSnapshot('NIFTY50'),
    sensex: await getIndexSnapshot('SENSEX'),
    topGainers,
    topLosers,
    trackedStockCount,
    latestUpdate,
  };
}

function toSummary(d: any) {
  return { symbol: d.symbol, price: d.price, percentageChange: d.percentageChange, volume: d.volume };
}

/** NSE/BSE regular session: Mon-Fri 09:15-15:30 IST. Simple approximation, not a holiday calendar. */
function isMarketOpenIST(): boolean {
  const nowIst = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const day = nowIst.getDay();
  if (day === 0 || day === 6) return false;
  const minutes = nowIst.getHours() * 60 + nowIst.getMinutes();
  return minutes >= 9 * 60 + 15 && minutes <= 15 * 60 + 30;
}
