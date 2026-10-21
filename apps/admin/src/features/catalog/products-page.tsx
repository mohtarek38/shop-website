import { PRODUCT_STATUSES } from '@shop/contracts';
import { buttonVariants, Card, Input, Select } from '@shop/ui';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/page-header';
import { Pagination } from '../../components/pagination';
import { useFormat } from '../../lib/format';
import { useCan } from '../../lib/permissions';
import { useLocalize } from '../../lib/use-localize';
import { productsRoute } from '../../router';
import { CategoryOptions } from './category-options';
import { brandsQuery, categoriesQuery, productsQuery } from './queries';
import { StatusBadge } from './status-badge';

const PAGE_SIZE = 20;

export function ProductsPage() {
  const { t } = useTranslation();
  const localize = useLocalize();
  const format = useFormat();
  const canWrite = useCan('catalog.write');
  const search = productsRoute.useSearch();
  const navigate = useNavigate({ from: productsRoute.fullPath });

  const categories = useQuery(categoriesQuery).data ?? [];
  const brands = useQuery(brandsQuery).data ?? [];
  const page = search.page ?? 1;
  const { data, isPending } = useQuery(productsQuery({ ...search, page, pageSize: PAGE_SIZE }));

  // Search as you type, without a request per keystroke.
  const [text, setText] = useState(search.q ?? '');
  useEffect(() => {
    const handle = setTimeout(() => {
      if (text !== (search.q ?? '')) {
        void navigate({ search: (prev) => ({ ...prev, q: text || undefined, page: undefined }) });
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [text, search.q, navigate]);

  const setFilter = (key: 'categoryId' | 'brandId' | 'status', value: string) =>
    void navigate({ search: (prev) => ({ ...prev, [key]: value || undefined, page: undefined }) });

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={t('products.title')}
        actions={
          canWrite && (
            <Link to="/products/new" className={buttonVariants({ variant: 'primary' })}>
              <Plus className="size-4" aria-hidden />
              {t('products.new')}
            </Link>
          )
        }
      />

      <Card className="mb-4 grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="relative sm:col-span-2 lg:col-span-1">
          <span className="sr-only">{t('common.search')}</span>
          <Search
            className="pointer-events-none absolute start-3 top-3 size-4 text-muted"
            aria-hidden
          />
          <Input
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('products.searchPlaceholder')}
            className="ps-9"
          />
        </label>
        <Select
          aria-label={t('products.category')}
          value={search.categoryId ?? ''}
          onChange={(e) => setFilter('categoryId', e.target.value)}
        >
          <option value="">{t('products.allCategories')}</option>
          <CategoryOptions categories={categories} />
        </Select>
        <Select
          aria-label={t('products.brand')}
          value={search.brandId ?? ''}
          onChange={(e) => setFilter('brandId', e.target.value)}
        >
          <option value="">{t('products.allBrands')}</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {localize(b.name)}
            </option>
          ))}
        </Select>
        <Select
          aria-label={t('products.status')}
          value={search.status ?? ''}
          onChange={(e) => setFilter('status', e.target.value)}
        >
          <option value="">{t('products.allStatuses')}</option>
          {PRODUCT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`status.${s}`)}
            </option>
          ))}
        </Select>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border text-muted">
            <tr className="[&>th]:px-4 [&>th]:py-2 [&>th]:text-start [&>th]:font-medium">
              <th>{t('products.name')}</th>
              <th>{t('products.brand')}</th>
              <th>{t('products.category')}</th>
              <th>{t('products.status')}</th>
              <th>{t('products.variants')}</th>
              <th>{t('products.priceFrom')}</th>
              <th>{t('products.updated')}</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((p) => (
              <tr
                key={p.id}
                className="border-b border-border last:border-0 hover:bg-surface [&>td]:px-4 [&>td]:py-3"
              >
                <td>
                  <Link
                    to="/products/$productId"
                    params={{ productId: p.id }}
                    className="font-medium text-primary-hover hover:underline"
                  >
                    {localize(p.name)}
                  </Link>
                </td>
                <td>{localize(p.brand.name)}</td>
                <td>{localize(p.category.name)}</td>
                <td>
                  <StatusBadge status={p.status} />
                </td>
                <td>{p.variantCount}</td>
                <td className="whitespace-nowrap">{format.money(p.priceFrom)}</td>
                <td className="whitespace-nowrap text-muted">{format.date(p.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isPending && data?.items.length === 0 && (
          <p className="p-8 text-center text-muted">{t('products.empty')}</p>
        )}
      </Card>

      {data && data.total > 0 && (
        <div className="mt-4">
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={data.total}
            onPage={(next) => void navigate({ search: (prev) => ({ ...prev, page: next }) })}
          />
        </div>
      )}
    </div>
  );
}
