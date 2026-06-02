import { Router } from 'express';
import { getVillages, getVillageBySlug } from './village.controller';

const router = Router();

/**
 * @swagger
 * /api/v1/villages:
 *   get:
 *     summary: Get all craft villages
 *     tags: [Villages]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query for name or province
 *       - in: query
 *         name: province
 *         schema:
 *           type: string
 *         description: Filter by province
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by craft category
 *       - in: query
 *         name: isVerified
 *         schema:
 *           type: boolean
 *         description: Filter by verification status
 *     responses:
 *       200:
 *         description: Successfully retrieved craft villages
 */
router.get('/', getVillages);

/**
 * @swagger
 * /api/v1/villages/{slug}:
 *   get:
 *     summary: Get a single craft village by its slug
 *     tags: [Villages]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         example: bat-trang
 *         description: The craft village slug
 *     responses:
 *       200:
 *         description: Successfully retrieved craft village details
 *       404:
 *         description: Craft village not found
 */
router.get('/:slug', getVillageBySlug);

export default router;
