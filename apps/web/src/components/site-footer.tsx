import { brand } from '@shop/brand';
import type { Locale } from '@shop/contracts';
import { Logo } from '@shop/ui';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

const LINKS = ['trackOrder', 'returns', 'faq', 'about', 'terms', 'privacy'] as const;
const PAYMENTS = ['cod', 'instapay', 'wallets', 'bank'] as const;

export async function SiteFooter({ locale }: { locale: Locale }) {
  const t = await getTranslations('footer');

  return (
    <footer className="mt-12 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-3">
          <Logo locale={locale} />
          <p className="text-sm text-muted">{brand.tagline[locale]}</p>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-bold">{t('help')}</h2>
          <ul className="grid grid-cols-2 gap-2 text-sm text-muted">
            {LINKS.map((key) => (
              <li key={key}>
                <Link href={`/${kebab(key)}`} className="hover:text-primary hover:underline">
                  {t(key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-bold">{t('paymentMethods')}</h2>
          <ul className="flex flex-wrap gap-2">
            {PAYMENTS.map((key) => (
              <li
                key={key}
                className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted"
              >
                {t(key)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p className="border-t border-border py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} {brand.legalName || brand.name[locale]}. {t('rights')}
      </p>
    </footer>
  );
}

function kebab(value: string): string {
  return value.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}
