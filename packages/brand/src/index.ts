/**
 * Brand identity: the ONLY place the shop name, tagline and domain are defined (ADR-0021).
 * Colours live in ../tokens.css; logo files in ../assets.
 *
 * To set the real brand: replace the placeholder values below and drop logo files into
 * assets/ (see docs/BRAND.md §4.2). Nothing else in the codebase needs to change.
 */

export interface LocalizedString {
  ar: string;
  en: string;
}

export interface Brand {
  name: LocalizedString;
  shortName: string;
  tagline: LocalizedString;
  /** Commercial-registry name printed on invoices. */
  legalName: string;
  /** Bare domain without protocol, e.g. `example.com`. */
  domain: string;
  /** Browser UI colour (mobile address bar), matches `--primary`. */
  themeColor: string;
  /**
   * Logo files in ../assets (BRAND.md §4.2). `null` until real files exist; apps then show
   * the placeholder mark + the shop name as text.
   */
  logo: { full: string | null; mark: string | null };
}

export const PLACEHOLDER = {
  name: { ar: 'اسم المتجر', en: 'Shop Name' },
  shortName: 'Shop',
  legalName: '',
  domain: '',
} as const;

export const brand: Brand = {
  name: { ...PLACEHOLDER.name },
  shortName: PLACEHOLDER.shortName,
  tagline: { ar: 'أجهزة منزلية وكهربائية', en: 'Home & electric appliances' },
  legalName: PLACEHOLDER.legalName,
  domain: PLACEHOLDER.domain,
  themeColor: '#0F6E64',
  logo: { full: null, mark: null },
};

/** Returns the brand fields that still hold placeholder values. */
export function findPlaceholders(b: Brand = brand): string[] {
  const issues: string[] = [];
  if (b.name.ar === PLACEHOLDER.name.ar) issues.push('name.ar');
  if (b.name.en === PLACEHOLDER.name.en) issues.push('name.en');
  if (b.shortName === PLACEHOLDER.shortName) issues.push('shortName');
  if (!b.legalName.trim()) issues.push('legalName');
  if (!b.domain.trim()) issues.push('domain');
  return issues;
}

/**
 * Called by production builds. Fails unless the brand is final, or the environment
 * explicitly allows placeholders (staging, previews) with ALLOW_BRAND_PLACEHOLDERS=true.
 */
export function assertNoPlaceholders(
  env: Record<string, string | undefined> = process.env,
  b: Brand = brand,
): void {
  if (env.ALLOW_BRAND_PLACEHOLDERS === 'true') return;
  const issues = findPlaceholders(b);
  if (issues.length > 0) {
    throw new Error(
      `Brand still has placeholder values: ${issues.join(', ')}. ` +
        'Set them in packages/brand/src/index.ts, or set ALLOW_BRAND_PLACEHOLDERS=true for non-production builds.',
    );
  }
}
