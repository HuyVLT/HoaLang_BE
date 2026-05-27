import { Schema, model } from 'mongoose';

const OrderSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    craftId: { type: Schema.Types.ObjectId, ref: 'Craft' },
    qty:     Number,
    price:   Number,
  }],
  total:  Number,
  status: { type: String, enum: ['PENDING','PAID','SHIPPED','DELIVERED','CANCELLED'], default: 'PENDING' },
}, { timestamps: true });

export const Order = model('Order', OrderSchema);
export default Order;
