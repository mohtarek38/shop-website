import { z } from 'zod';

const booleanString = z.enum(['true', 'false']).transform((value) => value === 'true');

/** Every environment variable the API reads. The app refuses to start if any is invalid. */
export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    APP_VERSION: z.string().default('0.0.0-dev'),
    DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
    /** Express `trust proxy` value; in production only Caddy on the Docker network is trusted. */
    TRUST_PROXY: z.string().default('loopback, uniquelocal'),
    /** OpenAPI docs at /api/docs. Defaults to on outside production. */
    SWAGGER_ENABLED: booleanString.optional(),
    /** Signs session cookies. Generate with: openssl rand -base64 32 */
    AUTH_SECRET: z.string().min(32),
    /** Public origin the API is reached at, e.g. https://example.com (cookies become Secure on https). */
    AUTH_BASE_URL: z.url(),
    /** Comma-separated origins allowed to call auth endpoints (storefront + dashboard). */
    AUTH_TRUSTED_ORIGINS: z
      .string()
      .default('')
      .transform((value) =>
        value
          .split(',')
          .map((origin) => origin.trim())
          .filter(Boolean),
      ),

    // ─── Media storage (ADR-0018) ─────────────────────────────────────────────
    /** `local` writes to disk and serves files from the API (dev); `r2` uses Cloudflare R2. */
    STORAGE_DRIVER: z.enum(['local', 'r2']).default('local'),
    /** Folder for the local driver, relative to apps/api. */
    LOCAL_STORAGE_DIR: z.string().default('.storage'),
    /** Base URL of public media: `/api/media/files` locally, e.g. https://img.example.com with R2. */
    MEDIA_PUBLIC_URL: z.string().default('/api/media/files'),
    R2_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_PUBLIC_BUCKET: z.string().optional(),
    R2_PRIVATE_BUCKET: z.string().optional(),
  })
  .superRefine((env, ctx) => {
    if (env.STORAGE_DRIVER !== 'r2') return;
    for (const key of [
      'R2_ACCOUNT_ID',
      'R2_ACCESS_KEY_ID',
      'R2_SECRET_ACCESS_KEY',
      'R2_PUBLIC_BUCKET',
      'R2_PRIVATE_BUCKET',
    ] as const) {
      if (!env[key])
        ctx.addIssue({ code: 'custom', path: [key], message: 'required when STORAGE_DRIVER=r2' });
    }
  });

export type AppConfig = Omit<z.infer<typeof envSchema>, 'SWAGGER_ENABLED'> & {
  SWAGGER_ENABLED: boolean;
};

export const APP_CONFIG = Symbol('APP_CONFIG');

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${problems}`);
  }
  const config = result.data;
  return {
    ...config,
    SWAGGER_ENABLED: config.SWAGGER_ENABLED ?? config.NODE_ENV !== 'production',
  };
}
