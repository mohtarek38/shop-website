import { localize, type OptionalLocalizedText } from '@shop/contracts';
import { useTranslation } from 'react-i18next';

/** Picks the dashboard language's text from a `{ar, en}` value (falling back to Arabic). */
export function useLocalize() {
  const { i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en' : 'ar';
  return (text: OptionalLocalizedText | null | undefined) => localize(text, locale);
}
