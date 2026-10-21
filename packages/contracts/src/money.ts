import { z } from 'zod';
import type { Locale } from './locale';

/**
 * All money is integer piasters (1 EGP = 100 piasters). See ADR-0011.
 * Price math lives in the API's pricing module; these are conversion and display helpers only.
 */
export const piastersSchema = z.number().int().nonnegative();
export type Piasters = number;

export function egpToPiasters(egp: number): Piasters {
  return Math.round(egp * 100);
}

export function piastersToEgp(piasters: Piasters): number {
  return piasters / 100;
}

const formatters: Record<Locale, Intl.NumberFormat> = {
  ar: new Intl.NumberFormat('ar-EG-u-nu-latn', { maximumFractionDigits: 2 }),
  en: new Intl.NumberFormat('en-EG', { maximumFractionDigits: 2 }),
};

/** `12,500 ج.م` (ar) or `EGP 12,500` (en), always with Western digits. */
export function formatMoney(piasters: Piasters, locale: Locale): string {
  const amount = formatters[locale].format(piastersToEgp(piasters));
  return locale === 'ar' ? `${amount} ج.م` : `EGP ${amount}`;
}
