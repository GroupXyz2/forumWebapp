import mongoose, { Schema, Document } from 'mongoose';

export interface ISiteSetting extends Document {
  key: string;
  value: {
    en: string;
    de: string;
  } | string;
  type: 'string' | 'text' | 'color' | 'image';
  scope: 'homepage' | 'global' | 'forum' | 'content';
  updatedAt: Date;
}

const SiteSettingSchema: Schema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { 
    type: Schema.Types.Mixed, 
    required: true,
  },
  type: { 
    type: String, 
    enum: ['string', 'text', 'color', 'image'], 
    default: 'string' 
  },
  scope: { 
    type: String, 
    enum: ['homepage', 'global', 'forum', 'content'], 
    default: 'global' 
  },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field on save
SiteSettingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.SiteSetting || mongoose.model<ISiteSetting>('SiteSetting', SiteSettingSchema);
