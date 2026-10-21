import { z } from 'zod';

/** Egyptian mobile operators: 010 Vodafone, 011 Etisalat (e&), 012 Orange, 015 WE. */
const LOCAL_MOBILE = /^01[0125]\d{8}$/;

/**
 * Normalizes an Egyptian mobile number to E.164 (`+201XXXXXXXXX`).
 * Accepts `01XXXXXXXXX`, `+201XXXXXXXXX`, `00201XXXXXXXXX`, `201XXXXXXXXX`,
 * with spaces, dashes or Eastern Arabic digits. Returns `null` if invalid.
 */
export function normalizeEgyptianMobile(input: string): string | null {
  let digits = toWesternDigits(input).replace(/[\s\-().]/g, '');
  if (digits.startsWith('+20')) digits = '0' + digits.slice(3);
  else if (digits.startsWith('0020')) digits = '0' + digits.slice(4);
  else if (digits.startsWith('20') && digits.length === 12) digits = '0' + digits.slice(2);

  return LOCAL_MOBILE.test(digits) ? '+20' + digits.slice(1) : null;
}

/** Formats an E.164 Egyptian mobile for display: `0101 234 5678`. */
export function formatEgyptianMobile(e164: string): string {
  const local = '0' + e164.replace(/^\+20/, '');
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}

/** Zod schema that validates and transforms input to E.164. */
export const egyptianMobileSchema = z.string().transform((value, ctx) => {
  const normalized = normalizeEgyptianMobile(value);
  if (!normalized) {
    ctx.addIssue({ code: 'custom', message: 'invalid_egyptian_mobile' });
    return z.NEVER;
  }
  return normalized;
});

function toWesternDigits(value: string): string {
  return value.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}
