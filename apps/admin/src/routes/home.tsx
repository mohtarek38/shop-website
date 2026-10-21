import { Alert, Card } from '@shop/ui';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { meQuery } from '../lib/api';

const KNOWN_ROLES = ['owner', 'manager', 'clerk', 'catalog_editor', 'driver'] as const;

export function HomePage() {
  const { t } = useTranslation();
  const { data: me } = useSuspenseQuery(meQuery);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <h1 className="text-xl font-bold">{t('home.welcome', { name: me.name })}</h1>

      <Card className="space-y-2">
        <h2 className="text-sm text-muted">{t('home.roles')}</h2>
        <ul className="flex flex-wrap gap-2">
          {me.roles.map((role) => (
            <li
              key={role}
              className="rounded-full bg-primary-soft px-3 py-1 text-sm text-primary-hover"
            >
              {(KNOWN_ROLES as readonly string[]).includes(role)
                ? t(`roles.${role as (typeof KNOWN_ROLES)[number]}`)
                : role}
            </li>
          ))}
        </ul>
      </Card>

      <Alert tone="info">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
        {t('home.comingSoon')}
      </Alert>
    </div>
  );
}
