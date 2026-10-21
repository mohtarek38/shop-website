'use client';

import { useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';

/** Links to the same page in the other language. */
export function LocaleSwitcher({ label, ariaLabel }: { label: string; ariaLabel: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const other = locale === 'ar' ? 'en' : 'ar';

  return (
    <Link
      href={pathname}
      locale={other}
      aria-label={ariaLabel}
      lang={other}
      className="rounded-control px-2 py-1 text-sm font-medium hover:bg-primary-hover"
    >
      {label}
    </Link>
  );
}
