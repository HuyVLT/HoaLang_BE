import { Router } from 'express';
import {
  createOrder,
  createBooking,
  handlePayOSWebhook,
  getPaymentStatus,
  cancelPayment,
  getPaymentMethods,
  getExperiences
} from './payment.controller';
import { resolveTenant, requireTenantDb } from '../../middleware/tenant.middleware';
import { resolveUserOptional } from '../../middleware/auth.middleware';

const router = Router();

// ── Global server-to-server webhook endpoint ──────────────────────────────────
// This route is called globally by PayOS, using tenantId to isolate configuration
router.post('/payment/payos/webhook/:tenantId', handlePayOSWebhook);

// ── Tenant-scoped payment endpoints ──────────────────────────────────────────
// These routes are prefixed with tenant context resolvers
router.post('/orders', resolveTenant, requireTenantDb, resolveUserOptional, createOrder);
router.post('/bookings', resolveTenant, requireTenantDb, resolveUserOptional, createBooking);
router.get('/payment/status/:orderCode', resolveTenant, requireTenantDb, getPaymentStatus);
router.post('/payment/payos/cancel/:orderCode', resolveTenant, requireTenantDb, cancelPayment);
router.get('/tenant/payment-methods', resolveTenant, requireTenantDb, getPaymentMethods);
router.get('/experiences', resolveTenant, requireTenantDb, getExperiences);

export default router;
