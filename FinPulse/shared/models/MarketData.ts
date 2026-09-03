import { Schema, model, models, Document, Model, Types } from 'mongoose';

export interface IMarketData extends Document {
  stock: Types.ObjectId;
  symbol: string;
  price: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  previousClose: number;
  volume: number;
  marketCap?: number;
  currency: 'INR';
  percentageChange: number;
  timestamp: Date;
  source: 'demo' | 'live';
  createdAt: Date;
}

const MarketDataSchema = new Schema<IMarketData>(
  {
    stock: { type: Schema.Types.ObjectId, ref: 'Stock', required: true },
    symbol: { type: String, required: true, uppercase: true },
    price: { type: Number, required: true },
    openPrice: { type: Number, required: true },
    highPrice: { type: Number, required: true },
    lowPrice: { type: Number, required: true },
    previousClose: { type: Number, required: true },
    volume: { type: Number, required: true },
    marketCap: { type: Number },
    currency: { type: String, required: true, default: 'INR' },
    percentageChange: { type: Number, required: true },
    timestamp: { type: Date, required: true },
    source: { type: String, required: true, enum: ['demo', 'live'] },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

MarketDataSchema.index({ symbol: 1, timestamp: -1 });
MarketDataSchema.index({ stock: 1, timestamp: -1 });

export const MarketData: Model<IMarketData> = (models.MarketData as Model<IMarketData>) || model<IMarketData>('MarketData', MarketDataSchema);
