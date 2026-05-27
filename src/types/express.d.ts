import { Connection, Document } from 'mongoose';
import { TenantDocument } from '../models/core/Tenant.model';
import { UserDocument } from '../models/core/User.model';

declare global {
  namespace Express {
    /**
     * Augment Express User with HoaLang UserDocument fields.
     * Used by Passport.js deserialization and protect middleware.
     */
    interface User extends UserDocument {}

    interface Request {
      /**
       * Authenticated user (set by protect middleware via Passport / JWT).
       * References hoalang_core.users
       */
      user?: UserDocument;

      /**
       * Resolved tenant record from hoalang_core.tenants.
       * Set by tenant.middleware.ts
       */
      tenant?: TenantDocument;

      /**
       * Active Mongoose Connection for the resolved tenant database.
       * e.g. tenant_battrang, tenant_vanphuc
       * Set by tenant.middleware.ts
       */
      tenantDb?: Connection;
    }
  }
}

export {};
