import { Schema, model, models, Document, Model, Types } from 'mongoose';

export interface IPortfolio extends Document {
  user: Types.ObjectId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioSchema = new Schema<IPortfolio>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, default: 'My Portfolio' },
  },
  { timestamps: true },
);

export const Portfolio: Model<IPortfolio> = (models.Portfolio as Model<IPortfolio>) || model<IPortfolio>('Portfolio', PortfolioSchema);

export interface IPortfolioPosition extends Document {
  portfolio: Types.ObjectId;
  stock: Types.ObjectId;
  symbol: string;
  quantity: number;
  averagePrice: number;
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioPositionSchema = new Schema<IPortfolioPosition>(
  {
    portfolio: { type: Schema.Types.ObjectId, ref: 'Portfolio', required: true },
    stock: { type: Schema.Types.ObjectId, ref: 'Stock', required: true },
    symbol: { type: String, required: true, uppercase: true },
    quantity: { type: Number, required: true, default: 0 },
    averagePrice: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

PortfolioPositionSchema.index({ portfolio: 1, stock: 1 }, { unique: true });

export const PortfolioPosition: Model<IPortfolioPosition> = (models.PortfolioPosition as Model<IPortfolioPosition>) || model<IPortfolioPosition>('PortfolioPosition', PortfolioPositionSchema);

export interface ITransaction extends Document {
  portfolio: Types.ObjectId;
  stock: Types.ObjectId;
  symbol: string;
  transactionType: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  totalAmount: number;
  transactionTimestamp: Date;
  createdAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    portfolio: { type: Schema.Types.ObjectId, ref: 'Portfolio', required: true },
    stock: { type: Schema.Types.ObjectId, ref: 'Stock', required: true },
    symbol: { type: String, required: true, uppercase: true },
    transactionType: { type: String, required: true, enum: ['BUY', 'SELL'] },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    totalAmount: { type: Number, required: true },
    transactionTimestamp: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

TransactionSchema.index({ portfolio: 1, transactionTimestamp: -1 });

export const Transaction: Model<ITransaction> = (models.Transaction as Model<ITransaction>) || model<ITransaction>('Transaction', TransactionSchema);
