import { formatMoney, TIME_ZONE } from '@shop/contracts';
import { useTranslation } from 'react-i18next';

/** Money and date formatting in the dashboard language, Western digits (ADR-0010). */
export function useFormat() {
  const { i18n } = useTranslation();
  const locale = i18n.language === 'en' ? 'en' : 'ar';
  const intl = locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB';
  const dates = new Intl.DateTimeFormat(intl, { dateStyle: 'medium', timeZone: TIME_ZONE });
  const dateTimes = new Intl.DateTimeFormat(intl, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: TIME_ZONE,
  });
  return {
    money: (piasters: number | null) => (piasters === null ? '—' : formatMoney(piasters, locale)),
    date: (iso: string | null) => (iso ? dates.format(new Date(iso)) : '—'),
    dateTime: (iso: string | null) => (iso ? dateTimes.format(new Date(iso)) : '—'),
  };
}
