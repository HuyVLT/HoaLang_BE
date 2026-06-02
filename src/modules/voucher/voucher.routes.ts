import { Router } from 'express';
import { voucherController } from './voucher.controller';

const router = Router();

/**
 * @openapi
 * /vouchers:
 *   get:
 *     summary: Retrieve active discount codes/vouchers
 *     tags: [Vouchers]
 *     responses:
 *       200:
 *         description: Active vouchers retrieved successfully
 */
router.get('/', voucherController.getActiveVouchers);

export default router;

