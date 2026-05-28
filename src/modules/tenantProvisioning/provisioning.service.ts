import { Tenant, ITenant, TenantDocument } from '../../models/core/Tenant.model';
import { PageConfig } from '../../models/core/PageConfig.model';
import { getStarterTemplate } from '../tenantConfig/starterTemplates';
import { getTenantConnection } from '../../config/tenantConnection';
import { getTenantModels } from '../shared/modelFactory/modelFactory';

export interface CreateTenantInput {
  slug: string;
  name: string;
  domain: string;
  features?: Partial<ITenant['features']>;
  theme?: Partial<ITenant['theme']>;
}

export interface ProvisionResult {
  tenant: TenantDocument;
  dbName: string;
  collectionsInitialized: string[];
  message: string;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TENANT PROVISIONING SERVICE
 *
 * Flow:
 *   1. Validate no duplicate slug/domain
 *   2. Derive dbName from slug (e.g. "bat-trang" → "tenant_battrang")
 *   3. Create Tenant record in hoalang_core
 *   4. Connect to the new tenant database
 *   5. Initialize all tenant collections (schemas registered via model factory)
 *   6. Seed default CMS page (home page)
 *   7. Return provisioning result
 * ─────────────────────────────────────────────────────────────────────────────
 */
export class ProvisioningService {
  /**
   * Derive the MongoDB database name from the tenant slug.
   * e.g. "bat-trang" → "tenant_battrang"
   */
  private static slugToDbName(slug: string): string {
    return `tenant_${slug.replace(/-/g, '')}`;
  }

  /**
   * Create a new tenant: register in core DB, provision tenant DB,
   * initialize collections, seed defaults.
   */
  public async createTenant(input: CreateTenantInput): Promise<ProvisionResult> {
    const { slug, name, domain, features, theme } = input;

    // ── 1. Check for conflicts ───────────────────────────────────────────────
    const exists = await Tenant.findOne({ $or: [{ slug }, { domain }] });
    if (exists) {
      throw new Error(
        `Tenant with slug '${slug}' or domain '${domain}' already exists.`
      );
    }

    // ── 2. Derive dbName ─────────────────────────────────────────────────────
    const dbName = ProvisioningService.slugToDbName(slug);

    // ── 3. Create core Tenant record ─────────────────────────────────────────
    const tenant = await Tenant.create({
      slug,
      name,
      domain,
      dbName,
      status: 'ACTIVE',
      features: {
        ecommerce: features?.ecommerce ?? true,
        booking: features?.booking ?? true,
        aiAssistant: features?.aiAssistant ?? false,
      },
      theme: {
        primaryColor: theme?.primaryColor ?? '#8B1A1A',
        logo: theme?.logo,
      },
    });

    console.log(`[Provisioning] Tenant '${slug}' record created in hoalang_core.`);

    // ── 4. Connect to tenant database ────────────────────────────────────────
    const tenantDb = await getTenantConnection(dbName);

    // ── 5. Initialize all collections by registering schemas ─────────────────
    //    MongoDB creates a collection lazily on first insert, but
    //    calling model() registers the schema and ensures indexes are synced.
    const models = getTenantModels(tenantDb);
    const collectionsInitialized = Object.keys(models);

    // Ensure indexes are built on all collections
    await Promise.all(
      Object.values(models).map((model) => model.createIndexes())
    );

    console.log(
      `[Provisioning] Collections initialized for '${dbName}':`,
      collectionsInitialized.join(', ')
    );

    // ── 6. Seed default home CMS page ────────────────────────────────────────
    await models.CmsPage.create({
      slug: 'home',
      title: {
        vi: `Trang chủ ${name}`,
        en: `${name} Home`,
      },
      content: {
        vi: `Chào mừng đến với ${name} — nơi lưu giữ tinh hoa nghề truyền thống.`,
        en: `Welcome to ${name} — where traditional craft heritage is preserved.`,
      },
      isPublished: true,
      publishedAt: new Date(),
    });

    console.log(`[Provisioning] Default CMS 'home' page seeded for '${slug}'.`);

    // ── 6.5 Seed default PageConfig for customization in hoalang_core ─────────
    const starterTemplate = getStarterTemplate(slug.toLowerCase());
    await PageConfig.findOneAndUpdate(
      { tenantId: slug.toLowerCase() },
      {
        $setOnInsert: {
          tenantId: slug.toLowerCase(),
          templateId: starterTemplate.templateId,
          theme: starterTemplate.theme,
          sections: starterTemplate.sections,
        }
      },
      { upsert: true, new: true }
    );
    console.log(`[Provisioning] Default PageConfig seeded for '${slug}' in hoalang_core.`);

    return {
      tenant,
      dbName,
      collectionsInitialized,
      message: `Tenant '${slug}' provisioned successfully on database '${dbName}'.`,
    };
  }

  /**
   * Suspend a tenant (soft-disable without destroying data).
   */
  public async suspendTenant(slug: string): Promise<void> {
    const tenant = await Tenant.findOne({ slug });
    if (!tenant) throw new Error(`Tenant '${slug}' not found.`);
    tenant.status = 'SUSPENDED';
    await tenant.save();
    console.log(`[Provisioning] Tenant '${slug}' suspended.`);
  }

  /**
   * Reactivate a previously suspended tenant.
   */
  public async reactivateTenant(slug: string): Promise<void> {
    const tenant = await Tenant.findOne({ slug });
    if (!tenant) throw new Error(`Tenant '${slug}' not found.`);
    tenant.status = 'ACTIVE';
    await tenant.save();
    console.log(`[Provisioning] Tenant '${slug}' reactivated.`);
  }
}

export const provisioningService = new ProvisioningService();
export default provisioningService;
