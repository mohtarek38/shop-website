/**
 * English slug from a name: `Samsung 55" 4K Smart TV` → `samsung-55-4k-smart-tv`.
 * Arabic text has no Latin letters, so it produces an empty slug (the user types one).
 */
export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
    .replace(/-+$/, '');
}
