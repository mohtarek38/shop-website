import { Button } from '@shop/ui';
import { type ErrorComponentProps, useRouter } from '@tanstack/react-router';
import { TriangleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function ErrorPage({ reset }: ErrorComponentProps) {
  const { t } = useTranslation();
  const router = useRouter();

  // `reset` only clears the error boundary; invalidating re-runs the route's checks
  // and data loading (e.g. after the API comes back up).
  const retry = () => {
    reset();
    void router.invalidate();
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-4 text-center">
      <TriangleAlert className="size-10 text-warning" aria-hidden />
      <h1 className="text-lg font-bold">{t('error.title')}</h1>
      <Button variant="primary" onClick={retry}>
        {t('error.retry')}
      </Button>
    </div>
  );
}
