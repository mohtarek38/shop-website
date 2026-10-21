import { describe, expect, it } from 'vitest';
import {
  stockAdjustmentInputSchema,
  stockLocationInputSchema,
  stockTransferInputSchema,
} from './inventory';

const ids = {
  variantId: '01a15fae-6fdf-75ea-806a-7a47847206a5',
  locationId: '01a15fae-6fdf-75ea-806a-7a47847206a6',
};

describe('stock adjustments', () => {
  it('needs a quantity to receive or write off, and a reason to adjust or write off', () => {
    expect(
      stockAdjustmentInputSchema.safeParse({ ...ids, type: 'receive', quantity: 5 }).success,
    ).toBe(true);
    expect(
      stockAdjustmentInputSchema.safeParse({ ...ids, type: 'receive', quantity: 0 }).success,
    ).toBe(false);
    expect(
      stockAdjustmentInputSchema.safeParse({ ...ids, type: 'adjust', quantity: 0 }).success,
    ).toBe(false);
    expect(
      stockAdjustmentInputSchema.safeParse({ ...ids, type: 'adjust', quantity: 0, reason: 'جرد' })
        .success,
    ).toBe(true);
    expect(
      stockAdjustmentInputSchema.safeParse({ ...ids, type: 'write_off', quantity: 1, reason: '  ' })
        .success,
    ).toBe(false);
  });

  it('refuses a transfer to the same location', () => {
    const result = stockTransferInputSchema.safeParse({
      variantId: ids.variantId,
      fromLocationId: ids.locationId,
      toLocationId: ids.locationId,
      quantity: 1,
    });
    expect(result.success).toBe(false);
  });
});

describe('stock locations', () => {
  it('uppercases codes and rejects invalid ones', () => {
    expect(
      stockLocationInputSchema.parse({ code: 'nasr-city', name: { ar: 'مدينة نصر' } }).code,
    ).toBe('NASR-CITY');
    expect(stockLocationInputSchema.safeParse({ code: 'a b', name: { ar: 'x' } }).success).toBe(
      false,
    );
  });
});
