import { Schema, Connection, Model } from 'mongoose';

export interface IWorkshop {
  title: { vi: string; en?: string };
  desc?: { vi?: string; en?: string };
  instructor: string;
  duration: number;          // minutes
  maxParticipants: number;
  price: number;
  startDate: Date;
  endDate: Date;
  isPublished: boolean;
  coverImage?: string;
  tags: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export const WorkshopSchema = new Schema<IWorkshop>(
  {
    title: {
      vi: { type: String, required: true, trim: true },
      en: { type: String, trim: true },
    },
    desc: {
      vi: { type: String },
      en: { type: String },
    },
    instructor: { type: String, required: true },
    duration: { type: Number, required: true, min: 1 },
    maxParticipants: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isPublished: { type: Boolean, default: false },
    coverImage: { type: String },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

WorkshopSchema.index({ isPublished: 1 });
WorkshopSchema.index({ startDate: 1 });
WorkshopSchema.index({ tags: 1 });

export function getWorkshopModel(connection: Connection): Model<IWorkshop> {
  return (
    connection.models['Workshop'] ??
    connection.model<IWorkshop>('Workshop', WorkshopSchema)
  );
}
