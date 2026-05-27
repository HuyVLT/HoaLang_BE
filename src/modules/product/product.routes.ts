import { Router } from 'express';
import { getProducts, createProduct, seedTenantProducts } from './product.controller';

const router = Router();

/**
 * @swagger
 * /api/v1/products:
 *   get:
 *     summary: Get all products for the resolved tenant
 *     tags: [Products]
 *     parameters:
 *       - in: header
 *         name: x-tenant-slug
 *         required: true
 *         schema:
 *           type: string
 *           example: bat-trang
 *         description: The tenant slug to resolve context (Bát Tràng, Vạn Phúc, Non Nước)
 *     responses:
 *       200:
 *         description: Successfully retrieved products
 *       404:
 *         description: Tenant not found
 */
router.get('/', getProducts);

/**
 * @swagger
 * /api/v1/products:
 *   post:
 *     summary: Create a product in the resolved tenant database
 *     tags: [Products]
 *     parameters:
 *       - in: header
 *         name: x-tenant-slug
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
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: object
 *                 properties:
 *                   vi:
 *                     type: string
 *                     example: Bình hút lộc
 *                   en:
 *                     type: string
 *                     example: Wealth Urn
 *               price:
 *                 type: number
 *                 example: 1200000
 *               stock:
 *                 type: number
 *                 example: 15
 *     responses:
 *       210:
 *         description: Product created successfully
 */
router.post('/', createProduct);

/**
 * @swagger
 * /api/v1/products/seed:
 *   post:
 *     summary: Seed demo products for the resolved tenant
 *     tags: [Products]
 *     parameters:
 *       - in: header
 *         name: x-tenant-slug
 *         required: true
 *         schema:
 *           type: string
 *           example: bat-trang
 *     responses:
 *       201:
 *         description: Seed complete
 */
router.post('/seed', seedTenantProducts);

export default router;
