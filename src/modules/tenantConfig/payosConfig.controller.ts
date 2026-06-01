import { Request, Response, NextFunction } from 'express';
import { encrypt, decrypt } from '../../utils/crypto.util';
import { clearPayOSCache } from '../../services/payos.service';
import { PayOS } from '@payos/node';
import { sendResponse } from '../../utils/response';
import { AppError } from '../../middleware/error.middleware';

/**
 * GET /api/v1/dashboard/payos/config
 * Retrieve masked PayOS credentials configuration
 */
export const getPayOSConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenant = req.tenant!;
    const config = tenant.payosConfig;

    if (!config || !config.clientId) {
      sendResponse(res, 200, true, {
        isEnabled: false,
        clientId: null,
        hasApiKey: false,
        hasChecksumKey: false,
        tenantId: String(tenant._id)
      }, 'No PayOS configuration found.');
      return;
    }

    let maskedClientId = '';
    try {
      const decryptedClientId = decrypt(config.clientId);
      maskedClientId = decryptedClientId.length > 4
        ? '••••••••' + decryptedClientId.slice(-4)
        : '••••••••';
    } catch (err) {
      maskedClientId = '••••••••';
    }

    sendResponse(res, 200, true, {
      isEnabled: config.isEnabled,
      clientId: maskedClientId,
      hasApiKey: !!config.apiKey,
      hasChecksumKey: !!config.checksumKey,
      tenantId: String(tenant._id)
    }, 'PayOS configuration retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/dashboard/payos/config
 * Save and encrypt PayOS credentials after verifying connection
 */
export const updatePayOSConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { clientId, apiKey, checksumKey } = req.body;

    if (!clientId || !apiKey || !checksumKey) {
      return next(new AppError('Client ID, API Key, and Checksum Key are required.', 400));
    }

    // 1. Test PayOS integration by creating a minimal mock payment link
    const testPayos = new PayOS({
      clientId: clientId.trim(),
      apiKey: apiKey.trim(),
      checksumKey: checksumKey.trim()
    });

    try {
      await testPayos.paymentRequests.create({
        orderCode: Date.now(),
        amount: 2000,
        description: 'Verify Config',
        cancelUrl: 'https://hoalang.site/payment/cancel',
        returnUrl: 'https://hoalang.site/payment/success'
      });
    } catch (payosError: any) {
      console.error('[PayOS Setup Validation Error]', payosError);
      return next(new AppError(`API key không hợp lệ hoặc lỗi cổng kết nối: ${payosError.message || payosError}`, 400));
    }

    // 2. Encryption
    const encryptedClientId = encrypt(clientId.trim());
    const encryptedApiKey = encrypt(apiKey.trim());
    const encryptedChecksumKey = encrypt(checksumKey.trim());

    // 3. Save to Tenant Core Document
    req.tenant!.payosConfig = {
      clientId: encryptedClientId,
      apiKey: encryptedApiKey,
      checksumKey: encryptedChecksumKey,
      isEnabled: true
    };
    await req.tenant!.save();

    // 4. Wipe dynamic instance cache
    clearPayOSCache(String(req.tenant!._id));

    sendResponse(res, 200, true, { isEnabled: true }, 'Cấu hình PayOS kết nối thành công.');
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/dashboard/payos/config
 * Remove PayOS integration credentials and disable online payment
 */
export const deletePayOSConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    req.tenant!.payosConfig = {
      clientId: null,
      apiKey: null,
      checksumKey: null,
      isEnabled: false
    };
    await req.tenant!.save();

    // Clear dynamic instance cache
    clearPayOSCache(String(req.tenant!._id));

    sendResponse(res, 200, true, { success: true }, 'Đã xóa cấu hình PayOS thành công.');
  } catch (error) {
    next(error);
  }
};
