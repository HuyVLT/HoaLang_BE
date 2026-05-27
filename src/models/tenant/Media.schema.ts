import { Schema, Connection, Model } from 'mongoose';

export type MediaType = 'image' | 'video' | 'document';

export interface IMedia {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;          // bytes
  url: string;
  mediaType: MediaType;
  alt?: string;
  tags: string[];
  uploadedBy?: string;   // userId string (references core.users)
  createdAt?: Date;
  updatedAt?: Date;
}

export const MediaSchema = new Schema<IMedia>(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true },
    mediaType: {
      type: String,
      enum: ['image', 'video', 'document'],
      required: true,
    },
    alt: { type: String },
    tags: [{ type: String }],
    uploadedBy: { type: String },
  },
  { timestamps: true }
);

MediaSchema.index({ mediaType: 1 });
MediaSchema.index({ tags: 1 });
MediaSchema.index({ createdAt: -1 });

export function getMediaModel(connection: Connection): Model<IMedia> {
  return (
    connection.models['Media'] ??
    connection.model<IMedia>('Media', MediaSchema)
  );
}
