import { Event, Alert, MarketData, Stock } from '../../../shared/models';
import { getPortfolioSummary } from './portfolioService';

export async function getAnalyticsSummary(userId: string) {
  const portfolio = await getPortfolioSummary(userId);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [activeAlerts, eventsToday, trackedStocks] = await Promise.all([
    Alert.countDocuments({ isRead: false }),
    Event.countDocuments({ timestamp: { $gte: startOfToday } }),
    Stock.countDocuments({ isActive: true }),
  ]);

  const sortedByReturn = [...portfolio.positions].sort((a, b) => b.returnPercentage - a.returnPercentage);

  return {
    totalInvestment: portfolio.totalInvestment,
    currentValue: portfolio.totalCurrentValue,
    pnl: portfolio.totalPnl,
    returnPercentage: portfolio.totalReturnPercentage,
    activeAlerts,
    eventsToday,
    trackedStocks,
    bestPerformer: sortedByReturn[0] ?? null,
    worstPerformer: sortedByReturn[sortedByReturn.length - 1] ?? null,
  };
}

export async function getPerformanceSeries(userId: string, symbol?: string) {
  // Chart-ready time series for either a single symbol or, if omitted, the whole tracked universe.
  const match: Record<string, unknown> = {};
  if (symbol) match.symbol = symbol.toUpperCase();

  return MarketData.aggregate([
    { $match: match },
    { $sort: { timestamp: 1 } },
    {
      $group: {
        _id: { symbol: '$symbol', day: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp', timezone: 'Asia/Kolkata' } } },
        avgPrice: { $avg: '$price' },
        closePrice: { $last: '$price' },
        volume: { $sum: '$volume' },
      },
    },
    { $sort: { '_id.day': 1 } },
    { $project: { _id: 0, symbol: '$_id.symbol', date: '$_id.day', avgPrice: 1, closePrice: 1, volume: 1 } },
  ]);
}

export async function getEventAnalytics() {
  const [byType, bySeverity, bySymbol] = await Promise.all([
    Event.aggregate([{ $group: { _id: '$eventType', count: { $sum: 1 } } }]),
    Event.aggregate([{ $group: { _id: '$severity', count: { $sum: 1 } } }]),
    Event.aggregate([{ $group: { _id: '$symbol', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
  ]);

  return {
    eventTypeDistribution: byType.map((d) => ({ eventType: d._id, count: d.count })),
    severityDistribution: bySeverity.map((d) => ({ severity: d._id, count: d.count })),
    topSymbolsByEventCount: bySymbol.map((d) => ({ symbol: d._id, count: d.count })),
  };
}

export async function getGainersLosers(limit = 5) {
  const latestPerSymbol = await MarketData.aggregate([
    { $sort: { timestamp: -1 } },
    { $group: { _id: '$symbol', doc: { $first: '$$ROOT' } } },
    { $replaceRoot: { newRoot: '$doc' } },
  ]);

  const sorted = [...latestPerSymbol].sort((a, b) => b.percentageChange - a.percentageChange);
  return {
    gainers: sorted.slice(0, limit).map((d) => ({ symbol: d.symbol, price: d.price, percentageChange: d.percentageChange })),
    losers: sorted
      .slice(-limit)
      .reverse()
      .map((d) => ({ symbol: d.symbol, price: d.price, percentageChange: d.percentageChange })),
  };
}
