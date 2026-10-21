import {
  DEFAULT_ROLE_PERMISSIONS,
  type LocalizedText,
  PERMISSIONS,
  SYSTEM_ROLES,
  type SystemRole,
} from '@shop/contracts';
import type { PrismaClient } from '../../generated/prisma/client.js';
import type { Auth } from './auth.js';

const ROLE_NAMES: Record<SystemRole, LocalizedText> = {
  owner: { ar: 'المالك', en: 'Owner' },
  manager: { ar: 'مدير', en: 'Manager' },
  clerk: { ar: 'موظف طلبات', en: 'Clerk' },
  catalog_editor: { ar: 'محرر المنتجات', en: 'Catalog editor' },
  driver: { ar: 'مندوب توصيل', en: 'Driver' },
};

/**
 * Idempotent. Syncs the permission catalog from code and creates missing system roles
 * with their default permissions. Existing roles are left as the Owner configured them.
 */
export async function seedPermissionsAndRoles(prisma: PrismaClient): Promise<void> {
  for (const [module, keys] of Object.entries(PERMISSIONS)) {
    for (const key of keys) {
      await prisma.permission.upsert({
        where: { key },
        create: { key, module },
        update: { module },
      });
    }
  }

  for (const key of SYSTEM_ROLES) {
    const existing = await prisma.role.findUnique({ where: { key } });
    if (existing) continue;
    await prisma.role.create({
      data: {
        key,
        name: ROLE_NAMES[key],
        isSystem: true,
        permissions: {
          create: DEFAULT_ROLE_PERMISSIONS[key].map((permissionKey) => ({ permissionKey })),
        },
      },
    });
  }
}

export interface StaffUserInput {
  name: string;
  email: string;
  password: string;
  roles: string[];
}

/** Creates a staff account (or returns the existing one) and assigns roles. */
export async function ensureStaffUser(
  prisma: PrismaClient,
  auth: Auth,
  input: StaffUserInput,
): Promise<string> {
  const email = input.email.toLowerCase();
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const result = await auth.api.signUpEmail({
      body: { name: input.name, email, password: input.password },
    });
    // Sign-up auto-signs in; staff log in from the dashboard instead. Only this new
    // account's session is removed: re-running the seed must not sign anyone out.
    await prisma.session.deleteMany({ where: { userId: result.user.id } });
    user = await prisma.user.findUniqueOrThrow({ where: { id: result.user.id } });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { type: 'staff', emailVerified: true },
  });

  for (const key of input.roles) {
    const role = await prisma.role.findUniqueOrThrow({ where: { key } });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      create: { userId: user.id, roleId: role.id },
      update: {},
    });
  }
  return user.id;
}
