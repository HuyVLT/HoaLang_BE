import { Schema, Connection, Model, Types } from 'mongoose';

export interface IBooking {
  userId: Types.ObjectId;        // references hoalang_core.users
  experienceId: Types.ObjectId;  // references tenant experiences
  date: Date;
  guests: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  totalPrice: number;
  notes?: string;
  payment: {
    method: 'COD' | 'PAYOS';
    status: 'PENDING' | 'PAID' | 'CANCELLED' | 'FAILED';
    orderCode?: number;
    paymentLinkId?: string;
    checkoutUrl?: string;
    qrCode?: string;
    paidAt?: Date;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export const BookingSchema = new Schema<IBooking>(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    experienceId: { type: Schema.Types.ObjectId, required: true },
    date: { type: Date, required: true },
    guests: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
      default: 'PENDING',
    },
    totalPrice: { type: Number, required: true, min: 0 },
    notes: { type: String },
    payment: {
      method: { type: String, enum: ['COD', 'PAYOS'], default: 'COD' },
      status: { type: String, enum: ['PENDING', 'PAID', 'CANCELLED', 'FAILED'], default: 'PENDING' },
      orderCode: { type: Number },
      paymentLinkId: { type: String },
      checkoutUrl: { type: String },
      qrCode: { type: String },
      paidAt: { type: Date },
    },
  },
  { timestamps: true }
);

BookingSchema.index({ userId: 1 });
BookingSchema.index({ experienceId: 1 });
BookingSchema.index({ date: 1 });
BookingSchema.index({ status: 1 });

export function getBookingModel(connection: Connection): Model<IBooking> {
  return (
    connection.models['Booking'] ??
    connection.model<IBooking>('Booking', BookingSchema)
  );
}
