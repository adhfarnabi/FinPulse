import { Schema, model, models, Document, Model, Types } from 'mongoose';

export interface IWatchlist extends Document {
  user: Types.ObjectId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const WatchlistSchema = new Schema<IWatchlist>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, default: 'My Watchlist' },
  },
  { timestamps: true },
);

export const Watchlist: Model<IWatchlist> = (models.Watchlist as Model<IWatchlist>) || model<IWatchlist>('Watchlist', WatchlistSchema);

export interface IWatchlistItem extends Document {
  watchlist: Types.ObjectId;
  stock: Types.ObjectId;
  symbol: string;
  createdAt: Date;
}

const WatchlistItemSchema = new Schema<IWatchlistItem>(
  {
    watchlist: { type: Schema.Types.ObjectId, ref: 'Watchlist', required: true },
    stock: { type: Schema.Types.ObjectId, ref: 'Stock', required: true },
    symbol: { type: String, required: true, uppercase: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

WatchlistItemSchema.index({ watchlist: 1, stock: 1 }, { unique: true });

export const WatchlistItem: Model<IWatchlistItem> = (models.WatchlistItem as Model<IWatchlistItem>) || model<IWatchlistItem>('WatchlistItem', WatchlistItemSchema);
