import type { Locale } from '@shop/contracts';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buttonVariants } from '@shop/ui';
import { Construction } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { PLANNED_PAGES } from '@/lib/site-links';

/**
 * Pages linked from the site but not built yet show "coming soon";
 * any other unknown path is a real 404.
 */
export async function generateMetadata({
  params,
}: PageProps<'/[locale]/[...rest]'>): Promise<Metadata> {
  const { rest } = await params;
  if (!PLANNED_PAGES.has(rest[0] ?? '')) return {};
  const t = await getTranslations('comingSoon');
  return { title: t('title'), robots: { index: false } };
}

export default async function PlannedOrMissingPage({ params }: PageProps<'/[locale]/[...rest]'>) {
  const { locale, rest } = await params;
  if (!PLANNED_PAGES.has(rest[0] ?? '')) notFound();
  setRequestLocale(locale as Locale); // validated by the [locale] layout

  const t = await getTranslations('comingSoon');
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <Construction className="size-12 text-primary" strokeWidth={1.5} aria-hidden />
      <h1 className="text-xl font-bold">{t('title')}</h1>
      <p className="text-muted">{t('body')}</p>
      <Link href="/" className={buttonVariants({ variant: 'primary' })}>
        {t('home')}
      </Link>
    </div>
  );
}
