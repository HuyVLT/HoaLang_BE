import { Schema, Connection, Model, Types } from 'mongoose';

export type ReviewTargetType = 'product' | 'experience' | 'workshop';

export interface IReview {
  userId: Types.ObjectId;       // references hoalang_core.users
  targetId: Types.ObjectId;     // references tenant entity
  targetType: ReviewTargetType;
  rating: number;               // 1-5 stars
  comment?: string;
  images?: string[];
  isApproved: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export const ReviewSchema = new Schema<IReview>(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    targetType: {
      type: String,
      enum: ['product', 'experience', 'workshop'],
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    images: [{ type: String }],
    isApproved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ReviewSchema.index({ targetId: 1, targetType: 1 });
ReviewSchema.index({ userId: 1 });
ReviewSchema.index({ isApproved: 1 });
ReviewSchema.index({ rating: -1 });

export function getReviewModel(connection: Connection): Model<IReview> {
  return (
    connection.models['Review'] ??
    connection.model<IReview>('Review', ReviewSchema)
  );
}
