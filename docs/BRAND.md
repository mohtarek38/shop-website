# Brand System

> Status: **Draft**. Name: _not decided_ · Palette: _awaiting choice (B proposed)_ · Last updated: 2026-10-21
> How the brand is wired into the code: [ADR-0021](adr/0021-brand-as-configuration.md)

Everything brand-related lives in **one package** (`packages/brand`). The shop name, logo and colours can be changed later by editing that package only. No page or component hard-codes them.

---

## 1. Name: placeholder until decided

| Field | Placeholder | Where it appears |
|---|---|---|
| `name.ar` | `اسم المتجر` | Header, footer, page titles, emails, invoices, WhatsApp messages |
| `name.en` | `Shop Name` | Same, English locale |
| `shortName` | `Shop` | PWA home-screen label, favicon alt, small spaces |
| `tagline.ar` / `tagline.en` | `أجهزة منزلية وكهربائية` / `Home & electric appliances` | Home hero, meta descriptions |
| `legalName` | _(empty)_ | Invoices, terms page (commercial registry name) |
| `domain` | _(empty)_ | Canonical URLs, emails, sitemap |

**Safety net:** a production build **fails** if any placeholder value is still present (a check in `packages/brand`). Placeholders can't accidentally go live.

### Naming checklist (for when you decide)
- [ ] Easy to say and spell in **both** Arabic and English (customers will say it on the phone)
- [ ] `.com` domain available (check on Cloudflare Registrar)
- [ ] Facebook / Instagram / TikTok handles available
- [ ] Not too close to existing Egyptian appliance retailers
- [ ] Not tied to one product type (you may sell more than appliances later)
- [ ] Optional: search the Egyptian trademark database (ITDA) before printing anything

---

## 2. Colour palette

Three directions were compared visually. **B: Teal home** is proposed: warm and home-oriented, stands out from the many blue-heavy electronics shops, with a high-visibility amber "Add to cart" button.

### 2.1 Brand colours (per option)

| Token | A: Trust blue | **B: Teal home** | C: Graphite volt | Used for |
|---|---|---|---|---|
| `primary` | `#1E4FA3` | **`#0F6E64`** | `#1F2328` | Header, links, active states, focus ring |
| `primary-hover` / dark | `#163A78` | **`#0A4F48`** | `#3A4150` | Hover, prices, headings accent |
| `primary-fg` | `#FFFFFF` | **`#FFFFFF`** | `#FFFFFF` | Text on primary |
| `primary-soft` | `#EEF3FB` | **`#E7F4F1`** | `#F1F2F4` | Tinted backgrounds, image wells, selected rows |
| `cta` | `#F28C28` | **`#F5B731`** | `#C6F432` | **One** main action per screen: Add to cart, Place order |
| `cta-fg` | `#2B1600` | **`#3D2A00`** | `#1F2328` | Text on CTA (dark text; white fails contrast on these) |

### 2.2 Shared neutrals & semantic colours (same for every option)

| Token | Value | Used for |
|---|---|---|
| `background` | `#FFFFFF` | Page |
| `surface` | `#F7F8FA` | Cards, sections |
| `border` | `#E3E6EB` | Dividers, inputs |
| `text` | `#1A1D21` | Body text |
| `text-muted` | `#5B6470` | Secondary text |
| `success` | `#1E7F4F` | In stock, delivered, paid |
| `warning` | `#B26A00` | Low stock, awaiting verification |
| `danger` | `#C62828` | Errors, out of stock, cancelled |
| `info` | `#1F6FB2` | Info notes, "placed" status |
| `sale` | `#C62828` | Discount badges, old-price strikethrough is `text-muted` |

All text/background pairs must meet **WCAG AA** (4.5:1 for body text, 3:1 for large text and UI). This is checked when tokens are finalized.

### 2.3 Order status colours (dashboard + tracking page)

| Status | Tone |
|---|---|
| placed | info |
| confirmed | primary |
| preparing | warning |
| out_for_delivery | primary |
| delivered | success |
| delivery_failed | danger |
| cancelled | neutral (muted) |
| returned | neutral (muted) |
| payment: awaiting_verification | warning |
| payment: rejected | danger |

### 2.4 Dark mode
Not in v1 for the storefront. The dashboard may add it later. Tokens are CSS variables, so dark mode means adding a second set of values, with no component changes.

---

## 3. Typography

| Item | Choice |
|---|---|
| Family | **IBM Plex Sans Arabic** (Arabic + Latin in one family), self-hosted via `next/font` / Fontsource |
| Weights | 400 (body), 500 (labels, buttons), 700 (headings, prices) |
| Digits | Western (`0-9`) in both locales |
| Base size | 16px body (never below 14px on mobile; Arabic needs room) |
| Line height | 1.7 for Arabic body text, 1.5 for English |

**Type scale (rem):** 0.75 · 0.875 · 1 · 1.125 · 1.25 · 1.5 · 1.875 · 2.25

A separate display font for headings can be added later through the brand package without touching components.

---

## 4. Logo

### 4.1 Until a logo exists
The `<Logo />` component (one per app, reading `packages/brand`) renders:
- the **mark**: a neutral placeholder icon (house + plug), and
- the **wordmark**: the shop name as styled text in the current locale.

When real logo files are added to `packages/brand/assets/`, `<Logo />` uses them automatically.

### 4.2 Files needed (drop-in slots)
| File | Purpose |
|---|---|
| `logo-full.svg` | Mark + wordmark, horizontal (header) |
| `logo-full-ar.svg` | Arabic wordmark variant (if different) |
| `logo-full-inverse.svg` | White version for dark/coloured backgrounds |
| `logo-mark.svg` | Symbol only (mobile header, app icon) |
| `favicon.svg` + `favicon.ico` | Browser tab |
| `apple-touch-icon.png` (180×180) | iOS home screen |
| `icon-192.png`, `icon-512.png` | PWA / Android |
| `og-default.png` (1200×630) | Default social share image |

### 4.3 Brief for whoever designs it
- Must work at **16px** (favicon) and in **one colour**.
- Mark ideas: (1) house outline + plug/power symbol; (2) rounded "appliance door" shape containing the initial letter; (3) wordmark only, with a distinctive letter.
- Two lockups: horizontal (header) and stacked (social avatar).
- Arabic and English wordmarks should feel like one family.
- Deliver SVG sources + exports from §4.2.
- Low-cost options: design it yourself in Figma (free) or Canva, or hire on **Khamsat / Mostaql** (Arab freelance platforms) or Upwork.

---

## 5. UI style

| Aspect | Rule |
|---|---|
| Corners | 8px for controls, 12px for cards, full-round for badges/pills |
| Shadows | Minimal: one soft shadow for floating elements (dropdowns, sticky cart bar) |
| Spacing | 4px base grid (Tailwind default) |
| Icons | **Lucide** (shadcn/ui default), outline, 20px. Direction-aware icons (arrows, chevrons) flip in RTL |
| Buttons | One `cta` button per screen; others `primary` outline or ghost |
| Product images | White or very light background, **1:1 square**, at least 1200px, product centred, no watermark |
| Banners | Can contain text, so they're uploaded **per language** (see DATABASE.md `banner`) |
| Motion | Subtle (150–200ms), respects `prefers-reduced-motion` |

---

## 6. Voice & tone

| | Arabic | English |
|---|---|---|
| UI text (buttons, forms, errors) | Simple Modern Standard Arabic (فصحى مبسطة), short and clear | Plain, friendly, sentence case |
| Marketing (banners, social, WhatsApp) | Egyptian colloquial allowed | Same tone, casual |
| Address the customer as | أنت (singular, neutral) | you |
| Errors | Say what happened + what to do: "رقم الهاتف غير صحيح. أدخل رقمًا مثل 01012345678" | "That phone number isn't valid. Use a number like 01012345678" |
| Avoid | Overly formal phrasing, ALL-CAPS English, exclamation marks in system messages | |

---

## 7. Decided vs pending

| Item | Status |
|---|---|
| Brand lives in one package, swappable | ✅ Decided (ADR-0021) |
| Typography | ✅ IBM Plex Sans Arabic |
| Neutrals, semantic & status colours | ✅ Decided |
| Brand colours | ⏳ Choose A / **B** / C |
| Name | ⏳ Placeholder |
| Logo | ⏳ Placeholder mark + text wordmark |
| Voice & tone | ✅ Proposed (review) |
