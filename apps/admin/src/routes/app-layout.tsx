import { Button, cn, Logo } from '@shop/ui';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Link, Outlet } from '@tanstack/react-router';
import { LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { currentLocale } from '../i18n';
import { meQuery } from '../lib/api';
import { useToggleLocale, useUserLocale } from '../lib/use-locale';
import { useSignOut } from '../lib/use-sign-out';
import { visibleNavItems } from '../navigation';

export function AppLayout() {
  const { t } = useTranslation();
  const { data: me } = useSuspenseQuery(meQuery);
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleLocale = useToggleLocale();
  const signOut = useSignOut();
  const locale = currentLocale();
  useUserLocale(me);

  const nav = (
    <nav aria-label={t('app.menu')} className="flex flex-col gap-0.5">
      {visibleNavItems(me.permissions).map(({ key, icon: Icon, to }) =>
        to ? (
          <Link
            key={key}
            to={to}
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3 rounded-control px-3 py-2 text-sm hover:bg-surface"
            activeProps={{ className: 'bg-primary-soft font-medium text-primary-hover' }}
            activeOptions={{ exact: true }}
          >
            <Icon className="size-5" aria-hidden />
            {t(`nav.${key}`)}
          </Link>
        ) : (
          <span
            key={key}
            aria-disabled="true"
            className="flex items-center gap-3 rounded-control px-3 py-2 text-sm text-muted"
          >
            <Icon className="size-5" aria-hidden />
            {t(`nav.${key}`)}
            <span className="ms-auto rounded-full bg-surface px-2 text-xs">{t('app.soon')}</span>
          </span>
        ),
      )}
    </nav>
  );

  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-60 shrink-0 border-e border-border bg-background p-3 lg:block">
        <div className="mb-6 px-2 pt-1">
          <Logo locale={locale} />
        </div>
        {nav}
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="w-64 bg-background p-3 shadow-xl">
            <div className="mb-6 flex items-center justify-between px-2 pt-1">
              <Logo locale={locale} />
              <button type="button" onClick={() => setMenuOpen(false)} aria-label={t('app.menu')}>
                <X className="size-5" aria-hidden />
              </button>
            </div>
            {nav}
          </div>
          <button
            type="button"
            aria-label={t('app.menu')}
            className="flex-1 bg-black/30"
            onClick={() => setMenuOpen(false)}
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-border bg-background px-4 py-2">
          <button
            type="button"
            className="lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label={t('app.menu')}
          >
            <Menu className="size-6" aria-hidden />
          </button>
          <span className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLocale}
            aria-label={t('app.switchLanguageLabel')}
            lang={locale === 'ar' ? 'en' : 'ar'}
          >
            {t('app.switchLanguage')}
          </Button>
          <span className="hidden items-center gap-2 text-sm sm:flex">
            <span
              className={cn(
                'grid size-8 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary-hover',
              )}
              aria-hidden
            >
              {me.name.charAt(0)}
            </span>
            {me.name}
          </span>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="size-4 rtl:-scale-x-100" aria-hidden />
            {t('app.signOut')}
          </Button>
        </header>

        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
