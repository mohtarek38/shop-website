import type { InventoryRow } from '@shop/contracts';
import { Badge, Button, Card, Checkbox, cn, Input } from '@shop/ui';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { History, Search, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../../components/modal';
import { PageHeader } from '../../components/page-header';
import { Pagination } from '../../components/pagination';
import { useCan } from '../../lib/permissions';
import { useLocalize } from '../../lib/use-localize';
import { inventoryRoute } from '../../router';
import { HistoryList } from './history-list';
import { LocationsPanel } from './locations-panel';
import { locationsQuery, stockQuery } from './queries';
import { StockDialog } from './stock-dialog';

const PAGE_SIZE = 25;

export function InventoryPage() {
  const { t } = useTranslation();
  const localize = useLocalize();
  const canAdjust = useCan('inventory.adjust');
  const search = inventoryRoute.useSearch();
  const navigate = useNavigate({ from: inventoryRoute.fullPath });
  const tab = search.tab ?? 'stock';
  const page = search.page ?? 1;

  const { data: locations = [] } = useQuery(locationsQuery);
  const active = locations.filter((l) => l.isActive);
  const { data, isPending } = useQuery(
    stockQuery({ q: search.q, lowStock: search.lowStock, page, pageSize: PAGE_SIZE }),
  );

  const [text, setText] = useState(search.q ?? '');
  useEffect(() => {
    const handle = setTimeout(() => {
      if (text !== (search.q ?? '')) {
        void navigate({ search: (prev) => ({ ...prev, q: text || undefined, page: undefined }) });
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [text, search.q, navigate]);

  const [dialog, setDialog] = useState<{ kind: 'stock' | 'history'; row: InventoryRow } | null>(
    null,
  );

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={t('nav.inventory')} />

      <div role="tablist" className="mb-4 flex gap-2 border-b border-border">
        {(['stock', 'locations'] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() =>
              void navigate({ search: { tab: value === 'stock' ? undefined : value } })
            }
            className={cn(
              '-mb-px border-b-2 px-3 py-2 text-sm',
              tab === value
                ? 'border-primary font-medium text-primary-hover'
                : 'border-transparent text-muted',
            )}
          >
            {t(`inventory.tabs.${value}`)}
          </button>
        ))}
      </div>

      {tab === 'locations' ? (
        <LocationsPanel />
      ) : (
        <>
          <Card className="mb-4 flex flex-wrap items-center gap-3 p-3">
            <label className="relative min-w-60 flex-1">
              <span className="sr-only">{t('common.search')}</span>
              <Search
                className="pointer-events-none absolute start-3 top-3 size-4 text-muted"
                aria-hidden
              />
              <Input
                type="search"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={t('inventory.searchPlaceholder')}
                className="ps-9"
              />
            </label>
            <Checkbox
              id="low-stock"
              label={t('inventory.lowStockOnly')}
              checked={search.lowStock ?? false}
              onChange={(e) =>
                void navigate({
                  search: (prev) => ({
                    ...prev,
                    lowStock: e.target.checked || undefined,
                    page: undefined,
                  }),
                })
              }
            />
          </Card>

          <Card className="overflow-x-auto p-0">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-border text-muted">
                <tr className="[&>th]:px-4 [&>th]:py-2 [&>th]:text-start [&>th]:font-medium">
                  <th>{t('products.name')}</th>
                  {active.map((l) => (
                    <th key={l.id} title={localize(l.name)} dir="ltr" className="text-start">
                      {l.code}
                    </th>
                  ))}
                  <th>{t('inventory.totalAvailable')}</th>
                  <th>{t('products.status')}</th>
                  <th>
                    <span className="sr-only">{t('inventory.actions')}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.items.map((row) => (
                  <tr
                    key={row.variantId}
                    className={cn(
                      'border-b border-border last:border-0 [&>td]:px-4 [&>td]:py-3',
                      !row.variantActive && 'opacity-60',
                    )}
                  >
                    <td>
                      <Link
                        to="/products/$productId"
                        params={{ productId: row.product.id }}
                        className="font-medium text-primary-hover hover:underline"
                      >
                        {localize(row.product.name)}
                      </Link>
                      <p className="text-xs text-muted">
                        <span dir="ltr">{row.sku}</span>
                        {Object.values(row.options).length > 0 &&
                          ` · ${Object.values(row.options).join(' · ')}`}
                      </p>
                    </td>
                    {active.map((l) => {
                      const level = row.levels.find((x) => x.locationId === l.id);
                      return (
                        <td key={l.id} className={cn(level?.isLow && 'font-medium text-warning')}>
                          {level?.available ?? 0}
                          {(level?.reserved ?? 0) > 0 && (
                            <span className="text-xs text-muted">
                              {' '}
                              ({t('inventory.reservedShort', { count: level!.reserved })})
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="font-medium">{row.total.available}</td>
                    <td>
                      <StockBadge row={row} />
                    </td>
                    <td className="whitespace-nowrap text-end">
                      {canAdjust && (
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={t('inventory.change')}
                          onClick={() => setDialog({ kind: 'stock', row })}
                        >
                          <SlidersHorizontal className="size-4" aria-hidden />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={t('inventory.history')}
                        onClick={() => setDialog({ kind: 'history', row })}
                      >
                        <History className="size-4" aria-hidden />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!isPending && data?.items.length === 0 && (
              <p className="p-8 text-center text-muted">{t('inventory.empty')}</p>
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
        </>
      )}

      <Modal
        open={dialog !== null}
        onClose={() => setDialog(null)}
        wide={dialog?.kind === 'history'}
        title={dialog?.kind === 'history' ? t('inventory.history') : t('inventory.change')}
      >
        {dialog?.kind === 'stock' && (
          <StockDialog row={dialog.row} locations={locations} onDone={() => setDialog(null)} />
        )}
        {dialog?.kind === 'history' && <HistoryList variantId={dialog.row.variantId} />}
      </Modal>
    </div>
  );
}

function StockBadge({ row }: { row: InventoryRow }) {
  const { t } = useTranslation();
  if (row.total.available <= 0) return <Badge tone="danger">{t('inventory.outOfStock')}</Badge>;
  if (row.needsAttention) return <Badge tone="warning">{t('inventory.low')}</Badge>;
  return <Badge tone="success">{t('inventory.inStock')}</Badge>;
}
