import { Schema, model } from 'mongoose';

const ItinerarySchema = new Schema({
  userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title:    String,
  days:     Number,
  data:     Schema.Types.Mixed,
}, { timestamps: true });

export const Itinerary = model('Itinerary', ItinerarySchema);
export default Itinerary;
