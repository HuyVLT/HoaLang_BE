import { Schema, model, Document } from 'mongoose';

export interface IVoucher {
  code: string;
  description: {
    vi: string;
    en: string;
    ja?: string;
    ko?: string;
    zh?: string;
  };
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderValue: number;
  maxDiscountValue?: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type VoucherDocument = IVoucher & Document;

const VoucherSchema = new Schema<IVoucher>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      vi: { type: String, required: true },
      en: { type: String, required: true },
      ja: { type: String },
      ko: { type: String },
      zh: { type: String },
    },
    discountType: {
      type: String,
      enum: ['PERCENTAGE', 'FIXED'],
      required: true,
      default: 'PERCENTAGE',
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderValue: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    maxDiscountValue: {
      type: Number,
      min: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  { timestamps: true }
);

// Add index to quickly fetch active vouchers
VoucherSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

export const Voucher = model<IVoucher>('Voucher', VoucherSchema);
export default Voucher;
