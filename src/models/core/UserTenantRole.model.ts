import { Schema, Types, model, Document } from 'mongoose';

export interface IUserTenantRole {
  userId: Types.ObjectId;
  tenantId: Types.ObjectId;
  role: 'OWNER' | 'STAFF';
  createdAt?: Date;
  updatedAt?: Date;
}

export type UserTenantRoleDocument = IUserTenantRole & Document;

const UserTenantRoleSchema = new Schema<IUserTenantRole>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    role: {
      type: String,
      enum: ['OWNER', 'STAFF'],
      required: true,
    },
  },
  { timestamps: true }
);

// Enforce unique combination index to prevent duplicate roles per user/tenant
UserTenantRoleSchema.index({ userId: 1, tenantId: 1 }, { unique: true });
UserTenantRoleSchema.index({ tenantId: 1 });

export const UserTenantRole = model<IUserTenantRole>('UserTenantRole', UserTenantRoleSchema);
export default UserTenantRole;
