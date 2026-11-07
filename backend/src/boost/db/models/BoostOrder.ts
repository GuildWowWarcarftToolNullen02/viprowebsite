import mongoose from 'mongoose';

export type ProductId = 'boost-1m' | 'nitro-1m' | 'discord-token';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired';
export type FulfillmentStatus = 'pending' | 'processing' | 'completed' | 'partial' | 'failed';

export interface IBoostOrder {
  _id: mongoose.Types.ObjectId;
  internalId: string;
  email: string;
  product: ProductId;
  quantity: number;
  unitPrice: number;          // our selling price per unit
  supplierUnitCost: number;   // supplier cost per unit at order time
  totalPrice: number;         // unitPrice * quantity

  // Boost-specific
  inviteCode?: string;        // cleaned invite code (code only, no URL)
  serverId?: string;
  serverName?: string;
  serverIcon?: string;        // CDN URL

  // Payment
  paymentStatus: PaymentStatus;
  nowPaymentsPaymentId?: string;

  // Fulfillment
  fulfillmentStatus: FulfillmentStatus;
  supplierJobId?: string;      // for boost task jobs (salta7 job_id)
  supplierTxId?: string;       // for /buy orders (used as client_tx_id)
  boostsDelivered?: number;
  deliveredItemCount?: number; // count only - raw tokens stored separately
  _deliveredItems?: string[];  // raw tokens/accounts - stored for one-time retrieval, never logged

  createdAt: Date;
  updatedAt: Date;
}

const schema = new mongoose.Schema<IBoostOrder>({
  internalId:          { type: String, required: true, unique: true, index: true },
  email:               { type: String, required: true },
  product:             { type: String, required: true },
  quantity:            { type: Number, required: true },
  unitPrice:           { type: Number, required: true },
  supplierUnitCost:    { type: Number, required: true },
  totalPrice:          { type: Number, required: true },

  inviteCode:          { type: String },
  serverId:            { type: String },
  serverName:          { type: String },
  serverIcon:          { type: String },

  paymentStatus:       { type: String, enum: ['pending','paid','failed','expired'], default: 'pending' },
  nowPaymentsPaymentId:{ type: String },

  fulfillmentStatus:   { type: String, enum: ['pending','processing','completed','partial','failed'], default: 'pending' },
  supplierJobId:       { type: String },
  supplierTxId:        { type: String },
  boostsDelivered:     { type: Number },
  deliveredItemCount:  { type: Number },
  _deliveredItems:     { type: [String], select: false },  // excluded by default; retrieved explicitly

  createdAt:           { type: Date, default: Date.now },
  updatedAt:           { type: Date, default: Date.now },
});

// Compound index for reserved balance queries
schema.index({ paymentStatus: 1, fulfillmentStatus: 1 });

export const BoostOrder = mongoose.model<IBoostOrder>('BoostOrder', schema);
