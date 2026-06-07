import { Schema, model, Document } from 'mongoose';

export interface ITenantRequest {
  name: string;
  slug: string;
  email: string;
  category: string;
  province: string;
  artisanName: string;
  phone: string;
  description: string;
  logo?: string;
  coverImage?: string;
  templateId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt?: Date;
  updatedAt?: Date;
}

export type TenantRequestDocument = ITenantRequest & Document;

const TenantRequestSchema = new Schema<ITenantRequest>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    category: { type: String, required: true, trim: true },
    province: { type: String, required: true, trim: true },
    artisanName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    logo: { type: String },
    coverImage: { type: String },
    templateId: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      required: true,
    },
  },
  { timestamps: true }
);

export const TenantRequest = model<ITenantRequest>('TenantRequest', TenantRequestSchema);
export default TenantRequest;
