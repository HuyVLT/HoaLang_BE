import { Schema, model, Document } from 'mongoose';

export interface IUser {
  email: string;
  name: string;
  password?: string;
  avatar?: string;
  googleId?: string;
  role: 'USER' | 'VILLAGE_OWNER' | 'ADMIN';
  locale: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserDocument = IUser & Document;

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    password: { type: String, select: false },
    avatar: { type: String },
    googleId: { type: String },
    role: {
      type: String,
      enum: ['USER', 'VILLAGE_OWNER', 'ADMIN'],
      default: 'USER',
      required: true,
    },
    locale: { type: String, default: 'vi' },
  },
  { timestamps: true }
);

export const User = model<IUser>('User', UserSchema);
export default User;
