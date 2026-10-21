import { describe, expect, it } from 'vitest';
import { issueCode } from '../../lib/form-errors';
import {
  attributeKeyFrom,
  emptyAttribute,
  emptyCategory,
  formToCategoryInput,
} from './category-form';

describe('attributeKeyFrom', () => {
  it('suggests snake_case keys from English names', () => {
    expect(attributeKeyFrom('Capacity (L)')).toBe('capacity_l');
    expect(attributeKeyFrom('No Frost')).toBe('no_frost');
    expect(attributeKeyFrom('3D Sound')).toBe('d_sound');
    expect(attributeKeyFrom('السعة')).toBe('');
  });
});

describe('formToCategoryInput', () => {
  const values = () => ({
    ...emptyCategory(),
    slug: 'refrigerators',
    name: { ar: 'ثلاجات', en: 'Refrigerators' },
  });

  it('drops units and options that do not apply to the attribute type', () => {
    const form = values();
    form.attributes = [
      {
        ...emptyAttribute(),
        key: 'no_frost',
        label: { ar: 'نوفروست', en: '' },
        type: 'boolean',
        unit: { ar: 'لتر', en: '' },
        options: [{ value: 'x', label: { ar: 'x', en: '' } }],
      },
    ];
    const { input, issues } = formToCategoryInput(form);
    expect(issues).toEqual([]);
    expect(input).toMatchObject({
      parentId: null,
      description: null,
      sortOrder: 0,
      attributes: [{ key: 'no_frost', unit: null, options: [] }],
    });
  });

  it('reports a list attribute without options at its path', () => {
    const form = values();
    form.attributes = [
      { ...emptyAttribute(), key: 'energy_class', label: { ar: 'الطاقة', en: '' }, type: 'enum' },
    ];
    const { input, issues } = formToCategoryInput(form);
    expect(input).toBeNull();
    expect(issues.map((i) => [i.path, issueCode(i)])).toEqual([
      ['attributes.0.options', 'enum_requires_options'],
    ]);
  });
});
