import { ApiError } from '@shop/api-client';
import type { TFunction } from 'i18next';
import { describe, expect, it } from 'vitest';
import { apiFieldErrors, fieldErrors, issueCode } from './form-errors';
import { inputToPiasters, piastersToInput } from './money';
import { slugify } from './slugify';

describe('money inputs', () => {
  it('converts between EGP text and piasters', () => {
    expect(piastersToInput(2_499_900)).toBe('24999');
    expect(piastersToInput(1050)).toBe('10.5');
    expect(piastersToInput(null)).toBe('');
    expect(inputToPiasters('24,999')).toBe(2_499_900);
    expect(inputToPiasters('٢٤٩٩٩٫٥')).toBe(2_499_950);
    expect(inputToPiasters('  ')).toBeNull();
    expect(inputToPiasters('12.345')).toBeNaN();
    expect(inputToPiasters('abc')).toBeNaN();
  });
});

describe('slugify', () => {
  it('makes English slugs and leaves Arabic-only names empty', () => {
    expect(slugify('Samsung 55" 4K Smart TV')).toBe('samsung-55-4k-smart-tv');
    expect(slugify('  Café -- Crème  ')).toBe('cafe-creme');
    expect(slugify('ثلاجة سامسونج')).toBe('');
  });
});

describe('form errors', () => {
  const t = ((key: string, options?: { defaultValue?: string }) =>
    ({
      'errors.not_found': 'Not found',
      'errors.too_small': 'Too short',
      'errors.invalid': 'Invalid',
    })[key] ??
    options?.defaultValue ??
    key) as unknown as TFunction;

  it('maps custom codes from message and built-in codes from code', () => {
    expect(
      fieldErrors(
        [
          { path: 'categoryId', code: 'custom', message: 'not_found' },
          { path: ['variants', 0, 'sku'], code: 'too_small', message: 'Too small: …' },
          { path: 'x', code: 'something_new', message: '' },
        ],
        t,
      ),
    ).toEqual([
      { path: 'categoryId', message: 'Not found' },
      { path: 'variants.0.sku', message: 'Too short' },
      { path: 'x', message: 'Invalid' },
    ]);
  });

  it('reads field errors from API problem details only', () => {
    const problem = {
      type: 'x',
      title: 'Bad Request',
      status: 400,
      errors: [{ path: 'slug', code: 'custom', message: 'not_found' }],
    };
    expect(apiFieldErrors(new ApiError(400, problem), t)).toEqual([
      { path: 'slug', message: 'Not found' },
    ]);
    expect(apiFieldErrors(new Error('boom'), t)).toBeNull();
  });
});

describe('issueCode', () => {
  it('prefers our code in the message over the generic Zod code', () => {
    expect(issueCode({ code: 'invalid_format', message: 'invalid_slug' })).toBe('invalid_slug');
    expect(
      issueCode({
        code: 'too_small',
        message: 'Too small: expected string to have >=1 characters',
      }),
    ).toBe('too_small');
  });
});
