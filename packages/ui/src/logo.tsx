import { brand } from '@shop/brand';
import type { Locale } from '@shop/contracts';
import { cn } from './cn';

export interface LogoProps {
  locale: Locale;
  /** `inverse` for coloured backgrounds such as the storefront header. */
  tone?: 'default' | 'inverse';
  /** Hide the name and show only the mark (small spaces). */
  markOnly?: boolean;
  className?: string;
}

/**
 * Shop logo (ADR-0021). Uses the real logo files once they're set in @shop/brand;
 * until then, a placeholder mark plus the shop name as text.
 */
export function Logo({ locale, tone = 'default', markOnly = false, className }: LogoProps) {
  const name = brand.name[locale];

  if (brand.logo.full && !markOnly) {
    return <img src={brand.logo.full} alt={name} className={cn('h-8 w-auto', className)} />;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-base font-bold',
        tone === 'inverse' ? 'text-primary-fg' : 'text-primary',
        className,
      )}
    >
      {brand.logo.mark ? (
        <img src={brand.logo.mark} alt="" className="size-8" />
      ) : (
        <PlaceholderMark tone={tone} />
      )}
      {markOnly ? <span className="sr-only">{name}</span> : name}
    </span>
  );
}

function PlaceholderMark({ tone }: { tone: 'default' | 'inverse' }) {
  const box = tone === 'inverse' ? 'fill-primary-fg' : 'fill-primary';
  const line = tone === 'inverse' ? 'stroke-primary' : 'stroke-primary-fg';
  return (
    <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden>
      <rect width="32" height="32" rx="8" className={box} />
      <path
        d="M8 15.5 16 9l8 6.5V24a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1z"
        fill="none"
        strokeWidth="1.8"
        strokeLinejoin="round"
        className={line}
      />
      <path
        d="M14 16v2.5M18 16v2.5M13 18.5h6v1.5a3 3 0 0 1-6 0zM16 23v2"
        fill="none"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={line}
      />
    </svg>
  );
}
