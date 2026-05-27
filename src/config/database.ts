/**
 * @deprecated
 * The legacy single-tenant database.ts is replaced by:
 *   - src/config/coreDatabase.ts     (hoalang_core connection)
 *   - src/config/tenantConnection.ts (tenant DB connection pool)
 *
 * This file is kept only for backward compatibility with any legacy imports.
 * Remove once all usages have been migrated.
 */
export { connectCoreDB as connectDB, getCoreConnection } from './coreDatabase';
