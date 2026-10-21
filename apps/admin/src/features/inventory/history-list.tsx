import { cn } from '@shop/ui';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useFormat } from '../../lib/format';
import { useLocalize } from '../../lib/use-localize';
import { movementsQuery } from './queries';

/** The stock ledger of one variant, newest first. */
export function HistoryList({ variantId }: { variantId: string }) {
  const { t } = useTranslation();
  const localize = useLocalize();
  const format = useFormat();
  const { data = [], isPending } = useQuery(movementsQuery(variantId));

  if (isPending) return <p className="text-sm text-muted">{t('common.saving')}</p>;
  if (data.length === 0) return <p className="text-sm text-muted">{t('inventory.noHistory')}</p>;

  return (
    <div className="max-h-[60vh] overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-background text-muted">
          <tr className="[&>th]:py-2 [&>th]:pe-3 [&>th]:text-start [&>th]:font-medium">
            <th>{t('inventory.date')}</th>
            <th>{t('inventory.change')}</th>
            <th>{t('inventory.location')}</th>
            <th>{t('inventory.after')}</th>
            <th>{t('inventory.by')}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((m) => (
            <tr key={m.id} className="border-t border-border align-top [&>td]:py-2 [&>td]:pe-3">
              <td className="whitespace-nowrap text-muted">{format.dateTime(m.createdAt)}</td>
              <td>
                <span className="font-medium">{t(`movementTypes.${m.type}`)}</span>{' '}
                <span dir="ltr" className={cn(m.onHandDelta >= 0 ? 'text-success' : 'text-danger')}>
                  {m.onHandDelta > 0 ? '+' : ''}
                  {m.onHandDelta}
                </span>
                {m.reason && <p className="text-xs text-muted">{m.reason}</p>}
              </td>
              <td>{localize(m.location.name)}</td>
              <td>{m.onHandAfter}</td>
              <td className="text-muted">{m.actorName ?? t('inventory.system')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
