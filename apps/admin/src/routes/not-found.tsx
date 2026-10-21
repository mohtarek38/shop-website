import { buttonVariants } from '@shop/ui';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-4 text-center">
      <p className="text-5xl font-bold text-primary">404</p>
      <h1 className="text-lg font-bold">{t('notFound.title')}</h1>
      <Link to="/" className={buttonVariants({ variant: 'primary' })}>
        {t('notFound.home')}
      </Link>
    </div>
  );
}
