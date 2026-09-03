import { Schema, model, models, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const User: Model<IUser> = (models.User as Model<IUser>) || model<IUser>('User', UserSchema);
