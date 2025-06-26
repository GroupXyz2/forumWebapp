import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  image?: string;
  discordId: string;
  role: 'user' | 'moderator' | 'admin';
  isBanned: boolean;
  banReason?: string;
  bannedUntil?: Date;
  isMuted: boolean;
  mutedUntil?: Date;
  warningCount: number;
  warnings?: Array<{
    reason: string;
    date: Date;
    issuedBy: mongoose.Types.ObjectId;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  image: { type: String },
  discordId: { type: String, required: true, unique: true },
  role: { type: String, enum: ['user', 'moderator', 'admin'], default: 'user' },
  isBanned: { type: Boolean, default: false },
  banReason: { type: String },
  bannedUntil: { type: Date },
  isMuted: { type: Boolean, default: false },
  mutedUntil: { type: Date },
  warningCount: { type: Number, default: 0 },
  warnings: [{
    reason: { type: String, required: true },
    date: { type: Date, default: Date.now },
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
