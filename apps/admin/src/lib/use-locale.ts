import type { Locale, Me } from '@shop/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { currentLocale, i18n } from '../i18n';
import { api, meQuery } from './api';

/** Applies the signed-in user's saved language once on load. */
export function useUserLocale(me: Me): void {
  useEffect(() => {
    if (me.locale !== currentLocale()) void i18n.changeLanguage(me.locale);
  }, [me.locale]);
}

/** Switches the UI language and saves it to the user's account. */
export function useToggleLocale() {
  const { i18n: instance } = useTranslation();
  const queryClient = useQueryClient();

  return async () => {
    const next: Locale = instance.language === 'ar' ? 'en' : 'ar';
    await instance.changeLanguage(next);
    try {
      queryClient.setQueryData(meQuery.queryKey, await api.me.update({ locale: next }));
    } catch {
      // The UI already switched; saving the preference can be retried next time.
    }
  };
}
