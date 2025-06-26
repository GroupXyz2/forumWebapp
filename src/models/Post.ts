import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';
import { IThread } from './Thread';

export interface IPost extends Document {
  content: string;       // HTML content for rendering
  rawContent?: string;   // Original markdown content
  author: mongoose.Types.ObjectId | IUser;
  thread: mongoose.Types.ObjectId | IThread;
  likes: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
}

const PostSchema: Schema = new Schema({
  content: { type: String, required: true },         // HTML content
  rawContent: { type: String },                      // Original markdown
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  thread: { type: Schema.Types.ObjectId, ref: 'Thread', required: true },
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  isEdited: { type: Boolean, default: false }
});

PostSchema.pre('save', function(next) {
  if (this.isModified('content') && !this.isNew) {
    this.isEdited = true;
  }
  next();
});

export default mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);
