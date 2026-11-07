import mongoose from 'mongoose';

/**
 * Shopping Cart Model
 * Supports both MSK tools and Exudos products in the same cart.
 */

export type CartItemType = 'msk-tool' | 'exudos-product';

export interface ICartItem {
  type: CartItemType;
  
  // For MSK tools
  mskProductId?: string; // 'token-g' | 'raider'
  mskPlan?: string; // 'monthly' | 'lifetime' | 'source'
  
  // For Exudos products
  exudosProductId?: number;
  exudosVariantId?: number;
  productName?: string;
  category?: string;
  
  // Common fields
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ICart {
  _id: mongoose.Types.ObjectId;
  
  // Cart ownership
  sessionId?: string; // For anonymous users
  userId?: string; // For logged-in users
  
  // Cart items
  items: ICartItem[];
  
  // Totals
  subtotal: number;
  total: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date; // Auto-delete after 7 days
}

const cartItemSchema = new mongoose.Schema<ICartItem>({
  type: { type: String, enum: ['msk-tool', 'exudos-product'], required: true },
  
  mskProductId: { type: String },
  mskPlan: { type: String },
  
  exudosProductId: { type: Number },
  exudosVariantId: { type: Number },
  productName: { type: String },
  category: { type: String },
  
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
}, { _id: false });

const cartSchema = new mongoose.Schema<ICart>({
  sessionId: { type: String, index: true, sparse: true },
  userId: { type: String, index: true, sparse: true },
  
  items: [cartItemSchema],
  
  subtotal: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), index: true },
});

// Update timestamp on save
cartSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Recalculate totals
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);
  this.total = this.subtotal;
  
  next();
});

// Auto-delete expired carts
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Cart = mongoose.model<ICart>('Cart', cartSchema);
