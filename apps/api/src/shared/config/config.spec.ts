import { loadConfig } from './config.js';

const validEnv = { DATABASE_URL: 'postgresql://shop:shop@localhost:5433/shop' };

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

  it('fails fast with a readable message', () => {
    expect(() => loadConfig({})).toThrow(/DATABASE_URL/);
    expect(() => loadConfig({ DATABASE_URL: 'mysql://x' })).toThrow(/DATABASE_URL/);
    expect(() => loadConfig({ ...validEnv, PORT: 'abc' })).toThrow(/PORT/);
  });
});
