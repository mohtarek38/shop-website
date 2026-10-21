import { Button, Card } from '@shop/ui';
import { ShieldX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSignOut } from '../lib/use-sign-out';

/** Shown to signed-in customers who open the dashboard. */
export function NoAccessPage() {
  const { t } = useTranslation();
  const signOut = useSignOut();

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <Card className="max-w-md space-y-4 p-6 text-center">
        <ShieldX className="mx-auto size-10 text-danger" aria-hidden />
        <h1 className="text-lg font-bold">{t('noAccess.title')}</h1>
        <p className="text-sm text-muted">{t('noAccess.body')}</p>
        <Button variant="primary" onClick={signOut}>
          {t('noAccess.action')}
        </Button>
      </Card>
    </div>
  );
}
