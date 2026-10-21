import { ATTRIBUTE_TYPES } from '@shop/contracts';
import { Alert, Button, Checkbox, FormRow, Input, Select } from '@shop/ui';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import {
  type Control,
  type FieldErrors,
  get,
  type UseFormRegister,
  type UseFormSetValue,
  type UseFormWatch,
  useFieldArray,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LocalizedInput } from '../../components/localized-input';
import { attributeKeyFrom, type CategoryFormValues, emptyAttribute } from './category-form';

interface Props {
  control: Control<CategoryFormValues>;
  register: UseFormRegister<CategoryFormValues>;
  errors: FieldErrors<CategoryFormValues>;
  watch: UseFormWatch<CategoryFormValues>;
  setValue: UseFormSetValue<CategoryFormValues>;
}

/** The category's spec template: one card per attribute. The order is the display order. */
export function AttributesEditor({ control, register, errors, watch, setValue }: Props) {
  const { t } = useTranslation();
  const { fields, append, remove, move } = useFieldArray({ control, name: 'attributes' });
  const error = (path: string) => get(errors, path)?.message as string | undefined;

  return (
    <div className="space-y-4">
      {error('attributes.root') && <Alert tone="danger">{error('attributes.root')}</Alert>}

      {fields.map((field, index) => {
        const base = `attributes.${index}` as const;
        const type = watch(`${base}.type`);
        const id = (name: string) => `${base}.${name}`.replace(/\./g, '-');
        return (
          <fieldset key={field.id} className="space-y-3 rounded-card border border-border p-3">
            <div className="flex items-center gap-2">
              <legend className="font-medium">
                {watch(`${base}.label.ar`) || t('categoryEditor.addAttribute')}
              </legend>
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
                  onClick={() => remove(index)}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
            </div>

            <LocalizedInput
              name={`${base}.label`}
              label={t('categoryEditor.attributeLabel')}
              register={register}
              errors={errors}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <FormRow
                label={t('categoryEditor.attributeKey')}
                htmlFor={id('key')}
                required
                hint={t('categoryEditor.attributeKeyHint')}
                error={error(`${base}.key`)}
              >
                <Input
                  id={id('key')}
                  dir="ltr"
                  aria-invalid={error(`${base}.key`) ? true : undefined}
                  {...register(`${base}.key`)}
                  onFocus={() => {
                    // Suggest a key from the English name the first time.
                    if (!watch(`${base}.key`))
                      setValue(`${base}.key`, attributeKeyFrom(watch(`${base}.label.en`)));
                  }}
                />
              </FormRow>
              <FormRow label={t('categoryEditor.type')} htmlFor={id('type')}>
                <Select id={id('type')} {...register(`${base}.type`)}>
                  {ATTRIBUTE_TYPES.map((value) => (
                    <option key={value} value={value}>
                      {t(`attributeTypes.${value}`)}
                    </option>
                  ))}
                </Select>
              </FormRow>
            </div>

            {type === 'number' && (
              <LocalizedInput
                name={`${base}.unit`}
                label={t('categoryEditor.unit')}
                register={register}
                errors={errors}
                optional
              />
            )}
            {type === 'enum' && (
              <OptionsEditor index={index} control={control} register={register} errors={errors} />
            )}

            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Checkbox
                id={id('isRequired')}
                label={t('categoryEditor.required')}
                {...register(`${base}.isRequired`)}
              />
              <Checkbox
                id={id('isFilterable')}
                label={t('categoryEditor.filterable')}
                {...register(`${base}.isFilterable`)}
              />
              <Checkbox
                id={id('isComparable')}
                label={t('categoryEditor.comparable')}
                {...register(`${base}.isComparable`)}
              />
              <Checkbox
                id={id('isVariantOption')}
                label={t('categoryEditor.variantOption')}
                {...register(`${base}.isVariantOption`)}
              />
            </div>
          </fieldset>
        );
      })}

      <Button onClick={() => append(emptyAttribute())}>
        <Plus className="size-4" aria-hidden />
        {t('categoryEditor.addAttribute')}
      </Button>
    </div>
  );
}

/** The choices of a list ("enum") attribute. */
function OptionsEditor({
  index,
  control,
  register,
  errors,
}: Omit<Props, 'watch' | 'setValue'> & { index: number }) {
  const { t } = useTranslation();
  const name = `attributes.${index}.options` as const;
  const { fields, append, remove } = useFieldArray({ control, name });
  const listError = get(errors, name)?.message as string | undefined;

  return (
    <div className="space-y-2 rounded-control bg-surface p-3">
      <p className="text-sm font-medium">{t('categoryEditor.options')}</p>
      {listError && <p className="text-xs text-danger">{listError}</p>}
      {fields.map((field, optionIndex) => {
        const base = `${name}.${optionIndex}` as const;
        const valueError = get(errors, `${base}.value`)?.message as string | undefined;
        const id = `${base}.value`.replace(/\./g, '-');
        return (
          <div key={field.id} className="grid items-end gap-2 sm:grid-cols-[10rem_1fr_auto]">
            <FormRow
              label={t('categoryEditor.optionValue')}
              htmlFor={id}
              required
              error={valueError}
            >
              <Input
                id={id}
                dir="ltr"
                aria-invalid={valueError ? true : undefined}
                {...register(`${base}.value`)}
              />
            </FormRow>
            <LocalizedInput
              name={`${base}.label`}
              label={t('categoryEditor.attributeLabel')}
              register={register}
              errors={errors}
            />
            <Button
              size="sm"
              variant="ghost"
              aria-label={t('common.remove')}
              onClick={() => remove(optionIndex)}
              className="mb-1"
            >
              <Trash2 className="size-4" aria-hidden />
            </Button>
          </div>
        );
      })}
      <Button size="sm" onClick={() => append({ value: '', label: { ar: '', en: '' } })}>
        <Plus className="size-4" aria-hidden />
        {t('categoryEditor.addOption')}
      </Button>
    </div>
  );
}
