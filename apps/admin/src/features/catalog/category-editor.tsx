import type { Category, CategoryInput } from '@shop/contracts';
import { Alert, Badge, Button, Checkbox, FormRow, Input, Select } from '@shop/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { get, type Path, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ConfirmButton } from '../../components/confirm-button';
import { LocalizedInput } from '../../components/localized-input';
import { PageHeader, Section } from '../../components/page-header';
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
import { categoryEditRoute, categoryNewRoute } from '../../router';
import { PendingPage } from '../../routes/pending';
import { AttributesEditor } from './attributes-editor';
import {
  type CategoryFormValues,
  categoryToForm,
  emptyCategory,
  formToCategoryInput,
} from './category-form';
import { catalogKeys, categoriesQuery } from './queries';

export function NewCategoryPage() {
  const { parentId } = categoryNewRoute.useSearch();
  const categories = useQuery(categoriesQuery);
  if (!categories.data) return <PendingPage />;
  return <CategoryEditor categories={categories.data} defaults={emptyCategory(parentId ?? '')} />;
}

export function EditCategoryPage() {
  const { categoryId } = categoryEditRoute.useParams();
  const categories = useQuery(categoriesQuery);
  if (!categories.data) return <PendingPage />;
  const category = categories.data.find((c) => c.id === categoryId);
  if (!category) return <Alert tone="danger">404</Alert>;
  return (
    <CategoryEditor
      key={category.id}
      categories={categories.data}
      category={category}
      defaults={categoryToForm(category)}
    />
  );
}

function CategoryEditor({
  categories,
  category,
  defaults,
}: {
  categories: Category[];
  category?: Category;
  defaults: CategoryFormValues;
}) {
  const { t } = useTranslation();
  const localize = useLocalize();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canWrite = useCan('catalog.write');
  const [notice, setNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { register, control, handleSubmit, setError, setValue, reset, watch, formState } =
    useForm<CategoryFormValues>({
      defaultValues: defaults,
    });
  const { errors, dirtyFields, isSubmitting } = formState;

  const nameEn = useWatch({ control, name: 'name.en' });
  const parentId = useWatch({ control, name: 'parentId' });
  useEffect(() => {
    if (!category && !dirtyFields.slug) setValue('slug', slugify(nameEn));
  }, [nameEn, category, dirtyFields.slug, setValue]);

  // Only top-level categories can be parents (two-level tree), and not this one.
  const parents = categories.filter((c) => !c.parentId && c.id !== category?.id);
  const parent = categories.find((c) => c.id === parentId);

  const showErrors = (list: FieldError[]) => {
    for (const { path, message } of list) {
      const target = path === 'attributes' ? 'attributes.root' : path || 'root';
      setError(target as Path<CategoryFormValues>, { message });
    }
    setFormError(t('errors.check_fields'));
  };

  const save = useMutation({
    mutationFn: (input: CategoryInput) =>
      category
        ? api.admin.categories.update(category.id, input)
        : api.admin.categories.create(input),
  });

  const onSubmit = handleSubmit(async (values) => {
    setNotice(null);
    setFormError(null);
    const { input, issues } = formToCategoryInput(values);
    if (!input) return showErrors(fieldErrors(issues, t));
    try {
      const saved = await save.mutateAsync(input);
      await queryClient.invalidateQueries({ queryKey: catalogKeys.categories });
      if (category) {
        reset(categoryToForm(saved));
        setNotice(t('common.saved'));
      } else {
        await navigate({ to: '/categories/$categoryId', params: { categoryId: saved.id } });
      }
    } catch (error) {
      const list = apiFieldErrors(error, t);
      if (list) showErrors(list);
      else setFormError(apiErrorMessage(error, t));
    }
  });

  const remove = useMutation({
    mutationFn: () => api.admin.categories.remove(category!.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: catalogKeys.categories });
      await navigate({ to: '/categories' });
    },
    onError: (error) => setFormError(apiErrorMessage(error, t)),
  });

  const fieldError = (path: string) => get(errors, path)?.message as string | undefined;

  return (
    <div className="mx-auto max-w-4xl pb-10">
      <PageHeader
        backTo="/categories"
        title={category ? localize(category.name) : t('categoryEditor.newTitle')}
        actions={
          <>
            {category && canWrite && (
              <ConfirmButton
                variant="danger"
                message={t('categoryEditor.deleteConfirm')}
                onConfirm={() => remove.mutate()}
              >
                <Trash2 className="size-4" aria-hidden />
                {t('common.delete')}
              </ConfirmButton>
            )}
            {canWrite && (
              <Button type="submit" form="category-form" variant="primary" loading={isSubmitting}>
                <Save className="size-4" aria-hidden />
                {t('common.save')}
              </Button>
            )}
          </>
        }
      />

      <div className="mb-4 space-y-2" aria-live="polite">
        {notice && <Alert tone="success">{notice}</Alert>}
        {formError && <Alert tone="danger">{formError}</Alert>}
        {!canWrite && <Alert tone="info">{t('common.readOnly')}</Alert>}
      </div>

      <form id="category-form" onSubmit={onSubmit} noValidate>
        <fieldset disabled={!canWrite} className="space-y-4">
          <Section title={t('categoryEditor.name')}>
            <FormRow
              label={t('categoryEditor.parent')}
              htmlFor="parentId"
              error={fieldError('parentId')}
            >
              <Select id="parentId" {...register('parentId')}>
                <option value="">{t('categoryEditor.noParent')}</option>
                {parents.map((p) => (
                  <option key={p.id} value={p.id}>
                    {localize(p.name)}
                  </option>
                ))}
              </Select>
            </FormRow>
            <LocalizedInput
              name="name"
              label={t('categoryEditor.name')}
              register={register}
              errors={errors}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <FormRow
                className="sm:col-span-2"
                label={t('productEditor.slug')}
                htmlFor="slug"
                required
                hint={t('productEditor.slugHint')}
                error={fieldError('slug')}
              >
                <Input
                  id="slug"
                  dir="ltr"
                  aria-invalid={fieldError('slug') ? true : undefined}
                  {...register('slug')}
                />
              </FormRow>
              <FormRow label={t('common.sortOrder')} htmlFor="sortOrder">
                <Input id="sortOrder" dir="ltr" inputMode="numeric" {...register('sortOrder')} />
              </FormRow>
            </div>
            <LocalizedInput
              name="description"
              label={t('categoryEditor.description')}
              register={register}
              errors={errors}
              multiline
              optional
            />
            <Checkbox id="isActive" label={t('common.active')} {...register('isActive')} />
          </Section>

          {parent && parent.attributes.length > 0 && (
            <Section title={t('categoryEditor.inherited', { name: localize(parent.name) })}>
              <ul className="flex flex-wrap gap-2">
                {parent.attributes.map((a) => (
                  <li key={a.key}>
                    <Badge>{localize(a.label)}</Badge>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title={t('categoryEditor.attributes')} hint={t('categoryEditor.attributesHint')}>
            <AttributesEditor
              control={control}
              register={register}
              errors={errors}
              watch={watch}
              setValue={setValue}
            />
          </Section>
        </fieldset>
      </form>
    </div>
  );
}
