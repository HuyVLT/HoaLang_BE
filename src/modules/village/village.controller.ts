import { Request, Response, NextFunction } from 'express';
import { Village } from '../../models/Village.model';
import { sendResponse } from '../../utils/response';
import { AppError } from '../../middleware/error.middleware';

/**
 * Get all craft villages
 * GET /api/v1/villages
 */
export const getVillages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { search, province, category, isVerified } = req.query;

    const query: any = {};

    // Apply search filter if provided
    if (search) {
      const searchStr = search as string;
      query.$or = [
        { 'name.vi': { $regex: searchStr, $options: 'i' } },
        { 'name.en': { $regex: searchStr, $options: 'i' } },
        { province: { $regex: searchStr, $options: 'i' } }
      ];
    }

    // Apply province filter
    if (province) {
      query.province = province;
    }

    // Apply category filter
    if (category) {
      query.categories = category;
    }

    // Apply verification filter
    if (isVerified !== undefined) {
      query.isVerified = isVerified === 'true';
    }

    const villages = await Village.find(query).sort({ createdAt: -1 });

    sendResponse(res, 200, true, villages, 'Successfully retrieved craft villages');
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single craft village by its slug
 * GET /api/v1/villages/:slug
 */
export const getVillageBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { slug } = req.params;

    if (!slug) {
      return next(new AppError('Village slug is required.', 400));
    }

    const village = await Village.findOne({ slug: (slug as string).toLowerCase() });

    if (!village) {
      return next(new AppError(`Craft village '${slug}' not found.`, 404));
    }

    sendResponse(res, 200, true, village, `Successfully retrieved craft village details for '${slug}'`);
  } catch (error) {
    next(error);
  }
};
