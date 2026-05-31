import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser {
  email: string;
  fullName: string;
  password?: string;
  phone?: string;
  avatar?: string;
  type: 'Local' | 'GOOGLE';
  socialLogin: boolean;
  googleId?: string;
  role: 'USER' | 'VILLAGE_OWNER' | 'ADMIN';
  isVerified: boolean;
  status: 'ACTIVE' | 'BLOCKED';
  locale: string;
  walletBalance: number;
  verificationExpiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserDocument = IUser & Document;

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    password: {
      type: String,
      select: false,
      required: function (this: any) {
        return !this.socialLogin;
      },
    },
    phone: { type: String },
    avatar: { type: String },
    type: { type: String, enum: ['Local', 'GOOGLE'], default: 'Local' },
    socialLogin: { type: Boolean, default: false },
    googleId: { type: String },
    role: {
      type: String,
      enum: ['USER', 'VILLAGE_OWNER', 'ADMIN'],
      default: 'USER',
      required: true,
    },
    isVerified: { type: Boolean, default: false },
    status: { type: String, enum: ['ACTIVE', 'BLOCKED'], default: 'ACTIVE' },
    locale: { type: String, default: 'vi' },
    walletBalance: { type: Number, default: 0 },
    verificationExpiresAt: { type: Date },
  },
  { timestamps: true }
);


// Pre-save hook to hash password automatically
UserSchema.pre('save', async function (this: any) {
  if (!this.isModified('password')) return;
  if (!this.password) return;

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error: any) {
    throw error;
  }
});

// TTL index to automatically delete unverified accounts after 15 minutes
UserSchema.index({ verificationExpiresAt: 1 }, { expireAfterSeconds: 0 });

export const User = model<IUser>('User', UserSchema);
export default User;

