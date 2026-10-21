import {
  type AttributeType,
  type Category,
  type CategoryInput,
  categoryInputSchema,
  type OptionalLocalizedText,
} from '@shop/contracts';
import type { FormIssue } from './product-form';

export interface AttributeFormValues {
  key: string;
  label: { ar: string; en: string };
  type: AttributeType;
  unit: { ar: string; en: string };
  options: { value: string; label: { ar: string; en: string } }[];
  isRequired: boolean;
  isFilterable: boolean;
  isComparable: boolean;
  isVariantOption: boolean;
}

export interface CategoryFormValues {
  parentId: string;
  slug: string;
  name: { ar: string; en: string };
  description: { ar: string; en: string };
  isActive: boolean;
  sortOrder: string;
  attributes: AttributeFormValues[];
}

const text = (value: OptionalLocalizedText | null | undefined) => ({
  ar: value?.ar ?? '',
  en: value?.en ?? '',
});

export function emptyAttribute(): AttributeFormValues {
  return {
    key: '',
    label: { ar: '', en: '' },
    type: 'text',
    unit: { ar: '', en: '' },
    options: [],
    isRequired: false,
    isFilterable: false,
    isComparable: true,
    isVariantOption: false,
  };
}

export function emptyCategory(parentId = ''): CategoryFormValues {
  return {
    parentId,
    slug: '',
    name: { ar: '', en: '' },
    description: { ar: '', en: '' },
    isActive: true,
    sortOrder: '0',
    attributes: [],
  };
}

export function categoryToForm(category: Category): CategoryFormValues {
  return {
    parentId: category.parentId ?? '',
    slug: category.slug,
    name: text(category.name),
    description: text(category.description),
    isActive: category.isActive,
    sortOrder: String(category.sortOrder),
    attributes: category.attributes.map((a) => ({
      key: a.key,
      label: text(a.label),
      type: a.type,
      unit: text(a.unit),
      options: a.options.map((o) => ({ value: o.value, label: text(o.label) })),
      isRequired: a.isRequired,
      isFilterable: a.isFilterable,
      isComparable: a.isComparable,
      isVariantOption: a.isVariantOption,
    })),
  };
}

/** `Capacity (L)` → `capacity_l`: a suggested attribute key from its English name. */
export function attributeKeyFrom(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^[_0-9]+|_+$/g, '')
    .slice(0, 50);
}

export function formToCategoryInput(values: CategoryFormValues): {
  input: CategoryInput | null;
  issues: FormIssue[];
} {
  const input: CategoryInput = {
    parentId: values.parentId || null,
    slug: values.slug,
    name: values.name,
    description:
      values.description.ar.trim() || values.description.en.trim() ? values.description : null,
    isActive: values.isActive,
    sortOrder: Number(values.sortOrder || 0),
    attributes: values.attributes.map((a) => ({
      key: a.key.trim(),
      label: a.label,
      type: a.type,
      // Units only make sense for numbers; options only for lists.
      unit: a.type === 'number' && (a.unit.ar.trim() || a.unit.en.trim()) ? a.unit : null,
      options: a.type === 'enum' ? a.options : [],
      isRequired: a.isRequired,
      isFilterable: a.isFilterable,
      isComparable: a.isComparable,
      isVariantOption: a.isVariantOption,
    })),
  };

  const parsed = categoryInputSchema.safeParse(input);
  if (parsed.success) return { input, issues: [] };
  return {
    input: null,
    issues: parsed.error.issues.map((issue) => ({
      path: issue.path.map(String).join('.'),
      code: issue.code,
      message: issue.message,
    })),
  };
}
