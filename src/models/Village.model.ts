import { Schema, model } from 'mongoose';

const VillageSchema = new Schema({
  slug:       { type: String, required: true, unique: true },
  name:       {
    vi: String,
    en: String,
    ja: String,
    ko: String,
    zh: String
  },
  desc:       {
    vi: String,
    en: String,
    ja: String,
    ko: String,
    zh: String
  },
  province:   { type: String, required: true },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  categories: [String],
  images:     [String],
  isVerified: { type: Boolean, default: false },
  ownerId:    { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Geo-spatial coordinates indexing
VillageSchema.index({ location: '2dsphere' });

// Full-text search indexing
VillageSchema.index({ 'name.vi': 'text', 'name.en': 'text', province: 'text' });

export const Village = model('Village', VillageSchema);
export default Village;
