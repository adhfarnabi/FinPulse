import { Schema, model, models, Document, Model } from 'mongoose';

export interface IStock extends Document {
  symbol: string;
  companyName: string;
  exchange: 'NSE' | 'BSE';
  sector: string;
  currency: 'INR';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StockSchema = new Schema<IStock>(
  {
    symbol: { type: String, required: true, uppercase: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    exchange: { type: String, required: true, enum: ['NSE', 'BSE'] },
    sector: { type: String, required: true, trim: true },
    currency: { type: String, required: true, default: 'INR', enum: ['INR'] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

StockSchema.index({ symbol: 1, exchange: 1 }, { unique: true });
StockSchema.index({ symbol: 1 });

export const Stock: Model<IStock> = (models.Stock as Model<IStock>) || model<IStock>('Stock', StockSchema);
