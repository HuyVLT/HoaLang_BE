import { Request, Response, NextFunction } from 'express';
import { Tenant } from '../../models/core/Tenant.model';
import { PageConfig } from '../../models/core/PageConfig.model';
import { provisioningService } from '../tenantProvisioning/provisioning.service';
import { getStarterTemplate } from './starterTemplates';
import { sendResponse } from '../../utils/response';
import { AppError } from '../../middleware/error.middleware';

/**
 * POST /api/v1/tenant/onboarding
 * Handles new tenant registration, provisions database, seeds templates, and returns configuration.
 */
export const createTenantOnboarding = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, slug, category, province, logo, coverImage, templateId } = req.body;

    if (!name || !slug || !templateId) {
      return next(new AppError('Village name, slug, and templateId are required.', 400));
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/\s+/g, '-');
    const domain = `${cleanSlug}.hoalang.vn`;

    // 1. Validate no duplicate slug or domain
    const duplicate = await Tenant.findOne({ $or: [{ slug: cleanSlug }, { domain }] });
    if (duplicate) {
      return next(new AppError(`A village with slug '${cleanSlug}' or domain '${domain}' already exists.`, 409));
    }

    // 2. Resolve starter template base theme colors
    const starterTemplate = getStarterTemplate(templateId);

    // 3. Call provisioning service to create the core tenant and provision tenant DB
    console.log(`[Onboarding] Provisioning core database for: ${cleanSlug}...`);
    const provisionResult = await provisioningService.createTenant({
      slug: cleanSlug,
      name,
      domain,
      theme: {
        primaryColor: starterTemplate.theme.primaryColor,
        logo: logo || starterTemplate.theme.logo,
      },
    });

    // 4. Update the PageConfig document created during provisioning with the chosen custom layout
    console.log(`[Onboarding] Tailoring PageConfig starter template for: ${cleanSlug}...`);
    
    // Customize template's Hero and Story text based on inputs
    const sectionsCopy = JSON.parse(JSON.stringify(starterTemplate.sections));
    
    // Skin Hero section with name and coverImage
    const heroSec = sectionsCopy.find((s: any) => s.type === 'hero');
    if (heroSec) {
      heroSec.title = {
        vi: `Chào mừng tới ${name}`,
        en: `Welcome to ${name}`,
      };
      if (coverImage) {
        heroSec.backgroundImage = coverImage;
      }
    }

    // Skin Story section with name
    const storySec = sectionsCopy.find((s: any) => s.type === 'story');
    if (storySec) {
      storySec.heading = {
        vi: `Hành Trình Di Sản Của ${name}`,
        en: `The Heritage Journey of ${name}`,
      };
      storySec.storyText = {
        vi: `Chào mừng đến với ${name} nằm tại tỉnh ${province || 'Việt Nam'} — nơi hội tụ và gìn giữ tinh hoa nghệ thuật ${category || 'thủ công'} truyền thống qua nhiều thế hệ dòng tộc nghệ nhân tài hoa.`,
        en: `Welcome to ${name} located in ${province || 'Vietnam'} — where traditional ${category || 'handicraft'} masterworks are shaped and preserved across generations.`,
      };
    }

    // Save personalized PageConfig to core database
    const finalConfig = await PageConfig.findOneAndUpdate(
      { tenantId: cleanSlug },
      {
        $set: {
          templateId,
          theme: {
            primaryColor: starterTemplate.theme.primaryColor,
            accentColor: starterTemplate.theme.accentColor,
            fontHeading: starterTemplate.theme.fontHeading,
            fontBody: starterTemplate.theme.fontBody,
            logo: logo || starterTemplate.theme.logo,
            favicon: starterTemplate.theme.favicon,
          },
          sections: sectionsCopy,
          published: false, // Starts as draft state
        },
      },
      { new: true, upsert: true }
    );

    sendResponse(
      res,
      201,
      true,
      {
        tenant: provisionResult.tenant,
        pageConfig: finalConfig,
        message: provisionResult.message,
      },
      `Successfully registered and provisioned tenant village '${cleanSlug}'`
    );
  } catch (error) {
    next(error);
  }
};
