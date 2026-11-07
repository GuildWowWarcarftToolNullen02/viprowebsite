import mongoose from 'mongoose';

/**
 * Exudos Order Model
 * Tracks orders placed through the Exudos reseller API.
 * 
 * IMPORTANT: This is completely white-labeled - no Exudos branding exposed to customers.
 */

export type ExudosOrderStatus = 'pending' | 'paid' | 'processing' | 'completed' | 'failed' | 'refunded';

export interface IExudosOrder {
  _id: mongoose.Types.ObjectId;
  
  // Internal tracking
  internalId: string; // Our UUID for this order
  
  // Customer info
  email: string;
  userId?: string; // If customer is logged in
  
  // Product details
  productId: number; // Exudos product ID
  variantId: number; // Exudos variant ID
  productName: string; // Product name (for display)
  variantName?: string; // Variant name if applicable
  category: string; // Category (Streaming, Music, etc)
  
  // Pricing
  quantity: number;
  unitPrice: number; // Our selling price (after markup)
  totalPrice: number; // Total amount charged to customer
  supplierCost: number; // What we paid Exudos
  
  // Order status
  status: ExudosOrderStatus;
  
  // Payment tracking
  nowPaymentsPaymentId?: string; // NowPayments invoice/payment ID
  nowPaymentsRealPaymentId?: string; // Real payment ID from IPN
  
  // Exudos tracking (internal only, never shown to customer)
  exudosInvoiceId?: number;
  idempotencyKey: string; // For safe retries
  
  // Delivery
  deliveredContent?: string[]; // Delivered items (encrypted/hashed for security)
  deliveryNote?: string; // Any special delivery instructions
  
  // Error tracking (internal only)
  errorMessage?: string;
  retryCount: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
  deliveredAt?: Date;
}

const exudosOrderSchema = new mongoose.Schema<IExudosOrder>({
  internalId: { type: String, required: true, unique: true, index: true },
  
  email: { type: String, required: true, index: true },
  userId: { type: String, index: true },
  
  productId: { type: Number, required: true },
  variantId: { type: Number, required: true },
  productName: { type: String, required: true },
  variantName: { type: String },
  category: { type: String, required: true, index: true },
  
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  supplierCost: { type: Number, required: true },
  
  status: { 
    type: String, 
    enum: ['pending', 'paid', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending',
    index: true,
  },
  
  nowPaymentsPaymentId: { type: String },
  nowPaymentsRealPaymentId: { type: String },
  
  exudosInvoiceId: { type: Number },
  idempotencyKey: { type: String, required: true, unique: true },
  
  deliveredContent: [{ type: String }],
  deliveryNote: { type: String },
  
  errorMessage: { type: String },
  retryCount: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now },
  paidAt: { type: Date },
  deliveredAt: { type: Date },
});

// Update timestamp on save
exudosOrderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Indexes for common queries
exudosOrderSchema.index({ email: 1, createdAt: -1 });
exudosOrderSchema.index({ userId: 1, createdAt: -1 });
exudosOrderSchema.index({ status: 1, createdAt: -1 });

export const ExudosOrder = mongoose.model<IExudosOrder>('ExudosOrder', exudosOrderSchema);
