import { Watchlist, WatchlistItem, Stock, MarketData } from '../../../shared/models';
import { ApiError } from '../middleware/error';

export async function listWatchlists(userId: string) {
  return Watchlist.find({ user: userId }).sort({ createdAt: -1 }).lean();
}

export async function createWatchlist(userId: string, name?: string) {
  return Watchlist.create({ user: userId, name: name?.trim() || 'My Watchlist' });
}

async function findOwned(userId: string, id: string) {
  const wl = await Watchlist.findOne({ _id: id, user: userId });
  if (!wl) throw new ApiError(404, 'Watchlist not found');
  return wl;
}

export async function getWatchlistDetail(userId: string, id: string) {
  const wl = await findOwned(userId, id);
  const items = await WatchlistItem.find({ watchlist: wl._id }).lean();

  const enriched = await Promise.all(
    items.map(async (item) => {
      const latest = await MarketData.findOne({ symbol: item.symbol }).sort({ timestamp: -1 }).lean();
      return {
        symbol: item.symbol,
        price: latest?.price ?? null,
        percentageChange: latest?.percentageChange ?? null,
      };
    }),
  );

  return { id: wl._id, name: wl.name, items: enriched };
}

export async function deleteWatchlist(userId: string, id: string) {
  const wl = await findOwned(userId, id);
  await WatchlistItem.deleteMany({ watchlist: wl._id });
  await wl.deleteOne();
  return { deleted: true };
}

export async function addWatchlistItem(userId: string, watchlistId: string, symbol: string) {
  const wl = await findOwned(userId, watchlistId);
  if (!symbol) throw new ApiError(400, 'symbol is required');

  const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
  if (!stock) throw new ApiError(404, `Stock ${symbol} not found`);

  try {
    return await WatchlistItem.create({ watchlist: wl._id, stock: stock._id, symbol: stock.symbol });
  } catch (err: any) {
    if (err?.code === 11000) throw new ApiError(409, `${stock.symbol} is already in this watchlist`);
    throw err;
  }
}

export async function removeWatchlistItem(userId: string, watchlistId: string, symbol: string) {
  const wl = await findOwned(userId, watchlistId);
  const result = await WatchlistItem.deleteOne({ watchlist: wl._id, symbol: symbol.toUpperCase() });
  if (result.deletedCount === 0) throw new ApiError(404, 'Item not found in watchlist');
  return { deleted: true };
}
