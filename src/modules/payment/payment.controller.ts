import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { getOrderModel } from '../../models/tenant/Order.schema';
import { getBookingModel } from '../../models/tenant/Booking.schema';
import { getProductModel } from '../../models/tenant/Product.schema';
import { getExperienceModel } from '../../models/tenant/Experience.schema';
import { Tenant } from '../../models/core/Tenant.model';
import { Voucher } from '../../models/core/Voucher.model';
import { getTenantConnection } from '../../config/tenantConnection';
import {
  createTenantPayOSLink,
  getTenantPayOSPaymentInfo,
  cancelTenantPayOSLink,
  verifyTenantWebhook
} from '../../services/payos.service';
import { sendResponse } from '../../utils/response';
import { AppError } from '../../middleware/error.middleware';

/**
 * POST /api/v1/orders
 * Create order and initialize payment using Tenant PayOS settings
 */
export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const Order = getOrderModel(req.tenantDb!);
    const Product = getProductModel(req.tenantDb!);
    const tenant = req.tenant!;

    const { items, shippingAddress, paymentMethod, voucherCode } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0 || !shippingAddress) {
      return next(new AppError('Items and shipping address are required.', 400));
    }

    if (!paymentMethod || !['COD', 'PAYOS'].includes(paymentMethod)) {
      return next(new AppError('Invalid payment method. Use COD or PAYOS.', 400));
    }

    // PayOS requires tenant setup check
    if (paymentMethod === 'PAYOS') {
      if (!tenant.payosConfig || !tenant.payosConfig.isEnabled) {
        return next(new AppError('Làng nghề chưa cấu hình thanh toán online', 400));
      }
    }

    // 1. Validate items + stock and fetch prices
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      if (!item.productId || !item.qty) {
        return next(new AppError('Each item must contain productId and qty.', 400));
      }

      const product = await Product.findById(item.productId);
      if (!product) {
        return next(new AppError(`Product not found: ${item.productId}`, 404));
      }

      if (product.stock < item.qty) {
        return next(new AppError(`Insufficient stock for product: ${product.name.vi}`, 400));
      }

      subtotal += product.price * item.qty;
      validatedItems.push({
        productId: new Types.ObjectId(item.productId),
        qty: item.qty,
        price: product.price,
        name: product.name.vi
      });
    }

    // 2. Compute shipping fee (30,000₫, free if >= 500,000₫)
    const shippingFee = subtotal >= 500000 ? 0 : 30000;
    let total = subtotal + shippingFee;
    let discount = 0;

    if (voucherCode) {
      const now = new Date();
      const voucher = await Voucher.findOne({
        code: voucherCode.toUpperCase(),
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now }
      });

      if (voucher && subtotal >= voucher.minOrderValue) {
        if (voucher.discountType === 'PERCENTAGE') {
          discount = subtotal * (voucher.discountValue / 100);
          if (voucher.maxDiscountValue) {
            discount = Math.min(discount, voucher.maxDiscountValue);
          }
        } else if (voucher.discountType === 'FIXED') {
          discount = voucher.discountValue;
        }
        total = Math.max(0, total - discount);
      }
    }

    // Deduct product stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.qty } });
    }

    // 3. Create order document in DB
    const newOrder = await Order.create({
      userId: req.user?._id || new Types.ObjectId('60d5ec49b1a1a2b3c4d5e6f7'), // default traveler ID if not authenticated
      items: validatedItems,
      total,
      status: 'PENDING',
      shippingAddress,
      paymentMethod,
      voucherCode,
      discount,
      payment: {
        method: paymentMethod,
        status: 'PENDING'
      }
    });

    // 4. Return immediately if COD
    if (paymentMethod === 'COD') {
      sendResponse(res, 201, true, { orderId: newOrder._id, status: 'PENDING' }, 'Order created successfully with COD.');
      return;
    }

    // 5. Generate Tenant PayOS Payment link
    const orderCode = Date.now(); // unique integer
    const payosItems = validatedItems.map(i => ({
      name: i.name,
      quantity: i.qty,
      price: i.price
    }));

    try {
      const { checkoutUrl, qrCode, paymentLinkId } = await createTenantPayOSLink(tenant, {
        orderCode,
        amount: total,
        description: `HoaLang ${newOrder._id}`.slice(0, 25),
        items: payosItems,
        buyerName: shippingAddress.fullName,
        buyerPhone: shippingAddress.phone,
        cancelUrl: process.env.PAYOS_CANCEL_URL || 'https://hoalang.site/payment/cancel',
        returnUrl: process.env.PAYOS_RETURN_URL || 'https://hoalang.site/payment/success',
      });

      // Update order payment information
      newOrder.payment.orderCode = orderCode;
      newOrder.payment.paymentLinkId = paymentLinkId;
      newOrder.payment.checkoutUrl = checkoutUrl;
      newOrder.payment.qrCode = qrCode;
      await newOrder.save();

      sendResponse(res, 201, true, {
        orderId: newOrder._id,
        orderCode,
        checkoutUrl,
        qrCode
      }, 'Order created successfully with PayOS.');
    } catch (payosError: any) {
      // Revert product stock on PayOS failure
      for (const item of items) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.qty } });
      }
      await Order.findByIdAndDelete(newOrder._id);
      return next(new AppError(`PayOS link creation failed: ${payosError.message}`, 500));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/bookings
 * Create experience booking and initialize payment
 */
export const createBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const Booking = getBookingModel(req.tenantDb!);
    const Experience = getExperienceModel(req.tenantDb!);
    const tenant = req.tenant!;

    const { experienceId, date, guests, notes, paymentMethod } = req.body;

    if (!experienceId || !date || !guests) {
      return next(new AppError('ExperienceId, date, and guests count are required.', 400));
    }

    if (!paymentMethod || !['COD', 'PAYOS'].includes(paymentMethod)) {
      return next(new AppError('Invalid payment method. Use COD or PAYOS.', 400));
    }

    // PayOS requires tenant setup check
    if (paymentMethod === 'PAYOS') {
      if (!tenant.payosConfig || !tenant.payosConfig.isEnabled) {
        return next(new AppError('Làng nghề chưa cấu hình thanh toán online', 400));
      }
    }

    const experience = await Experience.findById(experienceId);
    if (!experience) {
      return next(new AppError('Experience not found.', 404));
    }

    const totalPrice = experience.price * guests;

    // Create booking document
    const newBooking = await Booking.create({
      userId: req.user?._id || new Types.ObjectId('60d5ec49b1a1a2b3c4d5e6f7'),
      experienceId: new Types.ObjectId(experienceId),
      date: new Date(date),
      guests,
      status: 'PENDING',
      totalPrice,
      notes,
      payment: {
        method: paymentMethod,
        status: 'PENDING'
      }
    });

    if (paymentMethod === 'COD') {
      sendResponse(res, 201, true, { bookingId: newBooking._id, status: 'PENDING' }, 'Booking reserved with payment upon arrival.');
      return;
    }

    const orderCode = Date.now();
    const payosItems = [{
      name: experience.title.vi,
      quantity: guests,
      price: experience.price
    }];

    try {
      const { checkoutUrl, qrCode, paymentLinkId } = await createTenantPayOSLink(tenant, {
        orderCode,
        amount: totalPrice,
        description: `Workshop ${newBooking._id}`.slice(0, 25),
        items: payosItems,
        buyerName: req.user?.fullName || 'Traveler',
        buyerPhone: req.user?.phone || '0900000000',
        cancelUrl: process.env.PAYOS_CANCEL_URL || 'https://hoalang.site/payment/cancel',
        returnUrl: process.env.PAYOS_RETURN_URL || 'https://hoalang.site/payment/success',
      });

      newBooking.payment.orderCode = orderCode;
      newBooking.payment.paymentLinkId = paymentLinkId;
      newBooking.payment.checkoutUrl = checkoutUrl;
      newBooking.payment.qrCode = qrCode;
      await newBooking.save();

      sendResponse(res, 201, true, {
        bookingId: newBooking._id,
        orderCode,
        checkoutUrl,
        qrCode
      }, 'Booking reserved successfully with PayOS.');
    } catch (payosError: any) {
      await Booking.findByIdAndDelete(newBooking._id);
      return next(new AppError(`PayOS booking link generation failed: ${payosError.message}`, 500));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/payment/payos/webhook/:tenantId
 * Tenant-isolated server-to-server webhook endpoint
 */
export const handlePayOSWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { tenantId } = req.params;
    const webhookData = req.body;

    if (!tenantId) {
      res.status(400).json({ success: false, message: 'Tenant ID is required.' });
      return;
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      res.status(404).json({ success: false, message: 'Tenant not found.' });
      return;
    }

    // Verify webhook signature using tenant PayOS keys
    const isValid = await verifyTenantWebhook(tenant, webhookData);
    if (!isValid) {
      res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
      return;
    }

    const { orderCode, code } = webhookData.data;

    const tenantDb = await getTenantConnection(tenant.dbName);
    const Order = getOrderModel(tenantDb);
    const Booking = getBookingModel(tenantDb);

    let updated = false;

    // 1. Try to find matching Order
    const order = await Order.findOne({ 'payment.orderCode': orderCode });
    if (order) {
      if (code === '00') {
        order.payment.status = 'PAID';
        order.payment.paidAt = new Date();
        order.status = 'PAID';
      } else {
        order.payment.status = 'FAILED';
        order.status = 'CANCELLED';

        // Revert product stock
        const Product = getProductModel(tenantDb);
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.qty } });
        }
      }
      await order.save();
      updated = true;
    }

    // 2. Try to find matching Booking
    if (!updated) {
      const booking = await Booking.findOne({ 'payment.orderCode': orderCode });
      if (booking) {
        if (code === '00') {
          booking.payment.status = 'PAID';
          booking.payment.paidAt = new Date();
          booking.status = 'CONFIRMED';
        } else {
          booking.payment.status = 'FAILED';
          booking.status = 'CANCELLED';
        }
        await booking.save();
        updated = true;
      }
    }

    if (updated) {
      console.log(`[PayOS Webhook] Processed payment update for tenant ${tenant.slug}, orderCode: ${orderCode}`);
      res.json({ success: true });
    } else {
      console.warn(`[PayOS Webhook] OrderCode ${orderCode} not found in tenant DB ${tenant.slug}.`);
      res.status(404).json({ success: false, message: 'Order or Booking code not found.' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/payment/status/:orderCode
 * Tenant-scoped polling endpoint
 */
export const getPaymentStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orderCode = Number(req.params.orderCode);
    if (!orderCode) {
      return next(new AppError('Invalid orderCode parameter.', 400));
    }

    const Order = getOrderModel(req.tenantDb!);
    const Booking = getBookingModel(req.tenantDb!);
    const tenant = req.tenant!;

    // 1. Search in orders
    const order = await Order.findOne({ 'payment.orderCode': orderCode });
    if (order) {
      if (order.payment.status === 'PAID') {
        sendResponse(res, 200, true, { status: 'PAID', paidAt: order.payment.paidAt }, 'Order is paid.');
        return;
      }

      // Verify real-time status from PayOS SDK
      try {
        const info = await getTenantPayOSPaymentInfo(tenant, orderCode);
        if (info && info.status === 'PAID') {
          order.payment.status = 'PAID';
          order.payment.paidAt = new Date();
          order.status = 'PAID';
          await order.save();
          sendResponse(res, 200, true, { status: 'PAID', paidAt: order.payment.paidAt }, 'Order is paid (real-time).');
          return;
        }
        sendResponse(res, 200, true, { status: order.payment.status }, 'Order payment pending.');
      } catch (err) {
        sendResponse(res, 200, true, { status: order.payment.status }, 'Order payment pending (API skipped).');
      }
      return;
    }

    // 2. Search in bookings
    const booking = await Booking.findOne({ 'payment.orderCode': orderCode });
    if (booking) {
      if (booking.payment.status === 'PAID') {
        sendResponse(res, 200, true, { status: 'PAID', paidAt: booking.payment.paidAt }, 'Booking is paid.');
        return;
      }

      try {
        const info = await getTenantPayOSPaymentInfo(tenant, orderCode);
        if (info && info.status === 'PAID') {
          booking.payment.status = 'PAID';
          booking.payment.paidAt = new Date();
          booking.status = 'CONFIRMED';
          await booking.save();
          sendResponse(res, 200, true, { status: 'PAID', paidAt: booking.payment.paidAt }, 'Booking is paid (real-time).');
          return;
        }
        sendResponse(res, 200, true, { status: booking.payment.status }, 'Booking payment pending.');
      } catch (err) {
        sendResponse(res, 200, true, { status: booking.payment.status }, 'Booking payment pending (API skipped).');
      }
      return;
    }

    return next(new AppError('Order or Booking code not found.', 404));
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/payment/payos/cancel/:orderCode
 * Tenant-scoped cancellation endpoint
 */
export const cancelPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const orderCode = Number(req.params.orderCode);
    if (!orderCode) {
      return next(new AppError('Invalid orderCode parameter.', 400));
    }

    const Order = getOrderModel(req.tenantDb!);
    const Booking = getBookingModel(req.tenantDb!);
    const tenant = req.tenant!;

    // 1. Search in orders
    const order = await Order.findOne({ 'payment.orderCode': orderCode });
    if (order) {
      try {
        await cancelTenantPayOSLink(tenant, orderCode);
      } catch (err) {
        console.warn('[PayOS Cancel] Link could not be cancelled through SDK.');
      }

      order.payment.status = 'CANCELLED';
      order.status = 'CANCELLED';
      await order.save();

      // Restore product stock
      const Product = getProductModel(req.tenantDb!);
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.qty } });
      }

      sendResponse(res, 200, true, { status: 'CANCELLED' }, 'Order payment successfully cancelled and stock restored.');
      return;
    }

    // 2. Search in bookings
    const booking = await Booking.findOne({ 'payment.orderCode': orderCode });
    if (booking) {
      try {
        await cancelTenantPayOSLink(tenant, orderCode);
      } catch (err) {
        console.warn('[PayOS Cancel] Link could not be cancelled through SDK.');
      }

      booking.payment.status = 'CANCELLED';
      booking.status = 'CANCELLED';
      await booking.save();

      sendResponse(res, 200, true, { status: 'CANCELLED' }, 'Booking payment successfully cancelled.');
      return;
    }

    return next(new AppError('Order or Booking code not found.', 404));
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/tenant/payment-methods
 * Returns checkout payment choices active for the specific resolved tenant
 */
export const getPaymentMethods = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const tenant = req.tenant!;
    const payosEnabled = !!(tenant.payosConfig && tenant.payosConfig.isEnabled);

    sendResponse(res, 200, true, {
      cod: true,
      payos: payosEnabled
    }, 'Retrieved active payment methods.');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/experiences
 * Returns all published experiences of the tenant
 */
export const getExperiences = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const Experience = getExperienceModel(req.tenantDb!);
    const experiences = await Experience.find({ isPublished: true }).sort({ createdAt: -1 });

    sendResponse(res, 200, true, experiences, 'Retrieved experiences successfully.');
  } catch (error) {
    next(error);
  }
};
