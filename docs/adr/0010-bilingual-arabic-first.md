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
