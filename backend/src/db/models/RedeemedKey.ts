import mongoose from 'mongoose';

/**
 * Tracks license keys that were redeemed through the dashboard
 * (pre-existing customers who purchased before the website existed).
 *
 * Invariants enforced by DB:
 *   - licenseKey is globally unique - one key can only ever be redeemed once
 *   - (userId, licenseKey) pair is unique - redundant safety index
 */
export interface IRedeemedKey {
  _id: mongoose.Types.ObjectId;
  userId: string;         // User._id who redeemed it
  email: string;          // User.email at time of redemption (denormalised for queries)
  licenseKey: string;     // The MSK-XXXXXXX-XXXXXXX-XXXXXXX-XXXXXXX key
  product: string;        // Detected product: 'token-g' | 'raider'
  plan: string;           // Plan label stored at redemption time (e.g. 'lifetime')
  redeemedAt: Date;
}

const redeemedKeySchema = new mongoose.Schema<IRedeemedKey>({
  userId:     { type: String, required: true, index: true },
  email:      { type: String, required: true },
  licenseKey: { type: String, required: true, unique: true }, // global uniqueness - one redemption per key
  product:    { type: String, required: true },
  plan:       { type: String, required: true },
  redeemedAt: { type: Date, default: Date.now },
});

// Compound index for ownership lookups
redeemedKeySchema.index({ userId: 1, licenseKey: 1 }, { unique: true });

export const RedeemedKey = mongoose.model<IRedeemedKey>('RedeemedKey', redeemedKeySchema);
