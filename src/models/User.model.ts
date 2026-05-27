import { Schema, model } from 'mongoose';

const UserSchema = new Schema({
  email:     { type: String, required: true, unique: true },
  name:      { type: String, required: true },
  password:  { type: String, select: false },
  avatar:    String,
  googleId:  String,
  role:      { type: String, enum: ['USER', 'VILLAGE_OWNER', 'ADMIN'], default: 'USER' },
  locale:    { type: String, default: 'vi' },
}, { timestamps: true });

export const User = model('User', UserSchema);
export default User;
