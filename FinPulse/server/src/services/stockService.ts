import { Stock, MarketData } from '../../../shared/models';
import { ApiError } from '../middleware/error';

/** Fetch the latest MarketData tick for each of the given symbols in one query (avoids N+1). */
async function latestTicksBySymbol(symbols: string[]): Promise<Map<string, any>> {
  if (symbols.length === 0) return new Map();

  const latest = await MarketData.aggregate([
    { $match: { symbol: { $in: symbols } } },
    { $sort: { timestamp: -1 } },
    { $group: { _id: '$symbol', doc: { $first: '$$ROOT' } } },
    { $replaceRoot: { newRoot: '$doc' } },
  ]);

  return new Map(latest.map((d) => [d.symbol, d]));
}

export async function listStocks(params: { search?: string; exchange?: string; sector?: string; page: number; limit: number }) {
  const filter: Record<string, unknown> = { isActive: true };
  if (params.exchange) filter.exchange = params.exchange;
  if (params.sector) {
    filter.sector = params.sector;
  } else {
    filter.sector = { $ne: 'Index' }; // NIFTY50/SENSEX are indices, not tradeable stocks — excluded unless explicitly requested
  }
  if (params.search) {
    filter.$or = [
      { symbol: { $regex: params.search, $options: 'i' } },
      { companyName: { $regex: params.search, $options: 'i' } },
    ];
  }

  const skip = (params.page - 1) * params.limit;
  const [stocks, total] = await Promise.all([
    Stock.find(filter).sort({ symbol: 1 }).skip(skip).limit(params.limit).lean(),
    Stock.countDocuments(filter),
  ]);

  const ticks = await latestTicksBySymbol(stocks.map((s) => s.symbol));

  const items = stocks.map((stock) => {
    const latest = ticks.get(stock.symbol);
    return {
      symbol: stock.symbol,
      companyName: stock.companyName,
      exchange: stock.exchange,
      sector: stock.sector,
      currency: stock.currency,
      latestPrice: latest?.price ?? null,
      percentageChange: latest?.percentageChange ?? null,
      volume: latest?.volume ?? null,
      timestamp: latest?.timestamp ?? null,
      source: latest?.source ?? null,
    };
  });

  return { items, total, page: params.page, limit: params.limit, pages: Math.ceil(total / params.limit) };
}

export async function getStockDetail(symbol: string) {
  const stock = await Stock.findOne({ symbol: symbol.toUpperCase() }).lean();
  if (!stock) throw new ApiError(404, `Stock ${symbol} not found`);

  const latest = await MarketData.findOne({ symbol: stock.symbol }).sort({ timestamp: -1 }).lean();

  return {
    symbol: stock.symbol,
    companyName: stock.companyName,
    exchange: stock.exchange,
    sector: stock.sector,
    currency: stock.currency,
    latestPrice: latest?.price ?? null,
    percentageChange: latest?.percentageChange ?? null,
    volume: latest?.volume ?? null,
    timestamp: latest?.timestamp ?? null,
    source: latest?.source ?? null,
  };
}

const MAX_HISTORY_LIMIT = 500;

export async function getStockHistory(symbol: string, params: { start?: string; end?: string; limit?: number }) {
  const stock = await Stock.findOne({ symbol: symbol.toUpperCase() }).lean();
  if (!stock) throw new ApiError(404, `Stock ${symbol} not found`);

  const filter: Record<string, unknown> = { symbol: stock.symbol };
  const range: Record<string, Date> = {};
  if (params.start) range.$gte = new Date(params.start);
  if (params.end) range.$lte = new Date(params.end);
  if (Object.keys(range).length > 0) filter.timestamp = range;

  const limit = Math.min(params.limit ?? 100, MAX_HISTORY_LIMIT); // never return unlimited records

  const history = await MarketData.find(filter).sort({ timestamp: -1 }).limit(limit).lean();
  return history.reverse(); // chronological order for charting
}
