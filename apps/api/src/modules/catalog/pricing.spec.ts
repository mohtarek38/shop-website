import { currentPrice } from './pricing.js';

const base = { price: 10_000, salePrice: 8_000, saleStartsAt: null, saleEndsAt: null };
const now = new Date('2026-11-10T12:00:00Z');

describe('currentPrice', () => {
  it('uses the regular price without a sale', () => {
    expect(currentPrice({ ...base, salePrice: null }, now)).toBe(10_000);
  });

  it('uses an open-ended sale price', () => {
    expect(currentPrice(base, now)).toBe(8_000);
  });

  it('respects the sale window', () => {
    const window = {
      saleStartsAt: new Date('2026-11-01T00:00:00Z'),
      saleEndsAt: new Date('2026-11-15T00:00:00Z'),
    };
    expect(currentPrice({ ...base, ...window }, now)).toBe(8_000);
    expect(currentPrice({ ...base, ...window }, new Date('2026-10-31T23:59:59Z'))).toBe(10_000);
    // The end moment itself is outside the sale.
    expect(currentPrice({ ...base, ...window }, window.saleEndsAt)).toBe(10_000);
  });
});
