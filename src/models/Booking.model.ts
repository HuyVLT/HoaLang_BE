import { Schema, model } from 'mongoose';

const BookingSchema = new Schema({
  userId:       { type: Schema.Types.ObjectId, ref: 'User', required: true },
  experienceId: { type: Schema.Types.ObjectId, ref: 'Experience', required: true },
  date:         Date,
  guests:       Number,
  status:       { type: String, enum: ['PENDING','CONFIRMED','CANCELLED','COMPLETED'], default: 'PENDING' },
  totalPrice:   Number,
}, { timestamps: true });

export const Booking = model('Booking', BookingSchema);
export default Booking;
