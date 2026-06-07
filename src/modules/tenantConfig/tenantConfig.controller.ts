import { Request, Response, NextFunction } from 'express';
import { PageConfig } from '../../models/core/PageConfig.model';
import { Tenant } from '../../models/core/Tenant.model';
import { getStarterTemplate } from './starterTemplates';
import { sendResponse } from '../../utils/response';
import { AppError } from '../../middleware/error.middleware';
import { getTenantConnection } from '../../config/tenantConnection';
import { getOrderModel } from '../../models/tenant/Order.schema';
import { getBookingModel } from '../../models/tenant/Booking.schema';
import { SystemLog } from '../../models/core/SystemLog.model';

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

/**
 * GET /api/v1/tenant/admin-dashboard-data
 * Aggregates all orders and bookings across all active tenant databases,
 * and fetches operational logs. Protected: admin only.
 */
export const getAdminDashboardData = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Fetch all active tenants
    const tenants = await Tenant.find({});

    const allTransactions: any[] = [];

    // 2. Loop through active tenants and query their databases
    for (const tenant of tenants) {
      try {
        const conn = await getTenantConnection(tenant.dbName);
        const Order = getOrderModel(conn);
        const Booking = getBookingModel(conn);

        // Fetch orders
        const orders = await Order.find({}).lean();
        for (const order of orders) {
          const orderCode = order.payment?.orderCode || (order as any)._id?.toString();
          allTransactions.push({
            id: `TXN-${orderCode}`,
            tenantName: tenant.name,
            amount: order.total || 0,
            commission: Math.round((order.total || 0) * 0.05),
            date: order.paidAt
              ? new Date(order.paidAt).toISOString().replace('T', ' ').substring(0, 16)
              : order.createdAt
              ? new Date(order.createdAt).toISOString().replace('T', ' ').substring(0, 16)
              : 'N/A',
            status: order.payment?.status === 'PAID' ? 'Collected' : 'Pending',
            rawDate: order.paidAt || order.createdAt || new Date(0),
          });
        }

        // Fetch bookings
        const bookings = await Booking.find({}).lean();
        for (const booking of bookings) {
          const orderCode = booking.payment?.orderCode || (booking as any)._id?.toString();
          allTransactions.push({
            id: `TXN-${orderCode}`,
            tenantName: tenant.name,
            amount: booking.totalPrice || 0,
            commission: Math.round((booking.totalPrice || 0) * 0.05),
            date: booking.payment?.paidAt
              ? new Date(booking.payment.paidAt).toISOString().replace('T', ' ').substring(0, 16)
              : booking.createdAt
              ? new Date(booking.createdAt).toISOString().replace('T', ' ').substring(0, 16)
              : 'N/A',
            status: booking.payment?.status === 'PAID' ? 'Collected' : 'Pending',
            rawDate: booking.payment?.paidAt || booking.createdAt || new Date(0),
          });
        }
      } catch (err) {
        // Skip individual tenant database failures to keep dashboard online
        console.error(`[AdminDashboardData] Error fetching data for tenant ${tenant.slug}:`, err);
      }
    }

    // 3. Sort transactions by date descending
    allTransactions.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

    // Remove rawDate from response
    const transactions = allTransactions.map(({ rawDate, ...rest }) => rest);

    // 4. Fetch operational logs from SystemLog sorted by timestamp descending
    const logs = await SystemLog.find({}).sort({ timestamp: -1 }).limit(100).lean();
    
    // Map logs to have standard timestamp string format for UI
    const mappedLogs = logs.map(l => ({
      timestamp: l.timestamp ? new Date(l.timestamp).toISOString().replace('T', ' ').substring(0, 19) : 'N/A',
      type: l.type,
      message: l.message,
    }));

    sendResponse(res, 200, true, { transactions, logs: mappedLogs }, 'Successfully retrieved admin dashboard data.');
  } catch (error) {
    next(error);
  }
};
