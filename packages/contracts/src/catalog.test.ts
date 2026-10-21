import { describe, expect, it } from 'vitest';
import {
  categoryAttributeInputSchema,
  productInputSchema,
  slugSchema,
  specsSchemaFor,
  variantInputSchema,
} from './catalog';
import { localizedTextSchema } from './localized-text';

const uuid = '01a15fae-6fdf-75ea-806a-7a47847206a5';
const variant = { sku: 'SAM-RT38-SL', price: 2_499_900 };

describe('slugSchema', () => {
  it('accepts lowercase hyphenated slugs and lowercases input', () => {
    expect(slugSchema.parse('Samsung-RT38')).toBe('samsung-rt38');
    expect(slugSchema.safeParse('no spaces').success).toBe(false);
    expect(slugSchema.safeParse('-leading').success).toBe(false);
    expect(slugSchema.safeParse('ثلاجة').success).toBe(false);
  });
});

describe('localizedTextSchema', () => {
  it('treats a blank English value as missing', () => {
    expect(localizedTextSchema.parse({ ar: 'ثلاجة', en: '  ' })).toEqual({ ar: 'ثلاجة' });
    expect(localizedTextSchema.safeParse({ ar: '' }).success).toBe(false);
  });
});

describe('categoryAttributeInputSchema', () => {
  const base = { key: 'energy_class', label: { ar: 'فئة الطاقة' } };

  it('requires options for enum attributes and forbids them otherwise', () => {
    expect(categoryAttributeInputSchema.safeParse({ ...base, type: 'enum' }).success).toBe(false);
    expect(
      categoryAttributeInputSchema.safeParse({
        ...base,
        type: 'number',
        options: [{ value: 'a', label: { ar: 'أ' } }],
      }).success,
    ).toBe(false);
    expect(
      categoryAttributeInputSchema.parse({
        ...base,
        type: 'enum',
        options: [{ value: 'a_plus', label: { ar: 'A+' } }],
      }).isComparable,
    ).toBe(true);
  });

  it('rejects keys that are not snake_case', () => {
    expect(
      categoryAttributeInputSchema.safeParse({ ...base, key: 'Energy Class', type: 'text' })
        .success,
    ).toBe(false);
  });
});

describe('variantInputSchema', () => {
  it('requires the sale price to be lower than the price', () => {
    expect(variantInputSchema.safeParse({ ...variant, salePrice: 2_499_900 }).success).toBe(false);
    expect(variantInputSchema.parse({ ...variant, salePrice: 2_299_900 }).salePrice).toBe(
      2_299_900,
    );
  });

  it('requires the sale to end after it starts', () => {
    const result = variantInputSchema.safeParse({
      ...variant,
      salePrice: 1000,
      saleStartsAt: '2026-11-10T00:00:00+02:00',
      saleEndsAt: '2026-11-01T00:00:00+02:00',
    });
    expect(result.success).toBe(false);
  });

  it('normalizes blank optional text to null', () => {
    expect(variantInputSchema.parse({ ...variant, modelNumber: '  ' }).modelNumber).toBeNull();
  });
});

describe('productInputSchema', () => {
  const product = {
    categoryId: uuid,
    brandId: uuid,
    slug: 'samsung-rt38',
    name: { ar: 'ثلاجة سامسونج' },
  };

  it('requires at least one variant and unique SKUs (case-insensitive)', () => {
    expect(productInputSchema.safeParse({ ...product, variants: [] }).success).toBe(false);
    expect(
      productInputSchema.safeParse({
        ...product,
        variants: [variant, { ...variant, sku: 'sam-rt38-sl' }],
      }).success,
    ).toBe(false);
    expect(productInputSchema.parse({ ...product, variants: [variant] }).isLargeItem).toBe(false);
  });
});

describe('specsSchemaFor', () => {
  const schema = specsSchemaFor([
    { key: 'capacity_liters', type: 'number', options: [], isRequired: true },
    { key: 'no_frost', type: 'boolean', options: [], isRequired: false },
    {
      key: 'energy_class',
      type: 'enum',
      options: [
        { value: 'a_plus', label: { ar: 'A+' } },
        { value: 'a', label: { ar: 'A' } },
      ],
      isRequired: false,
    },
  ]);

  it('validates types, enum values and required keys, and drops unknown keys', () => {
    expect(schema.parse({ capacity_liters: 380, no_frost: true, color: 'red' })).toEqual({
      capacity_liters: 380,
      no_frost: true,
    });
    expect(schema.safeParse({ capacity_liters: '380' }).success).toBe(false);
    expect(schema.safeParse({ capacity_liters: 380, energy_class: 'a_plus_plus' }).success).toBe(
      false,
    );
    expect(schema.safeParse({ no_frost: true }).success).toBe(false);
  });
});
