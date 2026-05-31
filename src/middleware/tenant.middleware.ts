import { Request, Response, NextFunction } from 'express';
import { Tenant } from '../models/core/Tenant.model';
import { getTenantConnection } from '../config/tenantConnection';
import { AppError } from './error.middleware';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TENANT RESOLVER MIDDLEWARE
 *
 * Resolution strategy (in priority order):
 *  1. Custom header: `x-tenant-slug`  (for dev/testing/API clients)
 *  2. `req.headers.host` hostname parsed against tenant.domain in core DB
 *
 * On success — attaches to the request:
 *  • req.tenant   — TenantDocument from hoalang_core.tenants
 *  • req.tenantDb — active Mongoose Connection for the tenant DB
 *
 * On failure:
 *  • 404 — tenant not found or SUSPENDED
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const resolveTenant = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // ── 1. Determine lookup key ──────────────────────────────────────────────
    const slugHeader = req.headers['x-tenant-slug'] as string | undefined;
    const host = req.headers.host?.split(':')[0]?.toLowerCase() ?? '';

    let tenant = null;

    if (slugHeader) {
      // Dev/test path: explicit slug header takes precedence
      tenant = await Tenant.findOne({ slug: slugHeader.toLowerCase() });
    } else if (host) {
      // 1. Try to resolve by exact domain first (production path)
      tenant = await Tenant.findOne({ domain: host });

      // 2. If not found, try to resolve by subdomain (local development path)
      if (!tenant) {
        let subdomain = '';
        if (host.endsWith('.localhost')) {
          subdomain = host.split('.localhost')[0];
        } else if (host.endsWith('.hoalang.site')) {
          subdomain = host.split('.hoalang.site')[0];
        }

        if (subdomain && subdomain !== 'localhost' && subdomain !== 'www') {
          // Map subdomain to slug
          const map: Record<string, string> = {
            'battrang': 'bat-trang',
            'vanphuc': 'van-phuc',
            'nonnuoc': 'non-nuoc',
          };
          const slug = map[subdomain] || subdomain;
          tenant = await Tenant.findOne({ slug });
        }
      }
    }

    // ── 2. Validate tenant existence and status ──────────────────────────────
    if (!tenant) {
      return next(
        new AppError(
          `Tenant not found. Ensure 'x-tenant-slug' header or domain is correct.`,
          404
        )
      );
    }

    if (tenant.status === 'SUSPENDED') {
      return next(
        new AppError(
          `Tenant '${tenant.slug}' is currently suspended. Please contact support.`,
          403
        )
      );
    }

    // ── 3. Get (or create) the tenant database connection ───────────────────
    const tenantDb = await getTenantConnection(tenant.dbName);

    // ── 4. Attach to request context ─────────────────────────────────────────
    req.tenant = tenant;
    req.tenantDb = tenantDb;

    // ── 5. Structured tenant context log ────────────────────────────────────
    console.log(
      `[tenant: ${tenant.slug}] ${req.method} ${req.originalUrl}`
    );

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Lightweight guard — ensures req.tenantDb is present before proceeding.
 * Use AFTER resolveTenant in route chains that are definitely tenant-scoped.
 */
export const requireTenantDb = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.tenantDb || !req.tenant) {
    return next(
      new AppError('Tenant context is missing. This route requires tenant resolution.', 500)
    );
  }
  next();
};
