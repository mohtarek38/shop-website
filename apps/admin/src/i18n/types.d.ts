import 'i18next';
import type ar from './ar.json';

// Type-safe translation keys.
declare module 'i18next' {
  interface CustomTypeOptions {
    resources: { translation: typeof ar };
  }
}
