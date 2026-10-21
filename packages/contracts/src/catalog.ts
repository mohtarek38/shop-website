import { z } from 'zod';
import { paginationQuerySchema } from './http';
import {
  type LocalizedText,
  localizedTextSchema,
  optionalLocalizedTextSchema,
} from './localized-text';
import type { MediaAsset } from './media';
import { piastersSchema } from './money';

/** English, lowercase, hyphenated: `samsung-rt38-no-frost-fridge` (ADR-0010). */
export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'invalid_slug');

// ─── Category attributes: per-category spec templates ──────────────────────

export const ATTRIBUTE_TYPES = ['text', 'number', 'boolean', 'enum'] as const;
export type AttributeType = (typeof ATTRIBUTE_TYPES)[number];

export const attributeKeySchema = z
  .string()
  .trim()
  .max(50)
  .regex(/^[a-z][a-z0-9_]*$/, 'invalid_attribute_key');

export const attributeOptionSchema = z.object({
  value: z
    .string()
    .trim()
    .max(50)
    .regex(/^[a-z0-9_+-]+$/, 'invalid_option_value'),
  label: localizedTextSchema,
});

export const categoryAttributeInputSchema = z
  .object({
    key: attributeKeySchema,
    label: localizedTextSchema,
    type: z.enum(ATTRIBUTE_TYPES),
    unit: optionalLocalizedTextSchema.nullable().default(null),
    options: z.array(attributeOptionSchema).default([]),
    isRequired: z.boolean().default(false),
    /** Shown as a filter on the category page. */
    isFilterable: z.boolean().default(false),
    /** Shown in the product comparison table. */
    isComparable: z.boolean().default(true),
    /** Differs per variant (colour, capacity) instead of per product. */
    isVariantOption: z.boolean().default(false),
  })
  .superRefine((attr, ctx) => {
    if (attr.type === 'enum' && attr.options.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['options'], message: 'enum_requires_options' });
    }
    if (attr.type !== 'enum' && attr.options.length > 0) {
      ctx.addIssue({ code: 'custom', path: ['options'], message: 'options_only_for_enum' });
    }
    const values = attr.options.map((o) => o.value);
    if (new Set(values).size !== values.length) {
      ctx.addIssue({ code: 'custom', path: ['options'], message: 'duplicate_option_values' });
    }
  });
export type CategoryAttributeInput = z.input<typeof categoryAttributeInputSchema>;
export type CategoryAttribute = z.output<typeof categoryAttributeInputSchema> & {
  id: string;
  /** Position in the category's attribute list (the list order is the display order). */
  sortOrder: number;
  /** The category that defines it (a parent, for inherited attributes). */
  categoryId: string;
};

// ─── Categories ────────────────────────────────────────────────────────────

export const categoryInputSchema = z.object({
  parentId: z.uuid().nullable().default(null),
  slug: slugSchema,
  name: localizedTextSchema,
  description: optionalLocalizedTextSchema.nullable().default(null),
  seoTitle: optionalLocalizedTextSchema.nullable().default(null),
  seoDescription: optionalLocalizedTextSchema.nullable().default(null),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  /** The category's OWN attributes, in display order; children also inherit their parent's. */
  attributes: z
    .array(categoryAttributeInputSchema)
    .default([])
    .refine((list) => new Set(list.map((a) => a.key)).size === list.length, {
      message: 'duplicate_attribute_keys',
    }),
});
export type CategoryInput = z.input<typeof categoryInputSchema>;

export interface Category {
  id: string;
  parentId: string | null;
  slug: string;
  name: LocalizedText;
  description: LocalizedText | null;
  seoTitle: LocalizedText | null;
  seoDescription: LocalizedText | null;
  isActive: boolean;
  sortOrder: number;
  /** Own attributes only. */
  attributes: CategoryAttribute[];
  /** Parent's attributes + own, in display order. */
  effectiveAttributes: CategoryAttribute[];
  productCount: number;
}

// ─── Brands ────────────────────────────────────────────────────────────────

export const brandInputSchema = z.object({
  slug: slugSchema,
  name: localizedTextSchema,
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});
export type BrandInput = z.input<typeof brandInputSchema>;

export interface Brand {
  id: string;
  slug: string;
  name: LocalizedText;
  isActive: boolean;
  sortOrder: number;
  productCount: number;
}

// ─── Products & variants ───────────────────────────────────────────────────

export const PRODUCT_STATUSES = ['draft', 'active', 'archived'] as const;
export const productStatusSchema = z.enum(PRODUCT_STATUSES);
export type ProductStatus = z.infer<typeof productStatusSchema>;

/** A spec value: what a text, number, boolean or enum attribute can hold. */
export const specValueSchema = z.union([z.string(), z.number(), z.boolean()]);
export type SpecValue = z.infer<typeof specValueSchema>;
export const specsSchema = z.record(z.string(), specValueSchema);
export type Specs = z.infer<typeof specsSchema>;

const optionalPositiveInt = z.number().int().positive().nullable().default(null);
const optionalTrimmed = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .default(null)
    .transform((value) => value || null);

export const variantInputSchema = z
  .object({
    /** Present when updating an existing variant. */
    id: z.uuid().optional(),
    sku: z
      .string()
      .trim()
      .min(1)
      .max(64)
      .regex(/^[A-Za-z0-9._-]+$/, 'invalid_sku'),
    modelNumber: optionalTrimmed(64),
    /** Values for the category's variant-option attributes, e.g. `{ color: 'silver' }`. */
    options: specsSchema.default({}),
    /** Regular price in piasters, VAT-inclusive (ADR-0011). */
    price: piastersSchema.positive(),
    salePrice: piastersSchema.positive().nullable().default(null),
    saleStartsAt: z.iso.datetime({ offset: true }).nullable().default(null),
    saleEndsAt: z.iso.datetime({ offset: true }).nullable().default(null),
    weightGrams: optionalPositiveInt,
    lengthMm: optionalPositiveInt,
    widthMm: optionalPositiveInt,
    heightMm: optionalPositiveInt,
    barcode: optionalTrimmed(64),
    isActive: z.boolean().default(true),
  })
  .superRefine((v, ctx) => {
    if (v.salePrice !== null && v.salePrice >= v.price) {
      ctx.addIssue({ code: 'custom', path: ['salePrice'], message: 'sale_price_not_lower' });
    }
    if (v.saleStartsAt && v.saleEndsAt && v.saleEndsAt <= v.saleStartsAt) {
      ctx.addIssue({ code: 'custom', path: ['saleEndsAt'], message: 'sale_ends_before_start' });
    }
  });
export type VariantInput = z.input<typeof variantInputSchema>;

/** A product image: an uploaded media id plus optional alt text. The first is the main image. */
export const productImageInputSchema = z.object({
  mediaId: z.uuid(),
  alt: optionalLocalizedTextSchema.nullable().default(null),
});

export const productInputSchema = z.object({
  categoryId: z.uuid(),
  brandId: z.uuid(),
  slug: slugSchema,
  name: localizedTextSchema,
  shortDescription: optionalLocalizedTextSchema.nullable().default(null),
  /** Markdown. */
  description: optionalLocalizedTextSchema.nullable().default(null),
  /** Product-level spec values, validated against the category's attributes. */
  specs: specsSchema.default({}),
  /** Bulky item (fridge, washer): adds the delivery zone's large-item fee. */
  isLargeItem: z.boolean().default(false),
  warrantyMonths: z.number().int().min(0).max(240).nullable().default(null),
  seoTitle: optionalLocalizedTextSchema.nullable().default(null),
  seoDescription: optionalLocalizedTextSchema.nullable().default(null),
  /** In display order; the first is the main image. */
  images: z
    .array(productImageInputSchema)
    .max(20)
    .default([])
    .refine((list) => new Set(list.map((i) => i.mediaId)).size === list.length, {
      message: 'duplicate_images',
    }),
  /** In display order; the first active variant is the default one. */
  variants: z
    .array(variantInputSchema)
    .min(1)
    .max(50)
    .refine((list) => new Set(list.map((v) => v.sku.toUpperCase())).size === list.length, {
      message: 'duplicate_skus',
    }),
});
export type ProductInput = z.input<typeof productInputSchema>;

export const productStatusInputSchema = z.object({ status: productStatusSchema });

export const productListQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().max(100).optional(),
  categoryId: z.uuid().optional(),
  brandId: z.uuid().optional(),
  status: productStatusSchema.optional(),
});
/** Query-string input (the schema coerces strings, so its input type is too loose to reuse). */
export type ProductListQuery = {
  page?: number;
  pageSize?: number;
  q?: string;
  categoryId?: string;
  brandId?: string;
  status?: ProductStatus;
};

export interface ProductVariant {
  id: string;
  sku: string;
  modelNumber: string | null;
  options: Specs;
  price: number;
  salePrice: number | null;
  saleStartsAt: string | null;
  saleEndsAt: string | null;
  /** What the customer pays right now (sale price inside its window, else price). */
  currentPrice: number;
  /** Units available to sell across active stock locations (on hand − reserved). */
  available: number;
  weightGrams: number | null;
  lengthMm: number | null;
  widthMm: number | null;
  heightMm: number | null;
  barcode: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface Product {
  id: string;
  slug: string;
  status: ProductStatus;
  name: LocalizedText;
  shortDescription: LocalizedText | null;
  description: LocalizedText | null;
  specs: Specs;
  isLargeItem: boolean;
  warrantyMonths: number | null;
  seoTitle: LocalizedText | null;
  seoDescription: LocalizedText | null;
  category: { id: string; slug: string; name: LocalizedText };
  brand: { id: string; slug: string; name: LocalizedText };
  images: ProductImage[];
  variants: ProductVariant[];
  publishedAt: string | null;
  updatedAt: string;
}

export type ProductImage = MediaAsset & { alt: LocalizedText | null };

export interface ProductListItem {
  id: string;
  slug: string;
  status: ProductStatus;
  name: LocalizedText;
  /** Main image thumbnail URL. */
  thumbnail: string | null;
  category: { id: string; name: LocalizedText };
  brand: { id: string; name: LocalizedText };
  variantCount: number;
  /** Lowest current price across active variants, or null if none are active. */
  priceFrom: number | null;
  /** Units available across active variants and locations. */
  available: number;
  updatedAt: string;
}

// ─── Spec validation against a category template ───────────────────────────

/**
 * Builds a Zod schema for spec values from a category's attributes. Unknown keys are
 * dropped; required attributes must be present. Used by the API and the dashboard form.
 */
export function specsSchemaFor(
  attributes: Pick<CategoryAttribute, 'key' | 'type' | 'options' | 'isRequired'>[],
): z.ZodType<Specs> {
  const shape: Record<string, z.ZodType> = {};
  for (const attr of attributes) {
    const base =
      attr.type === 'number'
        ? z.number().finite()
        : attr.type === 'boolean'
          ? z.boolean()
          : attr.type === 'enum'
            ? z.enum(attr.options.map((o) => o.value) as [string, ...string[]])
            : z.string().trim().min(1).max(200);
    shape[attr.key] = attr.isRequired ? base : base.optional();
  }
  // Built dynamically, so TypeScript can't infer the shape; every value is a SpecValue.
  return z.object(shape) as unknown as z.ZodType<Specs>;
}

/** Splits a category's effective attributes into product-level and variant-option ones. */
export function splitAttributes<T extends Pick<CategoryAttribute, 'isVariantOption'>>(
  attributes: T[],
): { productAttributes: T[]; variantAttributes: T[] } {
  return {
    productAttributes: attributes.filter((a) => !a.isVariantOption),
    variantAttributes: attributes.filter((a) => a.isVariantOption),
  };
}
