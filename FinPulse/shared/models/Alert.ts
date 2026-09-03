import { Schema, model, models, Document, Model, Types } from 'mongoose';

export interface IAlert extends Document {
  event: Types.ObjectId;
  eventId: string;
  symbol: string;
  alertType: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  isRead: boolean;
  triggeredAt: Date;
  createdAt: Date;
}

const AlertSchema = new Schema<IAlert>(
  {
    event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    eventId: { type: String, required: true },
    symbol: { type: String, required: true, uppercase: true },
    alertType: { type: String, required: true },
    message: { type: String, required: true },
    severity: { type: String, required: true, enum: ['INFO', 'WARNING', 'CRITICAL'] },
    isRead: { type: Boolean, default: false },
    triggeredAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Idempotency: never create two alerts for the same detected event.
AlertSchema.index({ eventId: 1 }, { unique: true });
AlertSchema.index({ symbol: 1, triggeredAt: -1 });
AlertSchema.index({ isRead: 1 });

export const Alert: Model<IAlert> = (models.Alert as Model<IAlert>) || model<IAlert>('Alert', AlertSchema);
