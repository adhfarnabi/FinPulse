import { Schema, model, models, Document, Model, Types } from 'mongoose';

export interface IEvent extends Document {
  eventId: string;
  eventType: 'PRICE_UPDATE' | 'PRICE_SPIKE' | 'PRICE_DROP' | 'HIGH_VOLUME' | 'NEW_HIGH' | 'NEW_LOW' | 'PRICE_TARGET';
  stock: Types.ObjectId;
  symbol: string;
  price: number;
  previousPrice: number;
  percentageChange: number;
  volume: number;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  metadata: Record<string, unknown>;
  timestamp: Date;
  processedAt: Date;
  createdAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    eventId: { type: String, required: true, unique: true },
    eventType: {
      type: String,
      required: true,
      enum: ['PRICE_UPDATE', 'PRICE_SPIKE', 'PRICE_DROP', 'HIGH_VOLUME', 'NEW_HIGH', 'NEW_LOW', 'PRICE_TARGET'],
    },
    stock: { type: Schema.Types.ObjectId, ref: 'Stock', required: true },
    symbol: { type: String, required: true, uppercase: true },
    price: { type: Number, required: true },
    previousPrice: { type: Number, required: true },
    percentageChange: { type: Number, required: true },
    volume: { type: Number, required: true },
    severity: { type: String, required: true, enum: ['INFO', 'WARNING', 'CRITICAL'] },
    metadata: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, required: true },
    processedAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

EventSchema.index({ symbol: 1, timestamp: -1 });
EventSchema.index({ eventType: 1, timestamp: -1 });
EventSchema.index({ severity: 1, timestamp: -1 });

export const Event: Model<IEvent> = (models.Event as Model<IEvent>) || model<IEvent>('Event', EventSchema);
