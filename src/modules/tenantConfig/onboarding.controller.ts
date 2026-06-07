import { Request, Response, NextFunction } from 'express';
import dns from 'dns';
import { promisify } from 'util';
import { Tenant } from '../../models/core/Tenant.model';
import { PageConfig } from '../../models/core/PageConfig.model';
import { User } from '../../models/core/User.model';
import { UserTenantRole } from '../../models/core/UserTenantRole.model';
import { TenantRequest } from '../../models/core/TenantRequest.model';
import { SystemLog } from '../../models/core/SystemLog.model';
import { provisioningService } from '../tenantProvisioning/provisioning.service';
import { getStarterTemplate } from './starterTemplates';
import { sendResponse } from '../../utils/response';
import { AppError } from '../../middleware/error.middleware';
import { sendTenantApprovalEmail, sendOnboardingSubmissionEmail, sendTenantRejectionEmail } from '../../utils/mailer';
import { uploadBase64ToCloudinary } from '../../utils/cloudinary';

const resolveMxAsync = promisify(dns.resolveMx);
const resolveAAsync = promisify(dns.resolve4);

/**
 * Validates whether the email domain exists and can receive emails by performing a DNS MX/A record lookup.
 * Bypasses checks for known local/test domains.
 */
const validateEmailDomain = async (email: string): Promise<boolean> => {
  try {
    const domain = email.split('@')[1];
    if (!domain) return false;

    // Bypass check for local development and test domains
    const testDomains = ['localhost', 'test.com', 'example.com', 'hoalang.site', 'domain.com'];
    if (testDomains.includes(domain.toLowerCase())) {
      return true;
    }

    try {
      const mxRecords = await resolveMxAsync(domain);
      if (mxRecords && mxRecords.length > 0) {
        return true;
      }
    } catch (mxErr) {
      // Fallback to checking A records
    }

    try {
      const aRecords = await resolveAAsync(domain);
      if (aRecords && aRecords.length > 0) {
        return true;
      }
    } catch (aErr) {
      // Failure
    }

    return false;
  } catch (err) {
    return false;
  }
};

/**
 * POST /api/v1/tenant/onboarding
 * Handles new tenant registration requests. Saves to TenantRequest collection.
 */
export const createTenantOnboarding = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, slug, email, category, province, logo, coverImage, templateId, artisanName, phone, description } = req.body;

    if (!name || !slug || !email || !templateId || !category || !province || !artisanName || !phone) {
      return next(new AppError('Village name, slug, email, templateId, category, province, artisanName, and phone are required.', 400));
    }

    const cleanEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return next(new AppError('Invalid email format.', 400));
    }

    const isRealEmail = await validateEmailDomain(cleanEmail);
    if (!isRealEmail) {
      return next(new AppError('Email domain does not exist or cannot receive emails. Please enter a valid, active email address.', 400));
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/\s+/g, '-');
    const domain = `${cleanSlug}.hoalang.site`;

    // 1. Check duplicate in active Tenants
    const duplicateTenant = await Tenant.findOne({ $or: [{ slug: cleanSlug }, { domain }] });
    if (duplicateTenant) {
      return next(new AppError(`A village with slug '${cleanSlug}' or domain '${domain}' already exists.`, 409));
    }

    // 2. Check duplicate in pending requests
    const duplicateRequest = await TenantRequest.findOne({ slug: cleanSlug, status: 'PENDING' });
    if (duplicateRequest) {
      return next(new AppError(`A registration request for slug '${cleanSlug}' is already pending approval.`, 409));
    }

    let finalLogo = logo;
    let finalCoverImage = coverImage;

    // Proactively upload base64 images to Cloudinary
    if (logo && logo.startsWith('data:image')) {
      try {
        console.log(`[Onboarding] Uploading logo for '${cleanSlug}' to Cloudinary...`);
        finalLogo = await uploadBase64ToCloudinary(logo, `hoalang/tenants/${cleanSlug}/logo`);
        console.log(`[Onboarding] Logo uploaded successfully: ${finalLogo}`);
      } catch (err) {
        console.warn(`[Onboarding] Cloudinary logo upload failed, falling back to base64:`, err);
      }
    }

    if (coverImage && coverImage.startsWith('data:image')) {
      try {
        console.log(`[Onboarding] Uploading coverImage for '${cleanSlug}' to Cloudinary...`);
        finalCoverImage = await uploadBase64ToCloudinary(coverImage, `hoalang/tenants/${cleanSlug}/cover`);
        console.log(`[Onboarding] CoverImage uploaded successfully: ${finalCoverImage}`);
      } catch (err) {
        console.warn(`[Onboarding] Cloudinary coverImage upload failed, falling back to base64:`, err);
      }
    }

    // 3. Create TenantRequest
    const newRequest = await TenantRequest.create({
      name,
      slug: cleanSlug,
      email: email.toLowerCase().trim(),
      category,
      province,
      artisanName: artisanName || 'Nghệ nhân',
      phone,
      description,
      logo: finalLogo,
      coverImage: finalCoverImage,
      templateId,
      status: 'PENDING',
    });

    // Save operational log
    await SystemLog.create({
      type: 'SYSTEM',
      message: `APPLICATION RECEIVED: Nhận hồ sơ đăng ký đối tác mới từ ${name} (slug: ${cleanSlug}).`
    });

    // Send confirmation email to the applicant (fire-and-forget, non-blocking)
    sendOnboardingSubmissionEmail(
      email.toLowerCase().trim(),
      artisanName || 'Nghệ nhân',
      name,
      cleanSlug
    ).catch(() => { /* silent — email failure should not block submission */ });

    sendResponse(
      res,
      201,
      true,
      {
        request: newRequest,
        message: 'Yêu cầu đăng ký chi nhánh đã được tiếp nhận và đang chờ Super Admin phê duyệt.',
      },
      `Successfully registered tenant registration request for '${cleanSlug}'`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/tenant/requests
 * Returns all onboarding requests (Super Admin only).
 */
export const getTenantRequests = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const requests = await TenantRequest.find({}).sort({ createdAt: -1 });
    sendResponse(res, 200, true, requests, 'Successfully retrieved tenant registration requests.');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/tenant/requests/:id/approve
 * Approves a tenant request, provisions the database, and auto-generates credentials.
 */
export const approveTenantRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const request = await TenantRequest.findById(id);

    if (!request) {
      return next(new AppError('Tenant request not found.', 404));
    }

    if (request.status !== 'PENDING') {
      return next(new AppError('This request has already been processed.', 400));
    }

    const { name, slug, email, category, province, logo, coverImage, templateId, artisanName, phone } = request;
    const domain = `${slug}.hoalang.site`;

    const starterTemplate = getStarterTemplate(templateId);

    // 1. Check if tenant already exists (could be from a previously failed approval attempt)
    const existingTenant = await Tenant.findOne({ $or: [{ slug }, { domain }] });
    let tenantId: string;

    if (existingTenant) {
      // Check if this slug was already approved for a DIFFERENT request
      const otherApprovedRequest = await TenantRequest.findOne({
        slug,
        status: 'APPROVED',
        _id: { $ne: id },
      });

      if (otherApprovedRequest) {
        return next(new AppError(`The slug '${slug}' has already been assigned to another approved tenant.`, 409));
      }

      // Tenant was already created by a previous partial approval of the SAME request — reuse it (idempotent retry)
      console.log(`[Approval] Tenant '${slug}' already exists from a previous attempt of this request. Resuming approval flow...`);
      tenantId = String(existingTenant._id);
    } else {
      // 2. Call provisioning service to create the core tenant and provision tenant DB
      console.log(`[Approval] Provisioning core database for: ${slug}...`);
      const provisionResult = await provisioningService.createTenant({
        slug,
        name,
        domain,
        theme: {
          primaryColor: starterTemplate.theme.primaryColor,
          logo: logo || starterTemplate.theme.logo,
        },
        templateId,
      });
      tenantId = String(provisionResult.tenant._id);
    }

    // 3. Upsert PageConfig — safe to run multiple times
    console.log(`[Approval] Tailoring PageConfig starter template for: ${slug}...`);
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

    // Save personalized PageConfig to core database (upsert = idempotent)
    const finalConfig = await PageConfig.findOneAndUpdate(
      { tenantId: slug },
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

    // 4. Find or create User with VILLAGE_OWNER role
    let user = await User.findOne({ email: email.toLowerCase() });
    let generatedPassword = '';
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      // Generate a secure random 12-character password (plain-text — pre-save hook will hash it)
      generatedPassword = Math.random().toString(36).substring(2, 8)
        + Math.random().toString(36).substring(2, 8).toUpperCase();

      user = await User.create({
        email: email.toLowerCase(),
        // Pass plain-text: Mongoose pre-save hook hashes automatically (avoid double-hash)
        password: generatedPassword,
        fullName: artisanName || `Chủ sở hữu ${name}`,
        role: 'VILLAGE_OWNER',
        phone: phone || '',
        status: 'ACTIVE',
        // Approved by Super Admin — account is pre-verified, no email activation needed
        isVerified: true,
        verificationExpiresAt: undefined,
      });
    } else {
      let needsSave = false;
      if (user.role !== 'ADMIN') {
        user.role = 'VILLAGE_OWNER';
        needsSave = true;
      }
      // Ensure the existing user account is activated (Super Admin approval implies verification)
      if (!user.isVerified) {
        user.isVerified = true;
        user.verificationExpiresAt = undefined;
        needsSave = true;
      }
      if (needsSave) {
        await user.save();
      }
    }

    // 5. Create user-tenant mapping (idempotent — skip if already exists)
    const existingMapping = await UserTenantRole.findOne({
      userId: user._id,
      tenantId: tenantId,
    });
    if (!existingMapping) {
      await UserTenantRole.create({
        userId: user._id,
        tenantId: tenantId,
        role: 'OWNER',
      });
    }

    // 6. Send notification email
    if (isNewUser && generatedPassword) {
      // New user: send credentials + approval notification
      await sendTenantApprovalEmail(
        email,
        user.fullName,
        generatedPassword,
        name,
        slug
      );
    } else {
      // Existing user: send approval notification without credentials
      await sendTenantApprovalEmail(
        email,
        user.fullName,
        '(sử dụng mật khẩu hiện tại / use your existing password)',
        name,
        slug
      );
    }

    // 7. Update status to APPROVED
    request.status = 'APPROVED';
    await request.save();

    // Save operational logs to MongoDB
    await SystemLog.create({
      type: 'SYSTEM',
      message: `🎉 PHÊ DUYỆT THÀNH CÔNG: Đã duyệt đơn đăng ký của ${name}.`,
    });
    await SystemLog.create({
      type: 'SYSTEM',
      message: `DATABASE PROVISIONING: Khởi tạo database biệt lập (tenant_${slug.replace(/-/g, '')}) hoàn tất cho ${name}.`,
    });
    await SystemLog.create({
      type: 'ROUTING',
      message: `DOMAINS: Đã phân phối tên miền phụ chính thức https://${slug}.hoalang.site thành công.`,
    });
    await SystemLog.create({
      type: 'AUTH',
      message: `AUTH: Cấp quyền quản trị viên cho email ${email} thành công.`,
    });

    sendResponse(
      res,
      200,
      true,
      {
        tenant: { _id: tenantId, slug, name, domain },
        pageConfig: finalConfig,
        request,
        ownerUser: {
          email: user.email,
          fullName: user.fullName,
        },
        message: existingTenant
          ? `Resumed and completed approval for tenant village '${slug}' (previous partial attempt recovered).`
          : `Successfully approved and provisioned tenant village '${slug}'`,
      },
      `Successfully approved and provisioned tenant village '${slug}'`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/tenant/requests/:id/reject
 * Rejects a tenant request (Super Admin only).
 */
export const rejectTenantRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return next(new AppError('Rejection reason is required.', 400));
    }

    const request = await TenantRequest.findById(id);

    if (!request) {
      return next(new AppError('Tenant request not found.', 404));
    }

    if (request.status !== 'PENDING') {
      return next(new AppError('This request has already been processed.', 400));
    }

    request.status = 'REJECTED';
    await request.save();

    // Save operational log to MongoDB
    await SystemLog.create({
      type: 'AUTH',
      message: `TỪ CHỐI ĐĂNG KÝ: Từ chối đơn xin đăng ký làm tenant của ${request.name}. Lý do: ${reason.trim()}`,
    });

    // Send rejection email to the applicant (fire-and-forget)
    sendTenantRejectionEmail(
      request.email,
      request.artisanName || request.name,
      request.name,
      reason.trim()
    ).catch(() => { /* silent — email failure should not block rejection */ });

    sendResponse(
      res,
      200,
      true,
      request,
      `Successfully rejected tenant registration request for '${request.slug}'`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/tenant/requests/check
 * Public endpoint to check onboarding status by email.
 */
export const checkRequestStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.query;

    if (!email) {
      return next(new AppError('Email query parameter is required.', 400));
    }

    // Find the latest request associated with this email
    const request = await TenantRequest.findOne({ email: String(email).toLowerCase() }).sort({ createdAt: -1 });

    if (!request) {
      return next(new AppError('No onboarding request found for this email.', 404));
    }

    sendResponse(
      res,
      200,
      true,
      request,
      `Successfully retrieved onboarding request status for '${email}'`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/tenant
 * Returns all active tenants (Super Admin only).
 */
export const getTenants = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenants = await Tenant.find({}).sort({ createdAt: -1 });
    sendResponse(res, 200, true, tenants, 'Successfully retrieved active tenants.');
  } catch (error) {
    next(error);
  }
};

