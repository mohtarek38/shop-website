import { DEFAULT_LOCALE, LOCALES } from '@shop/contracts';
import { defineRouting } from 'next-intl/routing';

/**
 * Arabic is the default; every URL carries its locale: /ar/..., /en/... (ADR-0010).
 * `/` always opens Arabic (no browser-language detection); visitors switch in the header.
 */
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
  localeDetection: false,
});
