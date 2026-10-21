import type { Locale } from '@shop/contracts';
import { Logo } from '@shop/ui';
import { Heart, Menu, Search, ShoppingCart, User } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { LocaleSwitcher } from './locale-switcher';

// Placeholder category links until the catalog exists (Phase 2).
const NAV = ['refrigerators', 'washers', 'tvs', 'acs', 'cookers', 'small', 'offers'] as const;

export async function SiteHeader({ locale }: { locale: Locale }) {
  const t = await getTranslations('common');
  const tNav = await getTranslations('nav');

  return (
    <header className="sticky top-0 z-40 bg-primary text-primary-fg">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <button type="button" className="p-1 lg:hidden" aria-label={t('menu')}>
          <Menu className="size-6" aria-hidden />
        </button>
        <Link href="/" className="shrink-0">
          <Logo locale={locale} tone="inverse" />
        </Link>

        <SearchForm
          action={`/${locale}/search`}
          className="mx-4 hidden max-w-xl flex-1 lg:flex"
          label={t('search')}
          placeholder={t('searchPlaceholder')}
        />
        <div className="flex-1 lg:hidden" />

        <nav className="flex items-center gap-1">
          <HeaderIcon href="/account" label={t('account')} className="hidden sm:inline-flex">
            <User className="size-5" aria-hidden />
          </HeaderIcon>
          <HeaderIcon href="/wishlist" label={t('wishlist')}>
            <Heart className="size-5" aria-hidden />
          </HeaderIcon>
          <HeaderIcon href="/cart" label={t('cart')}>
            <ShoppingCart className="size-5" aria-hidden />
          </HeaderIcon>
          <LocaleSwitcher label={t('switchLanguage')} ariaLabel={t('switchLanguageLabel')} />
        </nav>
      </div>

      <div className="px-4 pb-3 lg:hidden">
        <SearchForm
          action={`/${locale}/search`}
          label={t('search')}
          placeholder={t('searchPlaceholder')}
        />
      </div>

      <nav className="hidden border-t border-primary-fg/15 bg-primary-hover lg:block">
        <ul className="mx-auto flex max-w-7xl gap-6 px-4 py-2 text-sm">
          {NAV.map((key) => (
            <li key={key}>
              <Link href={`/${key}`} className="opacity-90 hover:opacity-100 hover:underline">
                {tNav(key)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

function SearchForm({
  action,
  label,
  placeholder,
  className = 'flex',
}: {
  action: string;
  label: string;
  placeholder: string;
  className?: string;
}) {
  return (
    <form action={action} role="search" className={className}>
      <label className="flex w-full items-center gap-2 rounded-control bg-background px-3 text-text">
        <Search className="size-4 shrink-0 text-muted" aria-hidden />
        <span className="sr-only">{label}</span>
        <input
          name="q"
          type="search"
          placeholder={placeholder}
          className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted"
        />
      </label>
    </form>
  );
}

function HeaderIcon({
  href,
  label,
  className = 'inline-flex',
  children,
}: {
  href: string;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`${className} size-10 items-center justify-center rounded-control hover:bg-primary-hover`}
    >
      {children}
    </Link>
  );
}
