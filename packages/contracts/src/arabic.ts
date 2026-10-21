/**
 * Search normalization (ADR-0017). Must stay identical to the SQL `normalize_ar()` function
 * so stored search text and user queries match.
 */
export function normalizeArabic(input: string): string {
  return input
    .replace(/[ً-ٰٟ]/g, '') // tashkeel (diacritics) + superscript alef
    .replace(/ـ/g, '') // tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
