import { loadConfig } from './config.js';

const validEnv = {
  DATABASE_URL: 'postgresql://shop:shop@localhost:5433/shop',
  AUTH_SECRET: 'x'.repeat(32),
  AUTH_BASE_URL: 'http://localhost:4000',
};

describe('loadConfig', () => {
  it('applies defaults', () => {
    const config = loadConfig(validEnv);
    expect(config.PORT).toBe(4000);
    expect(config.NODE_ENV).toBe('development');
    expect(config.SWAGGER_ENABLED).toBe(true);
  });

  it('disables swagger by default in production', () => {
    expect(loadConfig({ ...validEnv, NODE_ENV: 'production' }).SWAGGER_ENABLED).toBe(false);
    expect(
      loadConfig({ ...validEnv, NODE_ENV: 'production', SWAGGER_ENABLED: 'true' }).SWAGGER_ENABLED,
    ).toBe(true);
  });

  it('splits trusted origins', () => {
    const config = loadConfig({
      ...validEnv,
      AUTH_TRUSTED_ORIGINS: 'http://localhost:3000, http://localhost:5173',
    });
    expect(config.AUTH_TRUSTED_ORIGINS).toEqual(['http://localhost:3000', 'http://localhost:5173']);
  });

  it('uses local media storage by default and requires R2 settings for r2', () => {
    expect(loadConfig(validEnv)).toMatchObject({
      STORAGE_DRIVER: 'local',
      MEDIA_PUBLIC_URL: '/api/media/files',
    });
    expect(() => loadConfig({ ...validEnv, STORAGE_DRIVER: 'r2' })).toThrow(/R2_ACCOUNT_ID/);
  });

  it('fails fast with a readable message', () => {
    expect(() => loadConfig({})).toThrow(/DATABASE_URL/);
    expect(() => loadConfig({ DATABASE_URL: 'mysql://x' })).toThrow(/DATABASE_URL/);
    expect(() => loadConfig({ ...validEnv, PORT: 'abc' })).toThrow(/PORT/);
    expect(() => loadConfig({ ...validEnv, AUTH_SECRET: 'short' })).toThrow(/AUTH_SECRET/);
  });
});
