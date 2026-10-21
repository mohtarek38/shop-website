import { buttonVariants } from '@shop/ui';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function NotFound() {
  const t = await getTranslations('notFound');
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="text-5xl font-bold text-primary">404</p>
      <h1 className="text-xl font-bold">{t('title')}</h1>
      <p className="text-muted">{t('body')}</p>
      <Link href="/" className={buttonVariants({ variant: 'primary' })}>
        {t('home')}
      </Link>
    </div>
  );
}
