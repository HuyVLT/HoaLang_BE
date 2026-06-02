import { Request, Response, NextFunction } from 'express';
import { voucherService } from './voucher.service';
import { sendResponse } from '../../utils/response';

export class VoucherController {
  /**
   * Get all active vouchers
   */
  public getActiveVouchers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vouchers = await voucherService.getActiveVouchers();
      sendResponse(
        res,
        200,
        true,
        vouchers,
        'Active vouchers retrieved successfully.'
      );
    } catch (err) {
      next(err);
    }
  };
}

export const voucherController = new VoucherController();
export default voucherController;
