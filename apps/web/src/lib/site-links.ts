/**
 * Links shown in the header, mobile menu and footer. Until a page is built, its path is
 * listed in PLANNED_PAGES and shows a "coming soon" page instead of a 404.
 */

/** Placeholder categories until the catalog exists (Phase 2). Keys match `nav.*` messages. */
export const CATEGORY_LINKS = [
  'refrigerators',
  'washers',
  'tvs',
  'acs',
  'cookers',
  'small',
  'offers',
] as const;

/** Footer help links: message key → path. */
export const FOOTER_LINKS = {
  trackOrder: '/track-order',
  returns: '/returns',
  faq: '/faq',
  about: '/about',
  terms: '/terms',
  privacy: '/privacy',
} as const;

/** Header shortcuts. */
export const ACCOUNT_LINKS = {
  account: '/account',
  wishlist: '/wishlist',
  cart: '/cart',
} as const;

export const SEARCH_PATH = '/search';

/** Pages that are linked from the site but not built yet (first path segment). */
export const PLANNED_PAGES: ReadonlySet<string> = new Set(
  [
    ...CATEGORY_LINKS.map((key) => `/${key}`),
    ...Object.values(FOOTER_LINKS),
    ...Object.values(ACCOUNT_LINKS),
    SEARCH_PATH,
  ].map((path) => path.slice(1)),
);
