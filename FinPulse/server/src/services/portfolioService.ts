import { mongoose } from '../../../shared/db/connect';
import { Portfolio, PortfolioPosition, Transaction, Stock, MarketData } from '../../../shared/models';
import { ApiError } from '../middleware/error';
import { investedValue, currentValue, profitAndLoss, returnPercentage } from '../../../shared/utils/finance';

async function getOrCreatePortfolio(userId: string) {
  let portfolio = await Portfolio.findOne({ user: userId });
  if (!portfolio) portfolio = await Portfolio.create({ user: userId, name: 'My Portfolio' });
  return portfolio;
}

export async function getPortfolioSummary(userId: string) {
  const portfolio = await getOrCreatePortfolio(userId);
  const positions = await PortfolioPosition.find({ portfolio: portfolio._id }).lean();

  const enriched = await Promise.all(
    positions.map(async (p) => {
      const latest = await MarketData.findOne({ symbol: p.symbol }).sort({ timestamp: -1 }).lean();
      const currentPrice = latest?.price ?? p.averagePrice;
      const invested = investedValue(p.quantity, p.averagePrice);
      const current = currentValue(p.quantity, currentPrice);
      const pnl = profitAndLoss(current, invested);
      return {
        symbol: p.symbol,
        quantity: p.quantity,
        averagePrice: p.averagePrice,
        currentPrice,
        investedValue: invested,
        currentValue: current,
        pnl,
        returnPercentage: returnPercentage(pnl, invested),
      };
    }),
  );

  const totalInvestment = enriched.reduce((s, p) => s + p.investedValue, 0);
  const totalCurrentValue = enriched.reduce((s, p) => s + p.currentValue, 0);
  const totalPnl = profitAndLoss(totalCurrentValue, totalInvestment);

  return {
    portfolioId: portfolio._id,
    totalInvestment,
    totalCurrentValue,
    totalPnl,
    totalReturnPercentage: returnPercentage(totalPnl, totalInvestment),
    positions: enriched,
  };
}

export async function getPositions(userId: string) {
  const portfolio = await getOrCreatePortfolio(userId);
  return PortfolioPosition.find({ portfolio: portfolio._id }).lean();
}

export async function createTransaction(
  userId: string,
  body: { symbol?: string; transactionType?: string; quantity?: number; price?: number },
) {
  const { symbol, transactionType, quantity, price } = body;
  if (!symbol) throw new ApiError(400, 'symbol is required');
  if (transactionType !== 'BUY' && transactionType !== 'SELL') throw new ApiError(400, 'transactionType must be BUY or SELL');
  if (typeof quantity !== 'number' || quantity <= 0) throw new ApiError(400, 'quantity must be a positive number');
  if (typeof price !== 'number' || price <= 0) throw new ApiError(400, 'price must be a positive number');

  const stock = await Stock.findOne({ symbol: symbol.toUpperCase() });
  if (!stock) throw new ApiError(404, `Stock ${symbol} not found`);

  const portfolio = await getOrCreatePortfolio(userId);

  const session = await mongoose.startSession();
  try {
    let result: any;
    await session.withTransaction(async () => {
      const position = await PortfolioPosition.findOne({ portfolio: portfolio._id, stock: stock._id }).session(session);

      if (transactionType === 'BUY') {
        if (position) {
          const totalQty = position.quantity + quantity;
          const totalCost = position.quantity * position.averagePrice + quantity * price;
          position.quantity = totalQty;
          position.averagePrice = totalCost / totalQty;
          await position.save({ session });
        } else {
          await PortfolioPosition.create(
            [{ portfolio: portfolio._id, stock: stock._id, symbol: stock.symbol, quantity, averagePrice: price }],
            { session },
          );
        }
      } else {
        // SELL — reject selling more than owned (no short selling implemented)
        if (!position || position.quantity < quantity) {
          throw new ApiError(400, `Cannot sell ${quantity} shares of ${stock.symbol}: only ${position?.quantity ?? 0} owned`);
        }
        position.quantity -= quantity;
        if (position.quantity === 0) {
          await position.deleteOne({ session });
        } else {
          await position.save({ session });
        }
      }

      const totalAmount = quantity * price;
      const [txn] = await Transaction.create(
        [
          {
            portfolio: portfolio._id,
            stock: stock._id,
            symbol: stock.symbol,
            transactionType,
            quantity,
            price,
            totalAmount,
            transactionTimestamp: new Date(),
          },
        ],
        { session },
      );
      result = txn;
    });
    return result;
  } finally {
    await session.endSession();
  }
}
