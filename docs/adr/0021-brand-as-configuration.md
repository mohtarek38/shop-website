# ADR-0021: Brand as configuration (`packages/brand`)

- **Status:** Accepted
- **Date:** 2026-10-21

## Context
The shop name, logo and final colours aren't decided yet, but development must start. These values appear across both frontends, emails, invoices, SEO metadata and the PWA manifest. Hard-coding them would mean a search-and-replace across the codebase later.

## Decision
Create a `packages/brand` package as the **single source of brand identity**:

```
packages/brand/
├── brand.config.ts      # name {ar,en}, shortName, tagline {ar,en}, legalName, domain, themeColor
├── tokens.css           # colour, radius and font CSS variables (design tokens)
├── tailwind-preset.ts   # maps tokens → Tailwind theme (used by web + admin)
├── assets/              # logo slots (see BRAND.md §4.2); placeholders until real files exist
└── index.ts             # typed exports + assertNoPlaceholders()
```

Rules:
1. Components never use raw hex colours or the shop name. They use tokens (`bg-primary`, `text-cta-fg`) and `brand.name[locale]`.
2. Each app has a `<Logo />` component that renders real logo files if present, otherwise a placeholder mark + text wordmark.
3. shadcn/ui CSS variables are mapped to brand tokens in `tokens.css`, so all components follow the palette.
4. `assertNoPlaceholders()` runs in production builds and **fails the build** if the name or domain is still a placeholder.

**Build-time vs runtime:**

| Build-time (`packages/brand`, needs a redeploy) | Runtime (`setting` table, editable in the dashboard) |
|---|---|
| Name, tagline, legal name, domain | Phone numbers, WhatsApp number, address |
| Logo files, favicon, colours, fonts | Transfer account details, VAT rate |
| | Social media links, store opening hours |

Identity rarely changes and is baked into SEO/PWA assets, so it's build-time. Contact and operational details change more often and staff should edit them without a developer.

## Consequences
- Choosing the name, logo or palette later = editing one package + redeploying.
- A rebrand or a second store front would be a new brand config, not a code fork.
- Slight indirection: developers must use tokens and config instead of literals (enforced by a lint rule banning raw hex in app code).

## Alternatives considered
- **Everything in the DB settings:** name/logo would be editable without a deploy, but they're used at build time (metadata, manifest, static assets) and would add runtime lookups everywhere.
- **Env variables for brand values:** fine for strings, but awkward for logos, tokens and bilingual values.
