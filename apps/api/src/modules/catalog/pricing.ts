/**
 * The price a customer pays right now: the sale price inside its window, else the regular
 * price. Moves to the pricing module when checkout arrives (ADR-0011).
 */
export function currentPrice(
  variant: {
    price: number;
    salePrice: number | null;
    saleStartsAt: Date | null;
    saleEndsAt: Date | null;
  },
  now: Date = new Date(),
): number {
  if (variant.salePrice === null) return variant.price;
  if (variant.saleStartsAt && now < variant.saleStartsAt) return variant.price;
  if (variant.saleEndsAt && now >= variant.saleEndsAt) return variant.price;
  return variant.salePrice;
}
