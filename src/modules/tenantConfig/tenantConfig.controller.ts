import { Request, Response, NextFunction } from 'express';
import { PageConfig } from '../../models/core/PageConfig.model';
import { Tenant } from '../../models/core/Tenant.model';
import { getStarterTemplate } from './starterTemplates';
import { sendResponse } from '../../utils/response';
import { AppError } from '../../middleware/error.middleware';

/**
 * GET /api/v1/tenant/:slug/page-config
 * Retrieves a page config for the given tenant slug.
 * Proactively provisions a default configuration based on the tenant's nature if none exists.
 */
export const getPageConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const slug = req.params.slug as string;

    if (!slug) {
      return next(new AppError('Tenant slug is required in route parameter.', 400));
    }

    // 1. First, check if the core tenant exists
    const tenant = await Tenant.findOne({ slug: slug.toLowerCase() });
    if (!tenant) {
      return next(new AppError(`Tenant craft village '${slug}' not found.`, 404));
    }

    // 2. Query the PageConfig document
    let config = await PageConfig.findOne({ tenantId: slug.toLowerCase() });

    // 3. Auto-provision default template config if none exists
    if (!config) {
      console.log(`[PageConfigController] Provisioning default page config for '${slug}'...`);
      const starterTemplate = getStarterTemplate(slug.toLowerCase());
      
      config = await PageConfig.create({
        tenantId: slug.toLowerCase(),
        templateId: starterTemplate.templateId,
        theme: starterTemplate.theme,
        sections: starterTemplate.sections,
      });
      console.log(`[PageConfigController] Default config seeded successfully for '${slug}'.`);
    }

    sendResponse(res, 200, true, config, `Page config retrieved successfully for '${slug}'`);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/tenant/:slug/page-config
 * Updates the page config details for the tenant slug.
 */
export const updatePageConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const slug = req.params.slug as string;
    const { templateId, theme, sections, published } = req.body;

    if (!slug) {
      return next(new AppError('Tenant slug is required in route parameter.', 400));
    }

    // 1. Ensure the core tenant exists
    const tenant = await Tenant.findOne({ slug: slug.toLowerCase() });
    if (!tenant) {
      return next(new AppError(`Tenant craft village '${slug}' not found.`, 404));
    }

    const updateFields: any = {
      templateId: templateId || 'pottery-template',
      theme: theme,
      sections: sections || [],
    };
    if (published !== undefined) {
      updateFields.published = published;
    }

    // 2. Perform upsert operation on the page config collection in core DB
    const updatedConfig = await PageConfig.findOneAndUpdate(
      { tenantId: slug.toLowerCase() },
      { $set: updateFields },
      { new: true, upsert: true, runValidators: true }
    );

    sendResponse(
      res,
      200,
      true,
      updatedConfig,
      `Page config updated successfully for tenant '${slug}'`
    );
  } catch (error) {
    next(error);
  }
};
