import { Schema, Connection, Model } from 'mongoose';

export interface IProduct {
  name: { vi: string; en?: string; zh?: string; ja?: string; ko?: string };
  desc?: { vi?: string; en?: string };
  price: number;
  images: string[];
  stock: number;
  categoryTags: string[];
  isPublished: boolean;
  weight?: number;
  dimensions?: { width: number; height: number; depth: number };
  createdAt?: Date;
  updatedAt?: Date;
}

export const ProductSchema = new Schema<IProduct>(
  {
    name: {
      vi: { type: String, required: true, trim: true },
      en: { type: String, trim: true },
      zh: { type: String, trim: true },
      ja: { type: String, trim: true },
      ko: { type: String, trim: true },
    },
    desc: {
      vi: { type: String },
      en: { type: String },
    },
    price: { type: Number, required: true, min: 0 },
    images: [{ type: String }],
    stock: { type: Number, default: 0, min: 0 },
    categoryTags: [{ type: String }],
    isPublished: { type: Boolean, default: false },
    weight: { type: Number },
    dimensions: {
      width: { type: Number },
      height: { type: Number },
      depth: { type: Number },
    },
  },
  { timestamps: true }
);

ProductSchema.index({ 'name.vi': 'text', 'name.en': 'text' });
ProductSchema.index({ price: 1 });
ProductSchema.index({ isPublished: 1 });
ProductSchema.index({ stock: 1 });

/**
 * Returns the Product model bound to the given tenant connection.
 * Checks connection.models first to avoid OverwriteModelError.
 */
export function getProductModel(connection: Connection): Model<IProduct> {
  return (
    connection.models['Product'] ??
    connection.model<IProduct>('Product', ProductSchema)
  );
}
