import { Injectable } from '@nestjs/common';
import { ALL_PERMISSIONS, type Permission } from '@shop/contracts';
import { PrismaService } from '../../shared/database/prisma.service.js';

export const OWNER_ROLE = 'owner';

/** The only code that queries identity tables (ADR-0002). */
@Injectable()
export class IdentityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserAccess(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        type: true,
        disabledAt: true,
        roles: {
          select: {
            role: { select: { key: true, permissions: { select: { permissionKey: true } } } },
          },
        },
      },
    });
    if (!user) return null;

    const roleKeys = user.roles.map((r) => r.role.key);
    const permissions = roleKeys.includes(OWNER_ROLE)
      ? [...ALL_PERMISSIONS]
      : [
          ...new Set(
            user.roles.flatMap((r) => r.role.permissions.map((p) => p.permissionKey as Permission)),
          ),
        ];

    return { type: user.type, disabledAt: user.disabledAt, roles: roleKeys, permissions };
  }

  async setUserLocale(userId: string, locale: 'ar' | 'en'): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { locale } });
  }
}
