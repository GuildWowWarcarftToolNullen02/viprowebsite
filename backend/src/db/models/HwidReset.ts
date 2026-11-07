import mongoose from 'mongoose';

export interface IHwidReset {
  _id: mongoose.Types.ObjectId;
  userId: string;
  licenseKey: string;
  lastResetAt: Date;
}

const hwidResetSchema = new mongoose.Schema<IHwidReset>({
  userId:      { type: String, required: true },
  licenseKey:  { type: String, required: true },
  lastResetAt: { type: Date, required: true },
});

hwidResetSchema.index({ userId: 1, licenseKey: 1 }, { unique: true });

export const HwidReset = mongoose.model<IHwidReset>('HwidReset', hwidResetSchema);
