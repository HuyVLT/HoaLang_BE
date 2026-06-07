import { Router } from 'express';
import { getPageConfig, updatePageConfig, getAdminDashboardData } from './tenantConfig.controller';
import {
  createTenantOnboarding,
  getTenantRequests,
  approveTenantRequest,
  rejectTenantRequest,
  checkRequestStatus,
  getTenants,
} from './onboarding.controller';
import { protect, resolveUserOptional } from '../../middleware/auth.middleware';
import { restrictTo } from '../../middleware/role.middleware';

const router = Router();

/**
 * @swagger
 * /api/v1/tenant/onboarding:
 *   post:
 *     summary: Complete tenant village onboarding and provision database
 *     tags: [Tenant Customizer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - slug
 *               - templateId
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               category:
 *                 type: string
 *               province:
 *                 type: string
 *               logo:
 *                 type: string
 *               coverImage:
 *                 type: string
 *               templateId:
 *                 type: string
 *     responses:
 *       210:
 *         description: Tenant provisioned successfully
 */
router.post('/onboarding', resolveUserOptional, createTenantOnboarding);
router.get('/requests/check', checkRequestStatus);

// Super Admin protected endpoints to review registration requests
router.get('/requests', protect, restrictTo('ADMIN'), getTenantRequests);
router.get('/', protect, restrictTo('ADMIN'), getTenants);
router.post('/requests/:id/approve', protect, restrictTo('ADMIN'), approveTenantRequest);
router.post('/requests/:id/reject', protect, restrictTo('ADMIN'), rejectTenantRequest);
router.get('/admin-dashboard-data', protect, restrictTo('ADMIN'), getAdminDashboardData);

/**
 * @swagger
 * /api/v1/tenant/{slug}/page-config:
 *   get:
 *     summary: Fetch landing page config for the given tenant
 *     tags: [Tenant Customizer]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *           example: bat-trang
 *     responses:
 *       200:
 *         description: Successfully retrieved configuration
 *       404:
 *         description: Tenant village not found
 */
router.get('/:slug/page-config', getPageConfig);

/**
 * @swagger
 * /api/v1/tenant/{slug}/page-config:
 *   put:
 *     summary: Update landing page config for the given tenant
 *     tags: [Tenant Customizer]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *           example: bat-trang
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               templateId:
 *                 type: string
 *                 example: pottery-template
 *               theme:
 *                 type: object
 *               sections:
 *                 type: array
 *     responses:
 *       200:
 *         description: Successfully updated configuration
 */
router.put('/:slug/page-config', updatePageConfig);

export default router;
