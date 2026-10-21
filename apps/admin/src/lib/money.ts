import { egpToPiasters, piastersToEgp } from '@shop/contracts';

/** Piasters → the text shown in an EGP input (`2499900` → `"24999"`, `1050` → `"10.5"`). */
export function piastersToInput(piasters: number | null | undefined): string {
  return piasters === null || piasters === undefined ? '' : String(piastersToEgp(piasters));
}

/**
 * EGP input text → piasters. Accepts Arabic digits, thousands separators and up to two
 * decimals. Returns `null` for blank input and `NaN` for anything unparseable.
 */
export function inputToPiasters(value: string): number | null {
  const normalized = value
    .trim()
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[٬,\s]/g, '')
    .replace('٫', '.');
  if (normalized === '') return null;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return Number.NaN;
  return egpToPiasters(Number(normalized));
}
