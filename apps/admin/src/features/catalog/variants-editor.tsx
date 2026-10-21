import type { CategoryAttribute } from '@shop/contracts';
import { Button, Checkbox, FormRow, Input } from '@shop/ui';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import {
  type Control,
  type FieldErrors,
  get,
  type UseFormRegister,
  useFieldArray,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { emptyVariant, type ProductFormValues } from './product-form';
import { SpecField } from './spec-field';

type TextField =
  | 'sku'
  | 'modelNumber'
  | 'price'
  | 'salePrice'
  | 'saleStartsAt'
  | 'saleEndsAt'
  | 'weightGrams'
  | 'lengthMm'
  | 'widthMm'
  | 'heightMm'
  | 'barcode';

/** Variants of a product: SKU, options (e.g. colour) and prices. The order is the display order. */
export function VariantsEditor({
  control,
  register,
  errors,
  variantAttributes,
}: {
  control: Control<ProductFormValues>;
  register: UseFormRegister<ProductFormValues>;
  errors: FieldErrors<ProductFormValues>;
  variantAttributes: CategoryAttribute[];
}) {
  const { t } = useTranslation();
  // keyName: our variants have their own `id` (database id) that must not be overwritten.
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'variants',
    keyName: 'fieldKey',
  });

  const text = (
    index: number,
    name: TextField,
    label: string,
    props: {
      type?: string;
      dir?: 'ltr';
      inputMode?: 'decimal' | 'numeric';
      required?: boolean;
    } = {},
  ) => {
    const path = `variants.${index}.${name}` as const;
    const id = path.replace(/\./g, '-');
    const error = get(errors, path)?.message as string | undefined;
    const { required, ...inputProps } = props;
    return (
      <FormRow label={label} htmlFor={id} error={error} required={required}>
        <Input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-msg` : undefined}
          {...inputProps}
          {...register(path)}
        />
      </FormRow>
    );
  };

  const money = { dir: 'ltr' as const, inputMode: 'decimal' as const };
  const integer = { dir: 'ltr' as const, inputMode: 'numeric' as const };
  const egp = t('common.egp');

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <fieldset key={field.fieldKey} className="space-y-3 rounded-card border border-border p-3">
          <div className="flex items-center gap-2">
            <legend className="font-medium">{t('productEditor.variant', { n: index + 1 })}</legend>
            <div className="ms-auto flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                aria-label={t('common.moveUp')}
                disabled={index === 0}
                onClick={() => move(index, index - 1)}
              >
                <ArrowUp className="size-4" aria-hidden />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                aria-label={t('common.moveDown')}
                disabled={index === fields.length - 1}
                onClick={() => move(index, index + 1)}
              >
                <ArrowDown className="size-4" aria-hidden />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                aria-label={t('common.remove')}
                disabled={fields.length === 1}
                onClick={() => remove(index)}
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {text(index, 'sku', t('productEditor.sku'), { dir: 'ltr', required: true })}
            {text(index, 'modelNumber', t('productEditor.modelNumber'), { dir: 'ltr' })}
            {variantAttributes.map((attribute) => (
              <SpecField
                key={attribute.key}
                attribute={attribute}
                name={`variants.${index}.options.${attribute.key}`}
                register={register}
                errors={errors}
              />
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {text(index, 'price', `${t('productEditor.price')} (${egp})`, {
              ...money,
              required: true,
            })}
            {text(index, 'salePrice', `${t('productEditor.salePrice')} (${egp})`, money)}
            {text(index, 'saleStartsAt', t('productEditor.saleStartsAt'), {
              type: 'datetime-local',
            })}
            {text(index, 'saleEndsAt', t('productEditor.saleEndsAt'), { type: 'datetime-local' })}
          </div>

          <Checkbox
            id={`variants-${index}-isActive`}
            label={t('productEditor.variantActive')}
            {...register(`variants.${index}.isActive`)}
          />

          <details className="rounded-control bg-surface px-3 py-2">
            <summary className="cursor-pointer text-sm text-muted">
              {t('productEditor.moreDetails')}
            </summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {text(index, 'weightGrams', t('productEditor.weightGrams'), integer)}
              {text(index, 'lengthMm', t('productEditor.lengthMm'), integer)}
              {text(index, 'widthMm', t('productEditor.widthMm'), integer)}
              {text(index, 'heightMm', t('productEditor.heightMm'), integer)}
              {text(index, 'barcode', t('productEditor.barcode'), { dir: 'ltr' })}
            </div>
          </details>
        </fieldset>
      ))}

      <Button onClick={() => append(emptyVariant())}>
        <Plus className="size-4" aria-hidden />
        {t('productEditor.addVariant')}
      </Button>
    </div>
  );
}
