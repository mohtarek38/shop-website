import type { Locale } from '@shop/contracts';
import type messages from '../messages/ar.json';

// Type-safe translation keys and locales for next-intl.
declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof messages;
  }
}
