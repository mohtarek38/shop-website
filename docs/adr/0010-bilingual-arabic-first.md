# ADR-0010: Bilingual, Arabic-first (RTL)

- **Status:** Accepted
- **Date:** 2026-10-19

## Context

Customers are in Egypt. Arabic is primary, English secondary. Staff use both. Adding RTL support after the fact is expensive.

## Decision

- **Arabic is the default locale** (`/ar`), English at `/en`, with `hreflang` alternates. Slugs are English in both locales.
- **Logical CSS only** (Tailwind `ms-/me-/ps-/pe-/start-/end-`); a lint rule bans physical left/right utilities.
- Translatable DB fields are `jsonb` `LocalizedText` `{ ar: string, en?: string }`. Arabic is required; English falls back to Arabic.
- UI strings: next-intl (web), i18next (admin). The dashboard language is stored per user.
- **Western digits** in both locales (`ar-EG-u-nu-latn`). Currency is shown as `12,500 ج.م` / `EGP 12,500`.
- Font: IBM Plex Sans Arabic (Arabic + Latin).

## Consequences

- RTL and LTR work from day one with one stylesheet.
- Adding a third language means new message files and a new key in `LocalizedText`, with no schema change.
- Every content form in the dashboard has ar/en tabs.

## Alternatives considered

- **Separate translation tables:** more joins and more complexity for two languages.
- **Columns per language (`name_ar`, `name_en`):** a schema change for every new language.

## Implementation notes (2026-10-21)

- **`/` always opens Arabic.** Browser-language detection is off (`localeDetection: false`), so links and SEO are predictable; visitors switch with the header button, which keeps them on the same page (`/ar/x` ↔ `/en/x`).
- **Dashboard language follows the account.** Staff change it in the top bar; it's saved with `PATCH /api/v1/me` and applied on every device after sign-in. The login page uses the last language used on that device.
- **RTL lint rule:** `@shop/config/eslint/rtl` rejects physical Tailwind classes (`ml-`, `pr-`, `text-left`, …) in both apps.
- next-intl is wired with a direct `next-intl/config` alias instead of `next-intl/plugin`, which loads a native compiler (`@swc/core`) only needed for an optional message-extraction feature.
