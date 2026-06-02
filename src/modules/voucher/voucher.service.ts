import { Voucher, IVoucher } from '../../models/core/Voucher.model';

export class VoucherService {
  /**
   * Fetch all active vouchers in the system
   */
  public getActiveVouchers = async (): Promise<IVoucher[]> => {
    const now = new Date();
    return Voucher.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).sort({ createdAt: -1 });
  };
}

export const voucherService = new VoucherService();
export default voucherService;
