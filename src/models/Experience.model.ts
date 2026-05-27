import { Schema, model } from 'mongoose';

const ExperienceSchema = new Schema({
  villageId:  { type: Schema.Types.ObjectId, ref: 'Village', required: true },
  title:      {
    vi: String,
    en: String
  },
  desc:       {
    vi: String,
    en: String
  },
  duration:   Number,
  maxGuests:  Number,
  price:      Number,
  schedule:   [Date],
}, { timestamps: true });

export const Experience = model('Experience', ExperienceSchema);
export default Experience;
