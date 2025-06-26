import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: { en: string; de: string };
  description: { en: string; de: string };
  slug: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema = new Schema({
  name: { 
    en: { type: String, required: true },
    de: { type: String, required: true }
  },
  description: { 
    en: { type: String, required: true },
    de: { type: String, required: true }
  },
  slug: { type: String, required: true, unique: true },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
