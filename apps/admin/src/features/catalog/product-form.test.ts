import type { CategoryAttribute, Product } from '@shop/contracts';
import { describe, expect, it } from 'vitest';
import { issueCode } from '../../lib/form-errors';
import {
  emptyProduct,
  formToInput,
  isoToLocalInput,
  localInputToIso,
  productToForm,
} from './product-form';

const id = '01a15fae-6fdf-75ea-806a-7a47847206a5';
const attr = (overrides: Partial<CategoryAttribute>): CategoryAttribute => ({
  id: overrides.key ?? 'x',
  categoryId: id,
  key: 'x',
  label: { ar: 'x' },
  type: 'text',
  unit: null,
  options: [],
  isRequired: false,
  isFilterable: false,
  isComparable: true,
  isVariantOption: false,
  sortOrder: 0,
  ...overrides,
});

const attributes = [
  attr({ key: 'capacity_liters', type: 'number', isRequired: true }),
  attr({ key: 'no_frost', type: 'boolean' }),
  attr({
    key: 'color',
    type: 'enum',
    isVariantOption: true,
    options: [{ value: 'silver', label: { ar: 'فضي' } }],
  }),
];

const filled = () => {
  const values = emptyProduct(id);
  values.brandId = id;
  values.slug = 'samsung-rt38';
  values.name = { ar: 'ثلاجة', en: '' };
  values.specs = { capacity_liters: '٣٨٠', no_frost: 'false' };
  values.variants[0] = {
    ...values.variants[0]!,
    sku: 'sam-1',
    options: { color: 'silver' },
    price: '24,999',
    salePrice: '22999.5',
  };
  return values;
};

describe('formToInput', () => {
  it('converts typed text to API values', () => {
    const { input, issues } = formToInput(filled(), attributes);
    expect(issues).toEqual([]);
    expect(input).toMatchObject({
      name: { ar: 'ثلاجة', en: '' },
      shortDescription: null,
      specs: { capacity_liters: 380, no_frost: false },
      warrantyMonths: null,
      variants: [
        { sku: 'sam-1', options: { color: 'silver' }, price: 2_499_900, salePrice: 2_299_950 },
      ],
    });
  });

  it('reports missing required specs, bad prices and schema errors at form paths', () => {
    const values = filled();
    values.specs = {};
    values.slug = 'Not A Slug';
    values.variants[0]!.price = '12.345';
    // Kept: must not add a "sale price not lower" error on top of the price error.
    values.variants[0]!.salePrice = '22999';

    const { input, issues } = formToInput(values, attributes);
    expect(input).toBeNull();
    expect(issues.map((i) => [i.path, issueCode(i)])).toEqual([
      ['specs.capacity_liters', 'invalid_type'],
      ['variants.0.price', 'invalid_price'],
      ['slug', 'invalid_slug'],
    ]);
  });
});

describe('productToForm', () => {
  it('turns API values back into editable text', () => {
    const product = {
      category: { id, slug: 'c', name: { ar: 'c' } },
      brand: { id, slug: 'b', name: { ar: 'b' } },
      slug: 's',
      name: { ar: 'ثلاجة' },
      shortDescription: null,
      description: null,
      specs: { capacity_liters: 380, no_frost: true },
      isLargeItem: true,
      warrantyMonths: 24,
      seoTitle: null,
      seoDescription: null,
      images: [
        {
          id: 'm1',
          width: 800,
          height: 800,
          urls: { thumb: '/t.webp', md: '/m.webp', lg: '/l.webp', original: '/o.png' },
          alt: null,
        },
      ],
      variants: [
        {
          id,
          sku: 'SAM-1',
          modelNumber: null,
          options: { color: 'silver' },
          price: 2_499_900,
          salePrice: null,
          saleStartsAt: null,
          saleEndsAt: null,
          weightGrams: 60_000,
          lengthMm: null,
          widthMm: null,
          heightMm: null,
          barcode: null,
          isActive: true,
        },
      ],
    } as unknown as Product;

    const form = productToForm(product);
    expect(form.specs).toEqual({ capacity_liters: '380', no_frost: 'true' });
    expect(form.name).toEqual({ ar: 'ثلاجة', en: '' });
    expect(form.warrantyMonths).toBe('24');
    expect(form.images).toEqual([
      { mediaId: 'm1', urls: { thumb: '/t.webp', md: '/m.webp' }, alt: { ar: '', en: '' } },
    ]);
    expect(form.variants[0]).toMatchObject({
      id,
      price: '24999',
      salePrice: '',
      weightGrams: '60000',
    });
  });
});

describe('datetime-local conversion', () => {
  it('round-trips through ISO', () => {
    const local = '2026-11-10T09:30';
    expect(isoToLocalInput(localInputToIso(local))).toBe(local);
    expect(localInputToIso('')).toBeNull();
  });
});
