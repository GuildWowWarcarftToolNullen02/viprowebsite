import mongoose from 'mongoose';

export interface ILoginEntry {
  ip: string;
  ua: string;
  at: Date;
}

export interface IUser {
  _id: mongoose.Types.ObjectId;
  email: string;
  username: string;
  password?: string;
  provider: 'local' | 'discord' | 'google';
  providerId?: string;
  avatar?: string;
  emailVerified: boolean;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  resendCooldownUntil?: Date;
  resetPasswordToken?: string;
  resetPasswordTokenExpires?: Date;
  lastLogin?: Date;
  createdAt: Date;
  loginHistory: ILoginEntry[];
  // Linked OAuth providers (separate from primary provider)
  discordId?: string;
  discordAvatar?: string;
  googleId?: string;
  googleAvatar?: string;
}

const loginEntrySchema = new mongoose.Schema<ILoginEntry>(
  { ip: String, ua: String, at: { type: Date, default: Date.now } },
  { _id: false },
);

const userSchema = new mongoose.Schema<IUser>({
  email:                      { type: String, required: true, unique: true, lowercase: true, trim: true },
  username:                   { type: String, required: true, trim: true },
  password:                   { type: String },
  provider:                   { type: String, enum: ['local', 'discord', 'google'], default: 'local' },
  providerId:                 { type: String },
  avatar:                     { type: String },
  emailVerified:              { type: Boolean, default: false },
  verificationToken:          { type: String },
  verificationTokenExpires:   { type: Date },
  resendCooldownUntil:        { type: Date },
  resetPasswordToken:         { type: String },
  resetPasswordTokenExpires:  { type: Date },
  lastLogin:                  { type: Date },
  createdAt:                  { type: Date, default: Date.now },
  loginHistory:               { type: [loginEntrySchema], default: [] },
  discordId:                  { type: String },
  discordAvatar:              { type: String },
  googleId:                   { type: String },
  googleAvatar:               { type: String },
});

export const User = mongoose.model<IUser>('User', userSchema);
