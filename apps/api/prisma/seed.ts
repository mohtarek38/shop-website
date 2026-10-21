/**
 * Seeds reference data. Safe to run repeatedly: `pnpm db:seed`.
 * Creates the first Owner from OWNER_NAME / OWNER_EMAIL / OWNER_PASSWORD when set.
 */
import { existsSync } from 'node:fs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { createAuth } from '../src/modules/identity/auth.js';
import { ensureStaffUser, seedPermissionsAndRoles } from '../src/modules/identity/identity.seed.js';
import { loadConfig } from '../src/shared/config/config.js';

if (existsSync('.env')) process.loadEnvFile('.env');
const config = loadConfig();
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: config.DATABASE_URL }),
});

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
} finally {
  await prisma.$disconnect();
}
