import { Schema, Connection, Model, Types } from 'mongoose';

export interface IOrderItem {
  productId: Types.ObjectId;
  qty: number;
  price: number;   // price snapshot at order time
  name: string;   // product name snapshot (vi)
}

export interface IOrder {
  userId: Types.ObjectId;       // references hoalang_core.users
  items: IOrderItem[];
  total: number;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  shippingAddress?: {
    fullName: string;
    phone: string;
    address: string;
    city: string;
    province: string;
  };
  paymentMethod?: string;
  paidAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.ObjectId, required: true },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    name: { type: String, required: true },
  },
  { _id: false }
);

export const OrderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, required: true },
    items: { type: [OrderItemSchema], required: true },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
      default: 'PENDING',
    },
    shippingAddress: {
      fullName: { type: String },
      phone: { type: String },
      address: { type: String },
      city: { type: String },
      province: { type: String },
    },
    paymentMethod: { type: String },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

OrderSchema.index({ userId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });

export function getOrderModel(connection: Connection): Model<IOrder> {
  return (
    connection.models['Order'] ??
    connection.model<IOrder>('Order', OrderSchema)
  );
}
