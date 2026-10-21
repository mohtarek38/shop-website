/**
 * Seeds reference data. Safe to run repeatedly: `pnpm db:seed`.
 * - Permissions and system roles (always)
 * - The first Owner, from OWNER_NAME / OWNER_EMAIL / OWNER_PASSWORD when set
 * - The default stock location MAIN, when there are no locations yet
 * - Outside production (skip with SEED_SAMPLE_CATALOG=false): a sample catalog while the
 *   catalog is empty, and sample stock while no stock has ever been recorded
 *
 * Services are wired by hand: tsx doesn't emit the decorator metadata Nest's DI needs.
 */
import { existsSync } from 'node:fs';
import { BrandsRepository } from '../src/modules/catalog/brands.repository.js';
import { BrandsService } from '../src/modules/catalog/brands.service.js';
import { CategoriesRepository } from '../src/modules/catalog/categories.repository.js';
import { CategoriesService } from '../src/modules/catalog/categories.service.js';
import { ProductsRepository } from '../src/modules/catalog/products.repository.js';
import { ProductsService } from '../src/modules/catalog/products.service.js';
import { createAuth } from '../src/modules/identity/auth.js';
import { ensureStaffUser, seedPermissionsAndRoles } from '../src/modules/identity/identity.seed.js';
import { InventoryRepository } from '../src/modules/inventory/inventory.repository.js';
import { InventoryService } from '../src/modules/inventory/inventory.service.js';
import { MediaRepository } from '../src/modules/media/media.repository.js';
import { MediaService } from '../src/modules/media/media.service.js';
import { LocalStorage } from '../src/modules/media/storage/local-storage.js';
import { loadConfig } from '../src/shared/config/config.js';
import { PrismaService } from '../src/shared/database/prisma.service.js';
import { seedSampleCatalog, seedSampleStock } from './sample-catalog.js';

if (existsSync('.env')) process.loadEnvFile('.env');
const config = loadConfig();
const prisma = new PrismaService(config);

try {
  await seedPermissionsAndRoles(prisma);
  console.warn('✔ permissions and system roles');

  const { OWNER_NAME, OWNER_EMAIL, OWNER_PASSWORD } = process.env;
  let ownerId: string | null = null;
  if (OWNER_EMAIL && OWNER_PASSWORD) {
    ownerId = await ensureStaffUser(prisma, createAuth(prisma, config), {
      name: OWNER_NAME ?? 'Owner',
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD,
      roles: ['owner'],
    });
    console.warn(`✔ owner account ${OWNER_EMAIL}`);
  } else {
    console.warn('… OWNER_EMAIL / OWNER_PASSWORD not set: skipped owner account');
  }

  const inventory = new InventoryService(new InventoryRepository(prisma));
  if ((await inventory.locations()).length === 0) {
    await inventory.saveLocation(null, {
      code: 'MAIN',
      name: { ar: 'المخزن الرئيسي', en: 'Main warehouse' },
      address: null,
      isDefault: true,
      isActive: true,
      sortOrder: 0,
    });
    console.warn('✔ default stock location MAIN');
  }

  if (config.NODE_ENV !== 'production' && process.env.SEED_SAMPLE_CATALOG !== 'false') {
    const categoriesRepo = new CategoriesRepository(prisma);
    const brandsRepo = new BrandsRepository(prisma);
    const result = await seedSampleCatalog({
      categories: new CategoriesService(categoriesRepo),
      brands: new BrandsService(brandsRepo),
      products: new ProductsService(
        new ProductsRepository(prisma),
        categoriesRepo,
        brandsRepo,
        // Sample products have no images, so storage is never written here.
        new MediaService(
          new MediaRepository(prisma),
          new LocalStorage(config.LOCAL_STORAGE_DIR),
          config,
        ),
        inventory,
      ),
    });
    console.warn(
      result.skipped
        ? '… catalog not empty: skipped sample catalog'
        : `✔ sample catalog: ${result.categories} categories, ${result.brands} brands, ${result.products} products`,
    );

    const stock = await seedSampleStock(prisma, inventory, ownerId);
    console.warn(
      stock.skipped
        ? '… stock already recorded: skipped sample stock'
        : `✔ sample stock for ${stock.variants} variants`,
    );
  }
} finally {
  await prisma.$disconnect();
}
