import { Schema, model, Document } from 'mongoose';

export interface ISystemLog {
  timestamp?: Date;
  type: 'SYSTEM' | 'AUTH' | 'ROUTING' | 'FINANCE';
  message: string;
}

export type SystemLogDocument = ISystemLog & Document;

const SystemLogSchema = new Schema<ISystemLog>(
  {
    type: {
      type: String,
      enum: ['SYSTEM', 'AUTH', 'ROUTING', 'FINANCE'],
      required: true,
    },
    message: { type: String, required: true },
  },
  { timestamps: { createdAt: 'timestamp', updatedAt: false } }
);

export const SystemLog = model<ISystemLog>('SystemLog', SystemLogSchema);
export default SystemLog;
