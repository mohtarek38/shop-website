import { Badge, buttonVariants, Card } from '@shop/ui';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/page-header';
import { useCan } from '../../lib/permissions';
import { useLocalize } from '../../lib/use-localize';
import { categoriesQuery } from './queries';

export function CategoriesPage() {
  const { t } = useTranslation();
  const localize = useLocalize();
  const canWrite = useCan('catalog.write');
  const { data: categories = [], isPending } = useQuery(categoriesQuery);

  // A top-level category holds no products itself; show its subcategories' total.
  const productCount = (id: string, own: number) =>
    own + categories.filter((c) => c.parentId === id).reduce((sum, c) => sum + c.productCount, 0);

  // Top-level categories, each followed by its subcategories.
  const rows = categories
    .filter((c) => !c.parentId)
    .flatMap((root) => [root, ...categories.filter((c) => c.parentId === root.id)]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={t('categories.title')}
        actions={
          canWrite && (
            <Link to="/categories/new" className={buttonVariants({ variant: 'primary' })}>
              <Plus className="size-4" aria-hidden />
              {t('categories.new')}
            </Link>
          )
        }
      />
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-b border-border text-muted">
            <tr className="[&>th]:px-4 [&>th]:py-2 [&>th]:text-start [&>th]:font-medium">
              <th>{t('categories.name')}</th>
              <th>{t('productEditor.slug')}</th>
              <th>{t('categories.attributes')}</th>
              <th>{t('categories.products')}</th>
              <th>{t('products.status')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr
                key={c.id}
                className="border-b border-border last:border-0 hover:bg-surface [&>td]:px-4 [&>td]:py-3"
              >
                <td className={c.parentId ? 'ps-10' : 'font-bold'}>
                  <Link
                    to="/categories/$categoryId"
                    params={{ categoryId: c.id }}
                    className="text-primary-hover hover:underline"
                  >
                    {localize(c.name)}
                  </Link>
                </td>
                <td dir="ltr" className="text-start text-muted">
                  {c.slug}
                </td>
                <td>{c.effectiveAttributes.length}</td>
                <td>{c.parentId ? c.productCount : productCount(c.id, c.productCount)}</td>
                <td>
                  <Badge tone={c.isActive ? 'success' : 'neutral'}>
                    {c.isActive ? t('common.active') : t('common.inactive')}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isPending && rows.length === 0 && (
          <p className="p-8 text-center text-muted">{t('categories.empty')}</p>
        )}
      </Card>
    </div>
  );
}
