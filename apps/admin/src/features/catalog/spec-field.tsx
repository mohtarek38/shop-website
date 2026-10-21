import type { CategoryAttribute } from '@shop/contracts';
import { FormRow, Input, Select } from '@shop/ui';
import {
  type FieldErrors,
  type FieldValues,
  get,
  type Path,
  type UseFormRegister,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useLocalize } from '../../lib/use-localize';

/**
 * One input for a category attribute, by type: number/text input, yes/no/blank select,
 * or a list of options. Values are strings in the form (see product-form.ts).
 */
export function SpecField<T extends FieldValues>({
  attribute,
  name,
  register,
  errors,
}: {
  attribute: CategoryAttribute;
  /** Form path, e.g. `specs.capacity_liters` or `variants.0.options.color`. */
  name: string;
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
}) {
  const { t } = useTranslation();
  const localize = useLocalize();
  const id = name.replace(/\./g, '-');
  const error = get(errors, name)?.message as string | undefined;
  const unit = localize(attribute.unit);
  const label = unit ? `${localize(attribute.label)} (${unit})` : localize(attribute.label);
  const field = register(name as Path<T>);
  const common = {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-msg` : undefined,
  } as const;

  return (
    <FormRow label={label} htmlFor={id} error={error} required={attribute.isRequired}>
      {attribute.type === 'boolean' ? (
        <Select {...common} {...field}>
          <option value="">{t('common.none')}</option>
          <option value="true">{t('common.yes')}</option>
          <option value="false">{t('common.no')}</option>
        </Select>
      ) : attribute.type === 'enum' ? (
        <Select {...common} {...field}>
          <option value="">{t('common.none')}</option>
          {attribute.options.map((option) => (
            <option key={option.value} value={option.value}>
              {localize(option.label)}
            </option>
          ))}
        </Select>
      ) : (
        <Input
          {...common}
          {...field}
          inputMode={attribute.type === 'number' ? 'decimal' : undefined}
          dir={attribute.type === 'number' ? 'ltr' : undefined}
        />
      )}
    </FormRow>
  );
}
