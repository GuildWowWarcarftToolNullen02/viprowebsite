import mongoose from 'mongoose';

export type NewsType = 'feature' | 'bugfix' | 'security' | 'maintenance' | 'release';

export interface INews {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  type: NewsType;
  published: boolean;
  publishedAt: Date;
  createdAt: Date;
}

const newsSchema = new mongoose.Schema<INews>({
  title:       { type: String, required: true },
  content:     { type: String, required: true },
  type:        { type: String, enum: ['feature', 'bugfix', 'security', 'maintenance', 'release'], default: 'feature' },
  published:   { type: Boolean, default: false },
  publishedAt: { type: Date, default: Date.now },
  createdAt:   { type: Date, default: Date.now },
});

export const News = mongoose.model<INews>('News', newsSchema);
