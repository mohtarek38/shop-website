import { type LocalizedText, normalizeArabic } from '@shop/contracts';

/**
 * Builds `product.search_text` (ADR-0017): normalized Arabic and English names, brand,
 * SKUs and model numbers. Model numbers are also stored without separators so
 * "RT38-K5032" matches a search for "rt38k5032".
 */
export function buildSearchText(input: {
  name: LocalizedText;
  brandName: LocalizedText;
  categoryName: LocalizedText;
  variants: { sku: string; modelNumber: string | null }[];
}): string {
  const codes = input.variants.flatMap((v) => [v.sku, v.modelNumber ?? '']);
  const parts = [
    input.name.ar,
    input.name.en ?? '',
    input.brandName.ar,
    input.brandName.en ?? '',
    input.categoryName.ar,
    input.categoryName.en ?? '',
    ...codes,
    ...codes.map((code) => code.replace(/[\s._-]/g, '')),
  ];

  const words = normalizeArabic(parts.join(' ')).split(' ').filter(Boolean);
  return [...new Set(words)].join(' ');
}
