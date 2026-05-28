import { Schema, model, Document } from 'mongoose';

export interface IPageConfigTheme {
  primaryColor: string;
  accentColor: string;
  fontHeading: string;
  fontBody: string;
  logo?: string;
  favicon?: string;
}

export interface IPageConfigSection {
  id: string;
  type: string;
  [key: string]: any;
}

export interface IPageConfig {
  tenantId: string; // The tenant slug e.g. "bat-trang"
  templateId: string;
  theme: IPageConfigTheme;
  sections: IPageConfigSection[];
  published: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PageConfigDocument = IPageConfig & Document;

const PageConfigThemeSchema = new Schema<IPageConfigTheme>(
  {
    primaryColor: { type: String, required: true, default: '#8B1A1A' },
    accentColor: { type: String, required: true, default: '#C4952A' },
    fontHeading: { type: String, required: true, default: 'Cormorant Garamond' },
    fontBody: { type: String, required: true, default: 'Be Vietnam Pro' },
    logo: { type: String },
    favicon: { type: String },
  },
  { _id: false }
);

const PageConfigSchema = new Schema<IPageConfig>(
  {
    tenantId: { type: String, required: true, unique: true, trim: true, lowercase: true },
    templateId: { type: String, required: true, default: 'pottery-template' },
    theme: { type: PageConfigThemeSchema, required: true },
    sections: { type: [Schema.Types.Mixed] as any, required: true, default: [] },
    published: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

// Create quick query index
PageConfigSchema.index({ tenantId: 1 }, { unique: true });

export const PageConfig = model<IPageConfig>('PageConfig', PageConfigSchema);
export default PageConfig;
