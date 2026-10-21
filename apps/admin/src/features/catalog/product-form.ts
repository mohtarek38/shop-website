import {
  type CategoryAttribute,
  type OptionalLocalizedText,
  type Product,
  type ProductInput,
  productInputSchema,
  type SpecValue,
  splitAttributes,
} from '@shop/contracts';
import { inputToPiasters, piastersToInput } from '../../lib/money';

/**
 * The product editor's form values. Everything the user types is a string; conversion to
 * the API's types (piasters, numbers, booleans, ISO dates) happens in `formToInput`.
 */
export interface VariantFormValues {
  id?: string;
  sku: string;
  modelNumber: string;
  /** Variant-option attribute values, e.g. `{ color: 'silver' }`. */
  options: Record<string, string>;
  /** EGP, as typed. */
  price: string;
  salePrice: string;
  /** `<input type="datetime-local">` values, in the browser's time zone. */
  saleStartsAt: string;
  saleEndsAt: string;
  weightGrams: string;
  lengthMm: string;
  widthMm: string;
  heightMm: string;
  barcode: string;
  isActive: boolean;
}

export interface ProductFormValues {
  categoryId: string;
  brandId: string;
  slug: string;
  name: { ar: string; en: string };
  shortDescription: { ar: string; en: string };
  description: { ar: string; en: string };
  /** Product-level spec values as strings ('true'/'false' for yes/no). */
  specs: Record<string, string>;
  isLargeItem: boolean;
  warrantyMonths: string;
  seoTitle: { ar: string; en: string };
  seoDescription: { ar: string; en: string };
  /** In display order; the first is the main image. */
  images: ImageFormValues[];
  variants: VariantFormValues[];
}

export interface ImageFormValues {
  mediaId: string;
  /** For previews only; not sent back to the API. */
  urls: { thumb: string; md: string };
  alt: { ar: string; en: string };
}

export interface FormIssue {
  path: string;
  code: string;
  message: string;
}

const text = (value: OptionalLocalizedText | null | undefined) => ({
  ar: value?.ar ?? '',
  en: value?.en ?? '',
});

const intText = (value: number | null) => (value === null ? '' : String(value));

export function emptyVariant(): VariantFormValues {
  return {
    sku: '',
    modelNumber: '',
    options: {},
    price: '',
    salePrice: '',
    saleStartsAt: '',
    saleEndsAt: '',
    weightGrams: '',
    lengthMm: '',
    widthMm: '',
    heightMm: '',
    barcode: '',
    isActive: true,
  };
}

export function emptyProduct(categoryId = ''): ProductFormValues {
  return {
    categoryId,
    brandId: '',
    slug: '',
    name: { ar: '', en: '' },
    shortDescription: { ar: '', en: '' },
    description: { ar: '', en: '' },
    specs: {},
    isLargeItem: false,
    warrantyMonths: '',
    seoTitle: { ar: '', en: '' },
    seoDescription: { ar: '', en: '' },
    images: [],
    variants: [emptyVariant()],
  };
}

export function productToForm(product: Product): ProductFormValues {
  return {
    categoryId: product.category.id,
    brandId: product.brand.id,
    slug: product.slug,
    name: text(product.name),
    shortDescription: text(product.shortDescription),
    description: text(product.description),
    specs: specsToForm(product.specs),
    isLargeItem: product.isLargeItem,
    warrantyMonths: intText(product.warrantyMonths),
    seoTitle: text(product.seoTitle),
    seoDescription: text(product.seoDescription),
    images: product.images.map((image) => ({
      mediaId: image.id,
      urls: { thumb: image.urls.thumb, md: image.urls.md },
      alt: text(image.alt),
    })),
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      modelNumber: v.modelNumber ?? '',
      options: specsToForm(v.options),
      price: piastersToInput(v.price),
      salePrice: piastersToInput(v.salePrice),
      saleStartsAt: isoToLocalInput(v.saleStartsAt),
      saleEndsAt: isoToLocalInput(v.saleEndsAt),
      weightGrams: intText(v.weightGrams),
      lengthMm: intText(v.lengthMm),
      widthMm: intText(v.widthMm),
      heightMm: intText(v.heightMm),
      barcode: v.barcode ?? '',
      isActive: v.isActive,
    })),
  };
}

/**
 * Converts form values to the API input and validates them with the shared schema.
 * Returns field issues (paths match the form) instead of throwing.
 */
export function formToInput(
  values: ProductFormValues,
  attributes: CategoryAttribute[],
): { input: ProductInput | null; issues: FormIssue[] } {
  const issues: FormIssue[] = [];
  const { productAttributes, variantAttributes } = splitAttributes(attributes);

  const money = (raw: string, path: string, required: boolean) => {
    const value = inputToPiasters(raw);
    if (value === null && required) issues.push({ path, code: 'too_small', message: '' });
    if (value !== null && Number.isNaN(value)) {
      issues.push({ path, code: 'custom', message: 'invalid_price' });
      return null;
    }
    return value;
  };

  const raw: ProductInput = {
    categoryId: values.categoryId,
    brandId: values.brandId,
    slug: values.slug,
    name: values.name,
    shortDescription: optionalText(values.shortDescription),
    description: optionalText(values.description),
    specs: specsFromForm(values.specs, productAttributes, 'specs', issues),
    isLargeItem: values.isLargeItem,
    warrantyMonths: optionalInt(values.warrantyMonths),
    seoTitle: optionalText(values.seoTitle),
    seoDescription: optionalText(values.seoDescription),
    images: values.images.map((image) => ({
      mediaId: image.mediaId,
      alt: optionalText(image.alt),
    })),
    variants: values.variants.map((v, i) => ({
      id: v.id,
      sku: v.sku,
      modelNumber: v.modelNumber,
      options: specsFromForm(v.options, variantAttributes, `variants.${i}.options`, issues),
      price: money(v.price, `variants.${i}.price`, true) ?? 0,
      salePrice: money(v.salePrice, `variants.${i}.salePrice`, false),
      saleStartsAt: localInputToIso(v.saleStartsAt),
      saleEndsAt: localInputToIso(v.saleEndsAt),
      weightGrams: optionalInt(v.weightGrams),
      lengthMm: optionalInt(v.lengthMm),
      widthMm: optionalInt(v.widthMm),
      heightMm: optionalInt(v.heightMm),
      barcode: v.barcode,
      isActive: v.isActive,
    })),
  };

  const parsed = productInputSchema.safeParse(raw);
  if (!parsed.success) {
    const flagged = new Set(issues.map((issue) => issue.path));
    for (const issue of parsed.error.issues) {
      const path = issue.path.map(String).join('.');
      // A price we already flagged as unparseable also fails the schema; keep one message.
      if (flagged.has(path)) continue;
      // Comparing the sale price with a missing or invalid price would only add noise.
      const variantPath = path.replace(/\.salePrice$/, '');
      if (issue.message === 'sale_price_not_lower' && flagged.has(`${variantPath}.price`)) continue;
      issues.push({ path, code: issue.code, message: issue.message });
    }
  }
  return { input: issues.length ? null : raw, issues };
}

function specsToForm(specs: Record<string, SpecValue>): Record<string, string> {
  return Object.fromEntries(Object.entries(specs).map(([key, value]) => [key, String(value)]));
}

/** Typed spec values for the given attributes; blank values are omitted. */
function specsFromForm(
  values: Record<string, string>,
  attributes: CategoryAttribute[],
  prefix: string,
  issues: FormIssue[],
): Record<string, SpecValue> {
  const specs: Record<string, SpecValue> = {};
  for (const attr of attributes) {
    const value = (values[attr.key] ?? '').trim();
    const path = `${prefix}.${attr.key}`;
    if (value === '') {
      if (attr.isRequired) issues.push({ path, code: 'invalid_type', message: '' });
      continue;
    }
    if (attr.type === 'number') {
      const number = Number(value.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)));
      if (Number.isFinite(number)) specs[attr.key] = number;
      else issues.push({ path, code: 'invalid_type', message: '' });
    } else if (attr.type === 'boolean') {
      specs[attr.key] = value === 'true';
    } else {
      specs[attr.key] = value;
    }
  }
  return specs;
}

function optionalText(value: { ar: string; en: string }) {
  return value.ar.trim() || value.en.trim() ? value : null;
}

function optionalInt(value: string): number | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : Number(trimmed);
}

/** ISO → `YYYY-MM-DDTHH:mm` in the browser's time zone, for datetime-local inputs. */
export function isoToLocalInput(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function localInputToIso(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}
