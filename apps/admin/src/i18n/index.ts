import { brand } from '@shop/brand';
import { DEFAULT_LOCALE, type Locale } from '@shop/contracts';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './ar.json';
import en from './en.json';

const STORAGE_KEY = 'shop.admin.locale';

/** Remembered on this device so the login page opens in the right language. */
function storedLocale(): Locale {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'en' || value === 'ar' ? value : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

function applyDocumentLocale(locale: string): void {
  const lang: Locale = locale === 'en' ? 'en' : 'ar';
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.title = `${i18n.t('app.title')} | ${brand.name[lang]}`;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Storage unavailable (private mode): the language still applies for this session.
  }
}

i18n.on('languageChanged', applyDocumentLocale);

await i18n.use(initReactI18next).init({
  resources: { ar: { translation: ar }, en: { translation: en } },
  lng: storedLocale(),
  fallbackLng: 'ar',
  interpolation: { escapeValue: false },
});
applyDocumentLocale(i18n.language);

export function currentLocale(): Locale {
  return i18n.language === 'en' ? 'en' : 'ar';
}

export { i18n };
