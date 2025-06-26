import mongoose, { Schema, Document } from 'mongoose';

export interface IBannedAccount extends Document {
  discordId: string;
  email: string;
  reason: string;
  bannedAt: Date;
  bannedUntil?: Date; // Optional for temporary bans
  bannedBy: mongoose.Types.ObjectId | string; // User ID who enacted the ban
  bannedUsername: string; // Username at the time of banning
  isAccountDeletion: boolean; // Whether the ban is from a user deleting their account while banned
}

const BannedAccountSchema: Schema = new Schema({
  discordId: { type: String, required: true, index: true },
  email: { type: String, required: true, index: true },
  reason: { type: String, required: true },
  bannedAt: { type: Date, default: Date.now },
  bannedUntil: { type: Date }, // Optional for temporary bans
  bannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bannedUsername: { type: String, required: true },
  isAccountDeletion: { type: Boolean, default: false }
});

// Create compound indices to quickly find accounts by discordId or email
BannedAccountSchema.index({ discordId: 1, email: 1 });

export default mongoose.models.BannedAccount || 
  mongoose.model<IBannedAccount>('BannedAccount', BannedAccountSchema);
