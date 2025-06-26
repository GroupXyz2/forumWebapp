import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';

export interface IThread extends Document {
  title: string;
  content: string;
  author: mongoose.Types.ObjectId | IUser;
  category: mongoose.Types.ObjectId;
  views: number;
  viewedBy: mongoose.Types.ObjectId[];
  isPinned: boolean;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastPostAt: Date;
}

const ThreadSchema: Schema = new Schema({
  title: { type: String, required: true },
  content: { type: String, default: '' }, // Not required as content is stored in first post
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  views: { type: Number, default: 0 },
  viewedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  isPinned: { type: Boolean, default: false },
  isLocked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastPostAt: { type: Date, default: Date.now }
});

export default mongoose.models.Thread || mongoose.model<IThread>('Thread', ThreadSchema);
