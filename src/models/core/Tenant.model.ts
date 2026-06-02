import { Schema, model, Document } from 'mongoose';

export interface ITenant {
  slug: string;
  name: string;
  domain: string;
  dbName: string;
  status: 'ACTIVE' | 'SUSPENDED';
  features: {
    ecommerce: boolean;
    booking: boolean;
    aiAssistant: boolean;
  };
  theme: {
    primaryColor: string;
    logo?: string;
  };
  payosConfig: {
    clientId: string | null;
    apiKey: string | null;
    checksumKey: string | null;
    isEnabled: boolean;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export type TenantDocument = ITenant & Document;

const TenantSchema = new Schema<ITenant>(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    domain: { type: String, required: true, unique: true, trim: true, lowercase: true },
    dbName: { type: String, required: true, unique: true, trim: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
      required: true,
    },
    features: {
      ecommerce: { type: Boolean, default: true },
      booking: { type: Boolean, default: true },
      aiAssistant: { type: Boolean, default: false },
    },
    theme: {
      primaryColor: { type: String, default: '#8B1A1A' }, // Default lacquer red
      logo: { type: String },
    },
    payosConfig: {
      clientId: { type: String, default: null },
      apiKey: { type: String, default: null },
      checksumKey: { type: String, default: null },
      isEnabled: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export const Tenant = model<ITenant>('Tenant', TenantSchema);
export default Tenant;

