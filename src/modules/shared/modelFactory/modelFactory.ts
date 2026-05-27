import { Connection, Model } from 'mongoose';

import { ProductSchema, IProduct, getProductModel } from '../../../models/tenant/Product.schema';
import { BookingSchema, IBooking, getBookingModel } from '../../../models/tenant/Booking.schema';
import { OrderSchema, IOrder, getOrderModel } from '../../../models/tenant/Order.schema';
import { ExperienceSchema, IExperience, getExperienceModel } from '../../../models/tenant/Experience.schema';
import { WorkshopSchema, IWorkshop, getWorkshopModel } from '../../../models/tenant/Workshop.schema';
import { ReviewSchema, IReview, getReviewModel } from '../../../models/tenant/Review.schema';
import { CmsPageSchema, ICmsPage, getCmsPageModel } from '../../../models/tenant/CmsPage.schema';
import { MediaSchema, IMedia, getMediaModel } from '../../../models/tenant/Media.schema';

// Re-export schema types for convenience
export type {
  IProduct,
  IBooking,
  IOrder,
  IExperience,
  IWorkshop,
  IReview,
  ICmsPage,
  IMedia,
};

// Re-export schemas for use in provisioning/seeder
export {
  ProductSchema,
  BookingSchema,
  OrderSchema,
  ExperienceSchema,
  WorkshopSchema,
  ReviewSchema,
  CmsPageSchema,
  MediaSchema,
};

/**
 * ──────────────────────────────────────────────────────────
 * MODEL FACTORY — ALL TENANT-SCOPED MODELS
 *
 * Each function:
 *  1. Receives the active tenant Mongoose Connection
 *  2. Returns an existing compiled model OR compiles a new one
 *  3. Avoids OverwriteModelError via connection.models check
 * ──────────────────────────────────────────────────────────
 */

export { getProductModel };
export { getBookingModel };
export { getOrderModel };
export { getExperienceModel };
export { getWorkshopModel };
export { getReviewModel };
export { getCmsPageModel };
export { getMediaModel };

/**
 * Convenience: get ALL models for a tenant connection at once.
 * Useful in provisioning/seeding where all collections are needed.
 */
export interface TenantModels {
  Product: Model<IProduct>;
  Booking: Model<IBooking>;
  Order: Model<IOrder>;
  Experience: Model<IExperience>;
  Workshop: Model<IWorkshop>;
  Review: Model<IReview>;
  CmsPage: Model<ICmsPage>;
  Media: Model<IMedia>;
}

export const getTenantModels = (connection: Connection): TenantModels => ({
  Product: getProductModel(connection),
  Booking: getBookingModel(connection),
  Order: getOrderModel(connection),
  Experience: getExperienceModel(connection),
  Workshop: getWorkshopModel(connection),
  Review: getReviewModel(connection),
  CmsPage: getCmsPageModel(connection),
  Media: getMediaModel(connection),
});
