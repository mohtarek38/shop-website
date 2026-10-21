import { describe, expect, it } from 'vitest';
import { egyptianMobileSchema, formatEgyptianMobile, normalizeEgyptianMobile } from './phone';

describe('normalizeEgyptianMobile', () => {
  it.each([
    ['01012345678', '+201012345678'],
    ['0112 345 6789', '+201123456789'],
    ['+201234567890', '+201234567890'],
    ['00201512345678', '+201512345678'],
    ['201012345678', '+201012345678'],
    ['٠١٠١٢٣٤٥٦٧٨', '+201012345678'],
    ['010-1234-5678', '+201012345678'],
  ])('normalizes %s', (input, expected) => {
    expect(normalizeEgyptianMobile(input)).toBe(expected);
  });

  it.each(['0101234567', '01312345678', '0221234567', '+441012345678', 'abc', ''])(
    'rejects %s',
    (input) => {
      expect(normalizeEgyptianMobile(input)).toBeNull();
    },
  );
});

describe('formatEgyptianMobile', () => {
  it('formats E.164 for display', () => {
    expect(formatEgyptianMobile('+201012345678')).toBe('0101 234 5678');
  });
});

describe('egyptianMobileSchema', () => {
  it('transforms valid input and reports invalid input', () => {
    expect(egyptianMobileSchema.parse('01012345678')).toBe('+201012345678');
    expect(egyptianMobileSchema.safeParse('123').success).toBe(false);
  });
});
