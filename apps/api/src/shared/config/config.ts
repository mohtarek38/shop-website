import { z } from 'zod';

const booleanString = z.enum(['true', 'false']).transform((value) => value === 'true');

/** Every environment variable the API reads. The app refuses to start if any is invalid. */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  APP_VERSION: z.string().default('0.0.0-dev'),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  /** Express `trust proxy` value; in production only Caddy on the Docker network is trusted. */
  TRUST_PROXY: z.string().default('loopback, uniquelocal'),
  /** OpenAPI docs at /api/docs. Defaults to on outside production. */
  SWAGGER_ENABLED: booleanString.optional(),
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
