import mongoose from 'mongoose';

export interface ISalesStats {
  _id: string;
  totalBoostsSold: number;
  totalOrdersCompleted: number;
  lastUpdated: Date;
}

const schema = new mongoose.Schema<ISalesStats>({
  _id:                   { type: String },
  totalBoostsSold:       { type: Number, default: 0 },
  totalOrdersCompleted:  { type: Number, default: 0 },
  lastUpdated:           { type: Date, default: Date.now },
});

export const SalesStats = mongoose.model<ISalesStats>('SalesStats', schema);

const GLOBAL_ID = 'global';

export async function getStats(): Promise<ISalesStats> {
  let doc = await SalesStats.findById(GLOBAL_ID);
  if (!doc) {
    doc = await SalesStats.create({ _id: GLOBAL_ID, totalBoostsSold: 0, totalOrdersCompleted: 0 });
  }
  return doc;
}

export async function incrementBoostsSold(boosts: number): Promise<void> {
  await SalesStats.findByIdAndUpdate(
    GLOBAL_ID,
    { $inc: { totalBoostsSold: boosts, totalOrdersCompleted: 1 }, $set: { lastUpdated: new Date() } },
    { upsert: true },
  );
}
