import { describe, expect, it } from 'vitest';
import { egpToPiasters, formatMoney } from './money';

describe('money', () => {
  it('converts EGP to integer piasters without float drift', () => {
    expect(egpToPiasters(24999)).toBe(2499900);
    expect(egpToPiasters(0.1 + 0.2)).toBe(30);
  });

  it('formats with Western digits in both locales', () => {
    expect(formatMoney(2499900, 'ar')).toBe('24,999 ج.م');
    expect(formatMoney(2499900, 'en')).toBe('EGP 24,999');
    expect(formatMoney(1050, 'en')).toBe('EGP 10.5');
  });
});
