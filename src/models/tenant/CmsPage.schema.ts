import { Schema, Connection, Model } from 'mongoose';

export interface ICmsPage {
  slug: string;
  title: { vi: string; en?: string };
  content: { vi?: string; en?: string };
  metaTitle?: { vi?: string; en?: string };
  metaDesc?: { vi?: string; en?: string };
  isPublished: boolean;
  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export const CmsPageSchema = new Schema<ICmsPage>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: {
      vi: { type: String, required: true },
      en: { type: String },
    },
    content: {
      vi: { type: String },
      en: { type: String },
    },
    metaTitle: {
      vi: { type: String },
      en: { type: String },
    },
    metaDesc: {
      vi: { type: String },
      en: { type: String },
    },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

CmsPageSchema.index({ slug: 1 }, { unique: true });
CmsPageSchema.index({ isPublished: 1 });

export function getCmsPageModel(connection: Connection): Model<ICmsPage> {
  return (
    connection.models['CmsPage'] ??
    connection.model<ICmsPage>('CmsPage', CmsPageSchema)
  );
}
