import type {
  Brand,
  Category,
  CategoryAttribute,
  LocalizedText,
  MediaAsset,
  Product,
  ProductListItem,
  ProductVariant,
  Specs,
} from '@shop/contracts';
import type { MediaRecord } from '../media/index.js';
import type { BrandRow } from './brands.repository.js';
import type { CategoryRow } from './categories.repository.js';
import { currentPrice } from './pricing.js';
import type { ProductListRow, ProductRow, VariantRow } from './products.repository.js';

// JSONB columns are validated on write, so reading them back as their contract types is safe.
const text = (value: unknown) => value as LocalizedText;
const textOrNull = (value: unknown) => (value ?? null) as LocalizedText | null;

export function toAttribute(row: CategoryRow['attributes'][number]): CategoryAttribute {
  return {
    id: row.id,
    categoryId: row.categoryId,
    key: row.key,
    label: text(row.label),
    type: row.type,
    unit: textOrNull(row.unit),
    options: (row.options ?? []) as CategoryAttribute['options'],
    isRequired: row.isRequired,
    isFilterable: row.isFilterable,
    isComparable: row.isComparable,
    isVariantOption: row.isVariantOption,
    sortOrder: row.sortOrder,
  };
}

/** Parent attributes first, then the category's own (each group in its sort order). */
export function effectiveAttributes(
  category: CategoryRow,
  parent: CategoryRow | null,
): CategoryAttribute[] {
  return [...(parent?.attributes ?? []), ...category.attributes].map(toAttribute);
}

export function toCategory(row: CategoryRow, parent: CategoryRow | null): Category {
  return {
    id: row.id,
    parentId: row.parentId,
    slug: row.slug,
    name: text(row.name),
    description: textOrNull(row.description),
    seoTitle: textOrNull(row.seoTitle),
    seoDescription: textOrNull(row.seoDescription),
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    attributes: row.attributes.map(toAttribute),
    effectiveAttributes: effectiveAttributes(row, parent),
    productCount: row._count.products,
  };
}

export function toBrand(row: BrandRow): Brand {
  return {
    id: row.id,
    slug: row.slug,
    name: text(row.name),
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    productCount: row._count.products,
  };
}

export function toVariant(row: VariantRow, now = new Date()): ProductVariant {
  return {
    id: row.id,
    sku: row.sku,
    modelNumber: row.modelNumber,
    options: row.options as Specs,
    price: row.price,
    salePrice: row.salePrice,
    saleStartsAt: row.saleStartsAt?.toISOString() ?? null,
    saleEndsAt: row.saleEndsAt?.toISOString() ?? null,
    currentPrice: currentPrice(row, now),
    weightGrams: row.weightGrams,
    lengthMm: row.lengthMm,
    widthMm: row.widthMm,
    heightMm: row.heightMm,
    barcode: row.barcode,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
  };
}

/** Builds public image URLs (MediaService.toAsset). */
export type AssetFn = (media: MediaRecord) => MediaAsset;

export function toProduct(row: ProductRow, asset: AssetFn): Product {
  const now = new Date();
  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    name: text(row.name),
    shortDescription: textOrNull(row.shortDescription),
    description: textOrNull(row.description),
    specs: row.specs as Specs,
    isLargeItem: row.isLargeItem,
    warrantyMonths: row.warrantyMonths,
    seoTitle: textOrNull(row.seoTitle),
    seoDescription: textOrNull(row.seoDescription),
    category: { id: row.category.id, slug: row.category.slug, name: text(row.category.name) },
    brand: { id: row.brand.id, slug: row.brand.slug, name: text(row.brand.name) },
    images: row.images.map((image) => ({ ...asset(image.media), alt: textOrNull(image.alt) })),
    variants: row.variants.map((v) => toVariant(v, now)),
    publishedAt: row.publishedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toProductListItem(row: ProductListRow, asset: AssetFn): ProductListItem {
  const now = new Date();
  const prices = row.variants.filter((v) => v.isActive).map((v) => currentPrice(v, now));
  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    name: text(row.name),
    thumbnail: row.images[0] ? asset(row.images[0].media).urls.thumb : null,
    category: { id: row.category.id, name: text(row.category.name) },
    brand: { id: row.brand.id, name: text(row.brand.name) },
    variantCount: row.variants.length,
    priceFrom: prices.length ? Math.min(...prices) : null,
    updatedAt: row.updatedAt.toISOString(),
  };
}
