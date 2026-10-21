import {
  AirVent,
  Banknote,
  CookingPot,
  Headset,
  Microwave,
  Refrigerator,
  ShieldCheck,
  Truck,
  Tv,
  WashingMachine,
} from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buttonVariants } from '@shop/ui';
import { Link } from '@/i18n/navigation';

// Placeholder categories until the catalog API exists (Phase 2).
const CATEGORIES = [
  { key: 'refrigerators', Icon: Refrigerator },
  { key: 'washers', Icon: WashingMachine },
  { key: 'tvs', Icon: Tv },
  { key: 'acs', Icon: AirVent },
  { key: 'cookers', Icon: CookingPot },
  { key: 'small', Icon: Microwave },
] as const;

const TRUST = [
  { key: 'delivery', Icon: Truck },
  { key: 'cod', Icon: Banknote },
  { key: 'warranty', Icon: ShieldCheck },
  { key: 'support', Icon: Headset },
] as const;

export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params;
  setRequestLocale(locale as 'ar' | 'en');
  const t = await getTranslations('home');
  const tNav = await getTranslations('nav');

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-6">
      <section className="flex flex-col gap-6 rounded-card bg-primary-soft p-6 sm:flex-row sm:items-center sm:p-10">
        <div className="flex-1 space-y-3">
          <span className="inline-block rounded-full bg-background px-3 py-1 text-xs font-medium text-primary-hover">
            {t('heroBadge')}
          </span>
          <h1 className="text-2xl font-bold text-primary-hover sm:text-4xl">{t('heroTitle')}</h1>
          <p className="text-muted">{t('heroSubtitle')}</p>
          <a href="#categories" className={buttonVariants({ variant: 'cta', size: 'lg' })}>
            {t('heroCta')}
          </a>
        </div>
        <Refrigerator
          className="hidden size-40 shrink-0 text-primary sm:block"
          strokeWidth={1}
          aria-hidden
        />
      </section>

      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {TRUST.map(({ key, Icon }) => (
          <li key={key} className="flex items-center gap-3 text-sm text-muted">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
              <Icon className="size-5" aria-hidden />
            </span>
            {t(`trust.${key}`)}
          </li>
        ))}
      </ul>

      <section id="categories" className="scroll-mt-32 space-y-4">
        <h2 className="text-lg font-bold">{t('shopByCategory')}</h2>
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {CATEGORIES.map(({ key, Icon }) => (
            <li key={key}>
              <Link
                href={`/${key}`}
                className="group flex flex-col items-center gap-2 text-center text-sm"
              >
                <span className="grid aspect-square w-full place-items-center rounded-card bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-fg">
                  <Icon className="size-10" strokeWidth={1.5} aria-hidden />
                </span>
                {tNav(key)}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
