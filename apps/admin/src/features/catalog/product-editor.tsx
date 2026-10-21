import {
  type Brand,
  type Category,
  type Product,
  type ProductInput,
  type ProductStatus,
  splitAttributes,
} from '@shop/contracts';
import { Alert, Button, Checkbox, FormRow, Input, Select } from '@shop/ui';
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
import { useFormat } from '../../lib/format';
import {
  apiErrorMessage,
  apiFieldErrors,
  type FieldError,
  fieldErrors,
} from '../../lib/form-errors';
import { useCan } from '../../lib/permissions';
import { slugify } from '../../lib/slugify';
import { useLocalize } from '../../lib/use-localize';
import { productEditRoute, productNewRoute } from '../../router';
import { PendingPage } from '../../routes/pending';
import { CategoryOptions } from './category-options';
import { emptyProduct, formToInput, type ProductFormValues, productToForm } from './product-form';
import { brandsQuery, catalogKeys, categoriesQuery, productQuery } from './queries';
import { SpecField } from './spec-field';
import { StatusBadge } from './status-badge';
import { ImagesEditor } from './images-editor';
import { VariantsEditor } from './variants-editor';

export function NewProductPage() {
  const { categoryId } = productNewRoute.useSearch();
  const categories = useQuery(categoriesQuery);
  const brands = useQuery(brandsQuery);
  if (!categories.data || !brands.data) return <PendingPage />;
  return (
    <ProductEditor
      categories={categories.data}
      brands={brands.data}
      defaults={emptyProduct(categoryId ?? '')}
    />
  );
}

export function EditProductPage() {
  const { productId } = productEditRoute.useParams();
  const { created } = productEditRoute.useSearch();
  const categories = useQuery(categoriesQuery);
  const brands = useQuery(brandsQuery);
  const product = useQuery(productQuery(productId));
  if (product.error) throw product.error;
  if (!categories.data || !brands.data || !product.data) return <PendingPage />;
  return (
    <ProductEditor
      // Remount when switching products so the form starts from that product.
      key={product.data.id}
      categories={categories.data}
      brands={brands.data}
      product={product.data}
      defaults={productToForm(product.data)}
      justCreated={created}
    />
  );
}

function ProductEditor({
  categories,
  brands,
  product,
  defaults,
  justCreated = false,
}: {
  categories: Category[];
  brands: Brand[];
  product?: Product;
  defaults: ProductFormValues;
  justCreated?: boolean;
}) {
  const { t } = useTranslation();
  const localize = useLocalize();
  const format = useFormat();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const canWrite = useCan('catalog.write');
  const canPublish = useCan('catalog.publish');
  const [notice, setNotice] = useState<string | null>(justCreated ? t('common.created') : null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    reset,
    formState: { errors, dirtyFields, isSubmitting },
  } = useForm<ProductFormValues>({ defaultValues: defaults });

  const categoryId = useWatch({ control, name: 'categoryId' });
  const category = categories.find((c) => c.id === categoryId);
  const attributes = category?.effectiveAttributes ?? [];
  const { productAttributes, variantAttributes } = splitAttributes(attributes);

  // New products: derive the slug from the English name until the user edits it.
  const nameEn = useWatch({ control, name: 'name.en' });
  useEffect(() => {
    if (!product && !dirtyFields.slug) setValue('slug', slugify(nameEn));
  }, [nameEn, product, dirtyFields.slug, setValue]);

  const afterChange = (saved: Product) => {
    queryClient.setQueryData(productQuery(saved.id).queryKey, saved);
    void queryClient.invalidateQueries({ queryKey: [...catalogKeys.products, 'list'] });
    void queryClient.invalidateQueries({ queryKey: catalogKeys.categories });
    void queryClient.invalidateQueries({ queryKey: catalogKeys.brands });
  };

  const showErrors = (list: FieldError[]) => {
    for (const { path, message } of list) {
      // Errors about the whole variant list (e.g. duplicate SKUs) go on its root.
      // Errors about whole lists (duplicate SKUs, a missing image) go on the list's root.
      const target =
        path === 'variants'
          ? 'variants.root'
          : path.startsWith('images')
            ? 'images.root'
            : path || 'root';
      setError(target as Path<ProductFormValues>, { message });
    }
    setFormError(t('errors.check_fields'));
  };

  const save = useMutation({
    mutationFn: (input: ProductInput) =>
      product ? api.admin.products.update(product.id, input) : api.admin.products.create(input),
  });

  const onSubmit = handleSubmit(async (values) => {
    setNotice(null);
    setFormError(null);
    const { input, issues } = formToInput(values, attributes);
    if (!input) return showErrors(fieldErrors(issues, t));
    try {
      const saved = await save.mutateAsync(input);
      afterChange(saved);
      if (product) {
        reset(productToForm(saved));
        setNotice(t('common.saved'));
      } else {
        await navigate({
          to: '/products/$productId',
          params: { productId: saved.id },
          search: { created: true },
        });
      }
    } catch (error) {
      const list = apiFieldErrors(error, t);
      if (list) showErrors(list);
      else setFormError(apiErrorMessage(error, t));
    }
  });

  const changeStatus = useMutation({
    mutationFn: (status: ProductStatus) => api.admin.products.setStatus(product!.id, status),
    onSuccess: (saved) => {
      afterChange(saved);
      setNotice(t('productEditor.statusChanged'));
      setFormError(null);
    },
    onError: (error) => setFormError(apiErrorMessage(error, t)),
  });

  const remove = useMutation({
    mutationFn: () => api.admin.products.remove(product!.id),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: productQuery(product!.id).queryKey });
      void queryClient.invalidateQueries({ queryKey: catalogKeys.products });
      void queryClient.invalidateQueries({ queryKey: catalogKeys.categories });
      await navigate({ to: '/products' });
    },
    onError: (error) => setFormError(apiErrorMessage(error, t)),
  });

  const fieldError = (path: string) => get(errors, path)?.message as string | undefined;
  // EditProductPage re-renders with the cached product after every save or status change.
  const status = product?.status ?? null;

  return (
    <div className="mx-auto max-w-5xl pb-10">
      <PageHeader
        backTo="/products"
        title={product ? localize(product.name) : t('productEditor.newTitle')}
        meta={
          status && (
            <span className="flex items-center gap-2 text-sm text-muted">
              <StatusBadge status={status} />
              {product?.publishedAt &&
                t('productEditor.publishedAt', { date: format.date(product.publishedAt) })}
            </span>
          )
        }
        actions={
          <>
            {product && canPublish && status !== 'active' && (
              <Button
                variant="outline"
                loading={changeStatus.isPending}
                onClick={() => changeStatus.mutate('active')}
              >
                {t('productEditor.publish')}
              </Button>
            )}
            {product && canPublish && status === 'active' && (
              <Button loading={changeStatus.isPending} onClick={() => changeStatus.mutate('draft')}>
                {t('productEditor.unpublish')}
              </Button>
            )}
            {product && canPublish && status !== 'archived' && (
              <Button onClick={() => changeStatus.mutate('archived')}>
                {t('productEditor.archive')}
              </Button>
            )}
            {product && canWrite && (
              <ConfirmButton
                variant="danger"
                message={t('productEditor.deleteConfirm')}
                onConfirm={() => remove.mutate()}
              >
                <Trash2 className="size-4" aria-hidden />
                {t('common.delete')}
              </ConfirmButton>
            )}
            {canWrite && (
              <Button type="submit" form="product-form" variant="primary" loading={isSubmitting}>
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
        {fieldError('root') && <Alert tone="danger">{fieldError('root')}</Alert>}
        {!canWrite && <Alert tone="info">{t('common.readOnly')}</Alert>}
      </div>

      <form id="product-form" onSubmit={onSubmit} noValidate>
        <fieldset disabled={!canWrite} className="space-y-4">
          <Section title={t('productEditor.basics')}>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormRow
                label={t('productEditor.category')}
                htmlFor="categoryId"
                required
                error={fieldError('categoryId')}
              >
                <Select
                  id="categoryId"
                  aria-invalid={fieldError('categoryId') ? true : undefined}
                  {...register('categoryId')}
                >
                  <option value="">{t('productEditor.chooseCategory')}</option>
                  <CategoryOptions categories={categories} leavesOnly />
                </Select>
              </FormRow>
              <FormRow
                label={t('productEditor.brand')}
                htmlFor="brandId"
                required
                error={fieldError('brandId')}
              >
                <Select
                  id="brandId"
                  aria-invalid={fieldError('brandId') ? true : undefined}
                  {...register('brandId')}
                >
                  <option value="">{t('productEditor.chooseBrand')}</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {localize(b.name)}
                    </option>
                  ))}
                </Select>
              </FormRow>
            </div>
            <LocalizedInput
              name="name"
              label={t('productEditor.name')}
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
              <FormRow
                label={t('productEditor.warrantyMonths')}
                htmlFor="warrantyMonths"
                error={fieldError('warrantyMonths')}
              >
                <Input
                  id="warrantyMonths"
                  dir="ltr"
                  inputMode="numeric"
                  {...register('warrantyMonths')}
                />
              </FormRow>
            </div>
            <Checkbox
              id="isLargeItem"
              label={t('productEditor.largeItem')}
              {...register('isLargeItem')}
            />
          </Section>

          <Section title={t('productEditor.description')}>
            <LocalizedInput
              name="shortDescription"
              label={t('productEditor.shortDescription')}
              register={register}
              errors={errors}
              optional
            />
            <LocalizedInput
              name="description"
              label={t('productEditor.description')}
              register={register}
              errors={errors}
              multiline
              optional
            />
          </Section>

          <Section title={t('images.title')} hint={t('images.sectionHint')}>
            {fieldError('images.root') && <Alert tone="danger">{fieldError('images.root')}</Alert>}
            <ImagesEditor control={control} disabled={!canWrite} />
          </Section>

          <Section title={t('productEditor.specs')}>
            {!category ? (
              <p className="text-sm text-muted">{t('productEditor.specsEmpty')}</p>
            ) : productAttributes.length === 0 ? (
              <p className="text-sm text-muted">{t('productEditor.specsNone')}</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {productAttributes.map((attribute) => (
                  <SpecField
                    key={attribute.key}
                    attribute={attribute}
                    name={`specs.${attribute.key}`}
                    register={register}
                    errors={errors}
                  />
                ))}
              </div>
            )}
          </Section>

          <Section title={t('productEditor.variants')} hint={t('productEditor.variantsHint')}>
            {fieldError('variants.root') && (
              <Alert tone="danger">{fieldError('variants.root')}</Alert>
            )}
            <VariantsEditor
              control={control}
              register={register}
              errors={errors}
              variantAttributes={variantAttributes}
            />
          </Section>

          <details className="rounded-card border border-border bg-background p-4">
            <summary className="cursor-pointer font-bold">{t('productEditor.seo')}</summary>
            <div className="mt-4 space-y-4">
              <LocalizedInput
                name="seoTitle"
                label={t('productEditor.seoTitle')}
                register={register}
                errors={errors}
                optional
              />
              <LocalizedInput
                name="seoDescription"
                label={t('productEditor.seoDescription')}
                register={register}
                errors={errors}
                multiline
                optional
              />
            </div>
          </details>
        </fieldset>
      </form>
    </div>
  );
}
