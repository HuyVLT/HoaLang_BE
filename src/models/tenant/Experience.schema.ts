import { Schema, Connection, Model } from 'mongoose';

export interface IExperience {
  title: { vi: string; en?: string };
  desc?: { vi?: string; en?: string };
  duration: number;      // minutes
  maxGuests: number;
  price: number;
  schedule: Date[];
  isPublished: boolean;
  highlights?: string[];
  requirements?: string[];
  coverImage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const ExperienceSchema = new Schema<IExperience>(
  {
    title: {
      vi: { type: String, required: true, trim: true },
      en: { type: String, trim: true },
    },
    desc: {
      vi: { type: String },
      en: { type: String },
    },
    duration: { type: Number, required: true, min: 1 },
    maxGuests: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    schedule: [{ type: Date }],
    isPublished: { type: Boolean, default: false },
    highlights: [{ type: String }],
    requirements: [{ type: String }],
    coverImage: { type: String },
  },
  { timestamps: true }
);

ExperienceSchema.index({ isPublished: 1 });
ExperienceSchema.index({ price: 1 });

export function getExperienceModel(connection: Connection): Model<IExperience> {
  return (
    connection.models['Experience'] ??
    connection.model<IExperience>('Experience', ExperienceSchema)
  );
}
