import { z } from 'zod';

export const LOCALES = ['ar', 'en'] as const;
export const DEFAULT_LOCALE = 'ar' satisfies Locale;

export const localeSchema = z.enum(LOCALES);
export type Locale = z.infer<typeof localeSchema>;

export const TIME_ZONE = 'Africa/Cairo';
