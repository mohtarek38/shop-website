import type { ProductStatus } from '@shop/contracts';
import { Badge } from '@shop/ui';
import { useTranslation } from 'react-i18next';

const TONE = { draft: 'warning', active: 'success', archived: 'neutral' } as const;

export function StatusBadge({ status }: { status: ProductStatus }) {
  const { t } = useTranslation();
  return <Badge tone={TONE[status]}>{t(`status.${status}`)}</Badge>;
}
