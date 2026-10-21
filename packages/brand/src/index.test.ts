import { describe, expect, it } from 'vitest';
import { assertNoPlaceholders, brand, findPlaceholders, type Brand } from './index';

const finalBrand: Brand = {
  ...brand,
  name: { ar: 'متجر حقيقي', en: 'Real Shop' },
  shortName: 'Real',
  legalName: 'Real Shop LLC',
  domain: 'realshop.com',
};

describe('brand placeholders', () => {
  it('detects every placeholder field in the default config', () => {
    expect(findPlaceholders(brand)).toEqual([
      'name.ar',
      'name.en',
      'shortName',
      'legalName',
      'domain',
    ]);
  });

  it('throws for placeholders unless explicitly allowed', () => {
    expect(() => assertNoPlaceholders({}, brand)).toThrow(/placeholder/);
    expect(() => assertNoPlaceholders({ ALLOW_BRAND_PLACEHOLDERS: 'true' }, brand)).not.toThrow();
  });

  it('passes for a final brand', () => {
    expect(findPlaceholders(finalBrand)).toEqual([]);
    expect(() => assertNoPlaceholders({}, finalBrand)).not.toThrow();
  });
});
