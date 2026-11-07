import mongoose from 'mongoose';

export interface IOrder {
  _id: mongoose.Types.ObjectId;
  internalId: string;
  email: string;
  product: string;
  plan: string;
  status: 'pending' | 'fulfilling' | 'paid' | 'failed' | 'expired';
  licenseKey?: string;
  nowPaymentsPaymentId?: string;
  nowPaymentsRealPaymentId?: string;
  amountUsd: number;
  userNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new mongoose.Schema<IOrder>({
  internalId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  product: { type: String, required: true },
  plan: { type: String, required: true },
  status: { type: String, enum: ['pending', 'fulfilling', 'paid', 'failed', 'expired'], default: 'pending' },
  licenseKey: { type: String },
  nowPaymentsPaymentId: { type: String },
  nowPaymentsRealPaymentId: { type: String },
  amountUsd: { type: Number, required: true },
  userNote: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Order = mongoose.model<IOrder>('Order', orderSchema);
