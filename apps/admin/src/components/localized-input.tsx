import { FormRow, Input, Textarea } from '@shop/ui';
import {
  type FieldErrors,
  type FieldValues,
  get,
  type Path,
  type UseFormRegister,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';

/**
 * Arabic and English inputs side by side for a `{ ar, en }` field. Arabic is required
 * (unless `optional`), English falls back to Arabic in the shop (ADR-0010).
 */
export function LocalizedInput<T extends FieldValues>({
  name,
  label,
  register,
  errors,
  multiline = false,
  optional = false,
}: {
  name: string;
  label: string;
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  multiline?: boolean;
  optional?: boolean;
}) {
  const { t } = useTranslation();
  const Control = multiline ? Textarea : Input;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {(['ar', 'en'] as const).map((lang) => {
        const field = `${name}.${lang}` as Path<T>;
        const id = field.replace(/\./g, '-');
        const error = (get(errors, field) ?? get(errors, name))?.message as string | undefined;
        return (
          <FormRow
            key={lang}
            htmlFor={id}
            label={`${label} · ${t(lang === 'ar' ? 'common.arabic' : 'common.english')}`}
            required={lang === 'ar' && !optional}
            error={lang === 'ar' ? error : (get(errors, field)?.message as string | undefined)}
          >
            <Control
              id={id}
              dir={lang === 'ar' ? 'rtl' : 'ltr'}
              lang={lang}
              aria-invalid={get(errors, field) ? true : undefined}
              {...register(field)}
            />
          </FormRow>
        );
      })}
    </div>
  );
}
