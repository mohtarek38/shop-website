import { type Brand, brandInputSchema } from '@shop/contracts';
import { Alert, Badge, Button, Card, Checkbox, FormRow, Input } from '@shop/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { get, type Path, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ConfirmButton } from '../../components/confirm-button';
import { LocalizedInput } from '../../components/localized-input';
import { PageHeader } from '../../components/page-header';
import { api } from '../../lib/api';
import {
  apiErrorMessage,
  apiFieldErrors,
  type FieldError,
  fieldErrors,
} from '../../lib/form-errors';
import { useCan } from '../../lib/permissions';
import { slugify } from '../../lib/slugify';
import { useLocalize } from '../../lib/use-localize';
import { brandsQuery, catalogKeys } from './queries';

interface BrandFormValues {
  slug: string;
  name: { ar: string; en: string };
  isActive: boolean;
  sortOrder: string;
}

export function BrandsPage() {
  const { t } = useTranslation();
  const localize = useLocalize();
  const canWrite = useCan('catalog.write');
  const { data: brands = [], isPending } = useQuery(brandsQuery);
  const dialog = useRef<HTMLDialogElement>(null);
  // `undefined` = dialog closed, `null` = new brand.
  const [editing, setEditing] = useState<Brand | null | undefined>(undefined);

  // Show the dialog once its form has rendered.
  useEffect(() => {
    if (editing !== undefined && !dialog.current?.open) dialog.current?.showModal();
  }, [editing]);

  const open = (brand: Brand | null) => setEditing(brand);
  const close = () => {
    dialog.current?.close();
    setEditing(undefined);
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={t('brands.title')}
        actions={
          canWrite && (
            <Button variant="primary" onClick={() => open(null)}>
              <Plus className="size-4" aria-hidden />
              {t('brands.new')}
            </Button>
          )
        }
      />
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="border-b border-border text-muted">
            <tr className="[&>th]:px-4 [&>th]:py-2 [&>th]:text-start [&>th]:font-medium">
              <th>{t('brands.name')}</th>
              <th>{t('productEditor.slug')}</th>
              <th>{t('brands.products')}</th>
              <th>{t('products.status')}</th>
            </tr>
          </thead>
          <tbody>
            {brands.map((b) => (
              <tr
                key={b.id}
                className="border-b border-border last:border-0 hover:bg-surface [&>td]:px-4 [&>td]:py-3"
              >
                <td>
                  {canWrite ? (
                    <button
                      type="button"
                      onClick={() => open(b)}
                      className="font-medium text-primary-hover hover:underline"
                    >
                      {localize(b.name)}
                    </button>
                  ) : (
                    localize(b.name)
                  )}
                </td>
                <td dir="ltr" className="text-start text-muted">
                  {b.slug}
                </td>
                <td>{b.productCount}</td>
                <td>
                  <Badge tone={b.isActive ? 'success' : 'neutral'}>
                    {b.isActive ? t('common.active') : t('common.inactive')}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isPending && brands.length === 0 && (
          <p className="p-8 text-center text-muted">{t('brands.empty')}</p>
        )}
      </Card>

      <dialog
        ref={dialog}
        onClose={() => setEditing(undefined)}
        className="m-auto w-full max-w-lg rounded-card bg-background p-5 text-text backdrop:bg-black/40"
      >
        {editing !== undefined && (
          <BrandForm key={editing?.id ?? 'new'} brand={editing} onDone={close} />
        )}
      </dialog>
    </div>
  );
}

function BrandForm({ brand, onDone }: { brand: Brand | null; onDone: () => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, setError, setValue, getValues, formState } =
    useForm<BrandFormValues>({
      defaultValues: brand
        ? {
            slug: brand.slug,
            name: { ar: brand.name.ar, en: brand.name.en ?? '' },
            isActive: brand.isActive,
            sortOrder: String(brand.sortOrder),
          }
        : { slug: '', name: { ar: '', en: '' }, isActive: true, sortOrder: '0' },
    });
  const { errors, isSubmitting, dirtyFields } = formState;

  const showErrors = (list: FieldError[]) => {
    for (const { path, message } of list)
      setError((path || 'root') as Path<BrandFormValues>, { message });
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    const parsed = brandInputSchema.safeParse({
      ...values,
      sortOrder: Number(values.sortOrder || 0),
    });
    if (!parsed.success) return showErrors(fieldErrors(parsed.error.issues, t));
    try {
      if (brand) await api.admin.brands.update(brand.id, parsed.data);
      else await api.admin.brands.create(parsed.data);
      await queryClient.invalidateQueries({ queryKey: catalogKeys.brands });
      onDone();
    } catch (error) {
      const list = apiFieldErrors(error, t);
      if (list) showErrors(list);
      else setFormError(apiErrorMessage(error, t));
    }
  });

  const remove = async () => {
    try {
      await api.admin.brands.remove(brand!.id);
      await queryClient.invalidateQueries({ queryKey: catalogKeys.brands });
      onDone();
    } catch (error) {
      setFormError(apiErrorMessage(error, t));
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <h2 className="text-lg font-bold">{brand ? t('brands.editTitle') : t('brands.new')}</h2>
      {formError && <Alert tone="danger">{formError}</Alert>}
      <LocalizedInput name="name" label={t('brands.name')} register={register} errors={errors} />
      <div className="grid gap-3 sm:grid-cols-3">
        <FormRow
          className="sm:col-span-2"
          label={t('productEditor.slug')}
          htmlFor="brand-slug"
          required
          error={get(errors, 'slug')?.message}
        >
          <Input
            id="brand-slug"
            dir="ltr"
            {...register('slug')}
            onFocus={() => {
              if (!brand && !dirtyFields.slug && !getValues('slug'))
                setValue('slug', slugify(getValues('name.en')));
            }}
          />
        </FormRow>
        <FormRow label={t('common.sortOrder')} htmlFor="brand-sort">
          <Input id="brand-sort" dir="ltr" inputMode="numeric" {...register('sortOrder')} />
        </FormRow>
      </div>
      <Checkbox id="brand-active" label={t('common.active')} {...register('isActive')} />
      <div className="flex flex-wrap justify-end gap-2">
        {brand && (
          <ConfirmButton
            variant="danger"
            className="me-auto"
            message={t('brands.deleteConfirm')}
            onConfirm={remove}
          >
            {t('common.delete')}
          </ConfirmButton>
        )}
        <Button onClick={onDone}>{t('common.cancel')}</Button>
        <Button type="submit" variant="primary" loading={isSubmitting}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
}
