import { Button } from '@shop/ui';
import type { ErrorComponentProps } from '@tanstack/react-router';
import { TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function ErrorPage({ reset }: ErrorComponentProps) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-4 text-center">
      <TriangleAlert className="size-10 text-warning" aria-hidden />
      <h1 className="text-lg font-bold">{t('error.title')}</h1>
      <Button variant="primary" onClick={reset}>
        {t('error.retry')}
      </Button>
    </div>
  );
}
