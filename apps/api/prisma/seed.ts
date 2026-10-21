/**
 * Seeds reference data. Safe to run repeatedly: `pnpm db:seed`.
 * - Permissions and system roles (always)
 * - The first Owner, from OWNER_NAME / OWNER_EMAIL / OWNER_PASSWORD when set
 * - A sample catalog, outside production and only while the catalog is empty
 *   (skip with SEED_SAMPLE_CATALOG=false)
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
import { loadConfig } from '../src/shared/config/config.js';
import { PrismaService } from '../src/shared/database/prisma.service.js';
import { seedSampleCatalog } from './sample-catalog.js';

if (existsSync('.env')) process.loadEnvFile('.env');
const config = loadConfig();
const prisma = new PrismaService(config);

try {
  await seedPermissionsAndRoles(prisma);
  console.warn('✔ permissions and system roles');

  const { OWNER_NAME, OWNER_EMAIL, OWNER_PASSWORD } = process.env;
  if (OWNER_EMAIL && OWNER_PASSWORD) {
    await ensureStaffUser(prisma, createAuth(prisma, config), {
      name: OWNER_NAME ?? 'Owner',
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD,
      roles: ['owner'],
    });
    console.warn(`✔ owner account ${OWNER_EMAIL}`);
  } else {
    console.warn('… OWNER_EMAIL / OWNER_PASSWORD not set: skipped owner account');
  }

  if (config.NODE_ENV !== 'production' && process.env.SEED_SAMPLE_CATALOG !== 'false') {
    const categoriesRepo = new CategoriesRepository(prisma);
    const brandsRepo = new BrandsRepository(prisma);
    const result = await seedSampleCatalog({
      categories: new CategoriesService(categoriesRepo),
      brands: new BrandsService(brandsRepo),
      products: new ProductsService(new ProductsRepository(prisma), categoriesRepo, brandsRepo),
    });
    console.warn(
      result.skipped
        ? '… catalog not empty: skipped sample catalog'
        : `✔ sample catalog: ${result.categories} categories, ${result.brands} brands, ${result.products} products`,
    );
  }
} finally {
  await prisma.$disconnect();
}
