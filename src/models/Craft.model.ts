import { Schema, model } from 'mongoose';

const CraftSchema = new Schema({
  villageId:  { type: Schema.Types.ObjectId, ref: 'Village', required: true },
  name:       {
    vi: String,
    en: String
  },
  desc:       {
    vi: String,
    en: String
  },
  price:      { type: Number, required: true },
  images:     [String],
  stock:      { type: Number, default: 0 },
}, { timestamps: true });

export const Craft = model('Craft', CraftSchema);
export default Craft;
