import { PayOS } from '@payos/node';
import { decrypt } from '../utils/crypto.util';

// Cache PayOS instances by tenantId to avoid re-initializing on every request
const payosInstances = new Map<string, PayOS>();

export function getPayOSInstance(tenant: {
  id: string;
  payosConfig: {
    clientId: string | null;
    apiKey: string | null;
    checksumKey: string | null;
    isEnabled: boolean;
  };
}): PayOS {
  if (!tenant.payosConfig || !tenant.payosConfig.isEnabled) {
    throw new Error('PayOS chưa được cấu hình cho làng nghề này');
  }

  // Return cached instance if already exists
  if (payosInstances.has(tenant.id)) {
    return payosInstances.get(tenant.id)!;
  }

  if (!tenant.payosConfig.clientId || !tenant.payosConfig.apiKey || !tenant.payosConfig.checksumKey) {
    throw new Error('Cấu hình PayOS bị thiếu thông tin khóa bảo mật');
  }

  // Decrypt keys
  const clientId = decrypt(tenant.payosConfig.clientId);
  const apiKey = decrypt(tenant.payosConfig.apiKey);
  const checksumKey = decrypt(tenant.payosConfig.checksumKey);

  const instance = new PayOS({ clientId, apiKey, checksumKey });
  payosInstances.set(tenant.id, instance);
  return instance;
}

// When tenant updates config -> delete old cache
export function clearPayOSCache(tenantId: string) {
  payosInstances.delete(tenantId);
}

export async function createTenantPayOSLink(
  tenant: any,
  params: {
    orderCode: number;
    amount: number;
    description: string;
    items: { name: string; quantity: number; price: number }[];
    buyerName?: string;
    buyerPhone?: string;
    buyerEmail?: string;
    cancelUrl: string;
    returnUrl: string;
  }
) {
  const payos = getPayOSInstance({
    id: String(tenant._id || tenant.id),
    payosConfig: tenant.payosConfig
  });

  const cleanDescription = params.description
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .slice(0, 25);

  const body = {
    orderCode: params.orderCode,
    amount: params.amount,
    description: cleanDescription || 'HoaLang Payment',
    items: params.items.map(item => ({
      name: item.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9 ]/g, '')
        .slice(0, 50),
      quantity: item.quantity,
      price: item.price
    })),
    buyerName: params.buyerName,
    buyerPhone: params.buyerPhone,
    buyerEmail: params.buyerEmail,
    cancelUrl: params.cancelUrl,
    returnUrl: params.returnUrl,
  };

  const response = await payos.paymentRequests.create(body);
  return {
    checkoutUrl: response.checkoutUrl,
    qrCode: response.qrCode,
    paymentLinkId: response.paymentLinkId,
  };
}

export async function getTenantPayOSPaymentInfo(tenant: any, orderCode: number) {
  const payos = getPayOSInstance({
    id: String(tenant._id || tenant.id),
    payosConfig: tenant.payosConfig
  });
  return await payos.paymentRequests.get(orderCode);
}

export async function cancelTenantPayOSLink(tenant: any, orderCode: number) {
  const payos = getPayOSInstance({
    id: String(tenant._id || tenant.id),
    payosConfig: tenant.payosConfig
  });
  return await payos.paymentRequests.cancel(orderCode);
}

export async function verifyTenantWebhook(
  tenant: any,
  webhookData: any
): Promise<boolean> {
  try {
    const payos = getPayOSInstance({
      id: String(tenant._id || tenant.id),
      payosConfig: tenant.payosConfig
    });
    await payos.webhooks.verify(webhookData);
    return true;
  } catch (error) {
    console.error('[PayOS Tenant Service] Webhook verification failed:', error);
    return false;
  }
}
