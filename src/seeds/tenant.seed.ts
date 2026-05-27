import dotenv from 'dotenv';
dotenv.config();

import { connectCoreDB } from '../config/coreDatabase';
import { provisioningService } from '../modules/tenantProvisioning/provisioning.service';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * TENANT SEEDER
 *
 * Seeds the three initial HoaLang craft village tenants:
 *   • Bát Tràng  (Ceramics — Ha Noi)
 *   • Vạn Phúc   (Silk — Ha Noi)
 *   • Non Nước   (Stone Carving — Da Nang)
 *
 * Run with:   npx ts-node src/seeds/tenant.seed.ts
 * ─────────────────────────────────────────────────────────────────────────────
 */

const TENANTS_TO_SEED = [
  {
    slug: 'bat-trang',
    name: 'Làng Gốm Bát Tràng',
    domain: 'battrang.hoalang.vn',
    features: { ecommerce: true, booking: true, aiAssistant: true },
    theme: { primaryColor: '#8B5A2B', logo: '/logos/bat-trang.svg' },
  },
  {
    slug: 'van-phuc',
    name: 'Làng Lụa Vạn Phúc',
    domain: 'vanphuc.hoalang.vn',
    features: { ecommerce: true, booking: true, aiAssistant: false },
    theme: { primaryColor: '#8B1A1A', logo: '/logos/van-phuc.svg' },
  },
  {
    slug: 'non-nuoc',
    name: 'Làng Đá Mỹ Nghệ Non Nước',
    domain: 'nonnuoc.hoalang.vn',
    features: { ecommerce: true, booking: false, aiAssistant: false },
    theme: { primaryColor: '#4A5568', logo: '/logos/non-nuoc.svg' },
  },
];

const runSeed = async (): Promise<void> => {
  console.log('═══════════════════════════════════════════════════');
  console.log('  HoaLang — Tenant Seeder');
  console.log('═══════════════════════════════════════════════════\n');

  // Connect to core database
  await connectCoreDB();
  console.log('[Seed] Connected to hoalang_core.\n');

  let seeded = 0;
  let skipped = 0;

  for (const tenantData of TENANTS_TO_SEED) {
    try {
      console.log(`[Seed] Provisioning tenant: ${tenantData.slug}...`);
      const result = await provisioningService.createTenant(tenantData);
      console.log(`  ✓ ${result.message}`);
      console.log(`  ✓ Collections: ${result.collectionsInitialized.join(', ')}\n`);
      seeded++;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('already exists')) {
        console.log(`  ⚠ Skipping '${tenantData.slug}': ${message}\n`);
        skipped++;
      } else {
        console.error(`  ✗ Failed to provision '${tenantData.slug}':`, message);
      }
    }
  }

  console.log('═══════════════════════════════════════════════════');
  console.log(`  Seed complete: ${seeded} created, ${skipped} skipped.`);
  console.log('═══════════════════════════════════════════════════');

  process.exit(0);
};

runSeed().catch((err) => {
  console.error('[Seed] Fatal error:', err);
  process.exit(1);
});
