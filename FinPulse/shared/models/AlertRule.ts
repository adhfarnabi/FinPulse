import { Schema, model, models, Document, Model, Types } from 'mongoose';

export type AlertRuleType = 'PRICE_CHANGE' | 'PRICE_TARGET' | 'VOLUME';
export type AlertRuleOperator = '>' | '<' | '>=' | '<=' | '=';

export interface IAlertRule extends Document {
  user: Types.ObjectId;
  stock: Types.ObjectId;
  symbol: string;
  ruleType: AlertRuleType;
  operator: AlertRuleOperator;
  threshold: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AlertRuleSchema = new Schema<IAlertRule>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stock: { type: Schema.Types.ObjectId, ref: 'Stock', required: true },
    symbol: { type: String, required: true, uppercase: true },
    ruleType: { type: String, required: true, enum: ['PRICE_CHANGE', 'PRICE_TARGET', 'VOLUME'] },
    operator: { type: String, required: true, enum: ['>', '<', '>=', '<=', '='] },
    threshold: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

AlertRuleSchema.index({ user: 1, isActive: 1 });
AlertRuleSchema.index({ symbol: 1, isActive: 1 });

export const AlertRule: Model<IAlertRule> = (models.AlertRule as Model<IAlertRule>) || model<IAlertRule>('AlertRule', AlertRuleSchema);
