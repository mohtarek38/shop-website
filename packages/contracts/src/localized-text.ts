import { z } from 'zod';
import type { Locale } from './locale';

/**
 * Translatable text stored as JSONB (ADR-0010).
 * Arabic is required; English is optional and falls back to Arabic.
 */
export const localizedTextSchema = z.object({
  ar: z.string().trim().min(1),
  en: z.string().trim().min(1).optional(),
});
export type LocalizedText = z.infer<typeof localizedTextSchema>;

/** Optional variant for fields like descriptions, where both languages may be empty. */
export const optionalLocalizedTextSchema = z.object({
  ar: z.string().trim().optional(),
  en: z.string().trim().optional(),
});
export type OptionalLocalizedText = z.infer<typeof optionalLocalizedTextSchema>;

export function localize(text: OptionalLocalizedText | null | undefined, locale: Locale): string {
  if (!text) return '';
  return (locale === 'en' ? text.en || text.ar : text.ar || text.en) ?? '';
}
