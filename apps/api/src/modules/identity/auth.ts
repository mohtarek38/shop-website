import { normalizeEgyptianMobile, PASSWORD_MIN_LENGTH } from '@shop/contracts';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { username } from 'better-auth/plugins';
import type { PrismaClient } from '../../generated/prisma/client.js';
import type { AppConfig } from '../../shared/config/config.js';

export const AUTH_BASE_PATH = '/api/auth';

/**
 * Better Auth instance (ADR-0009). Authentication only; authorization is our own RBAC.
 * This module is the only place in the codebase that imports better-auth.
 */
export function createAuth(
  prisma: PrismaClient,
  config: Pick<AppConfig, 'AUTH_SECRET' | 'AUTH_BASE_URL' | 'AUTH_TRUSTED_ORIGINS' | 'NODE_ENV'>,
) {
  return betterAuth({
    appName: 'Shop',
    secret: config.AUTH_SECRET,
    baseURL: config.AUTH_BASE_URL,
    basePath: AUTH_BASE_PATH,
    trustedOrigins: config.AUTH_TRUSTED_ORIGINS,
    database: prismaAdapter(prisma, { provider: 'postgresql' }),

    // Customers register through POST /api/v1/auth/register (phone + synthetic email),
    // so the raw email sign-up endpoint is closed to HTTP callers.
    disabledPaths: ['/sign-up/email'],

    emailAndPassword: {
      enabled: true,
      minPasswordLength: PASSWORD_MIN_LENGTH,
      autoSignIn: true,
    },

    plugins: [
      // Phone + password login: the username is the customer's E.164 phone number.
      username({
        usernameValidator: (value) => normalizeEgyptianMobile(value) === value,
        minUsernameLength: 13,
        maxUsernameLength: 13,
      }),
    ],

    user: {
      additionalFields: {
        type: { type: 'string', defaultValue: 'customer', input: false },
        locale: { type: 'string', defaultValue: 'ar', input: false },
        disabledAt: { type: 'date', required: false, input: false },
      },
    },

    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days
      updateAge: 60 * 60 * 24, // refresh expiry at most once a day
      // No cookie cache: every request checks the DB, so revoking a session or
      // disabling a user takes effect immediately.
    },

    databaseHooks: {
      session: {
        create: {
          // Disabled accounts can't sign in.
          before: async (session) => {
            const user = await prisma.user.findUnique({
              where: { id: session.userId },
              select: { disabledAt: true },
            });
            return user?.disabledAt ? false : undefined;
          },
        },
      },
    },

    advanced: {
      cookiePrefix: 'shop',
      // Let Postgres/Prisma generate UUIDv7 ids instead of Better Auth's random strings.
      database: { generateId: false },
    },

    rateLimit: { enabled: config.NODE_ENV === 'production' },
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type AuthSession = NonNullable<Awaited<ReturnType<Auth['api']['getSession']>>>;
