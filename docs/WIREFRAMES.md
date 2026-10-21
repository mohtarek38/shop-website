# Wireframes (low fidelity)

> Status: **Draft v1** · Last updated: 2026-10-21
> Related: [PLAN.md](PLAN.md) · [BRAND.md](BRAND.md)

These describe **what is on each page and in what order**, not exact visuals. Visual mockups follow once the palette is chosen.

**Conventions**

- Layouts are written for **Arabic (RTL)**. "Start" = right side in Arabic, left in English.
- The storefront is **mobile-first**: blocks are listed in mobile order. Desktop notes describe how they rearrange.
- `[CTA]` = the single highlighted action of the screen (amber in palette B).
- 📞 = WhatsApp/phone contact entry point.

---

## Part 1: Storefront

### 1.0 Global layout

**Header (sticky)**

```
┌─────────────────────────────────────────────┐
│ ☰  [Logo]                    🔍   ♡   🛒(2) │   mobile
├─────────────────────────────────────────────┤
│ [ ابحث عن منتج، ماركة أو موديل...        ] │   search bar (expands on tap)
└─────────────────────────────────────────────┘
Desktop: [Logo] [── search ──] [Account] [Wishlist] [Cart] [ع/EN]
         Category nav row below: Refrigerators · Washers · TVs · ACs · Small appliances · Offers
```

- ☰ opens a drawer: categories tree, account, track order, language switch, contact.
- Language switch keeps you on the same page (`/ar/...` ↔ `/en/...`).

**Footer**

- Contact: phone, 📞 WhatsApp, address, hours (from settings)
- Links: About, FAQ, Track order, Returns policy, Terms, Privacy
- Payment methods shown: Cash on delivery · InstaPay · Vodafone Cash · Bank transfer
- Social icons · © year + legal name

**Floating:** 📞 WhatsApp button (bottom corner, end side), hidden on checkout.

---

### 1.1 Home `/`

1. **Hero banner carousel** (per-language images, max 3 slides, auto-advance off by default)
2. **Trust strip:** 🚚 Delivery across Egypt · 💵 Cash on delivery · ✅ Original warranty · 📞 Support
3. **Shop by category:** grid of category tiles with icon/image (2 columns mobile, 6 desktop)
4. **Offers:** horizontal scroll of product cards on sale
5. **Shop by brand:** logo row
6. **Best sellers / New arrivals:** product card rows
7. **Secondary banner** (optional)
8. **Why buy from us:** 3–4 short points + 📞 "Need help choosing? Talk to us"

**Product card (reused everywhere)**

```
┌───────────────────┐
│  [−9%]        ♡   │
│     (image 1:1)   │
│ Brand             │
│ Product name, max │
│ two lines…        │
│ 24,999 ج.م        │
│ ̶2̶7̶,̶5̶0̶0̶   ● In stock│
│ [ أضف للسلة ]     │  ← CTA (desktop: on hover/always; mobile: icon button)
│ ☐ Compare         │
└───────────────────┘
```

---

### 1.2 Category listing `/[category]`

1. Breadcrumb: Home › Kitchen › Refrigerators
2. Title + product count
3. **Toolbar:** [Filters (3)] [Sort: Most popular ▾] [Grid/List]
4. **Active filter chips:** `Samsung ✕` `No Frost ✕` `Clear all`
5. Product grid (2 columns mobile, 3–4 desktop)
6. Pagination (or "Load more")
7. Category description (SEO text, collapsed)

**Filters** (bottom sheet on mobile, start-side column on desktop)

- Price range (slider + min/max)
- Brand (checkboxes with counts)
- **Category attributes marked `is_filterable`**, e.g. for refrigerators: Capacity (range), No Frost (yes/no), Energy class (A++, A+, A), Colour
- Availability: In stock only
- Mobile: [Show 24 results] button at the bottom of the sheet

**Compare bar** (appears when ≥1 selected): `2 products selected [Compare] [Clear]`, max 4, same category only.

---

### 1.3 Product page `/[category]/[product-slug]`

Mobile order:

1. Breadcrumb
2. **Image gallery** (swipe, dots, tap to zoom)
3. Brand · Model number · ★ 4.5 (12 reviews)
4. **Name** (h1)
5. **Price block:** price, old price, `Save 2,501 ج.م`, "Prices include VAT"
6. **Variant selector** (colour swatches / capacity buttons). Price and stock update.
7. **Stock status:** ● In stock / ● Only 2 left / ○ Out of stock → [Notify me] (later)
8. Quantity stepper + **[CTA: أضف للسلة]**
9. 📞 **Ask about this product on WhatsApp** (pre-filled message with product name + link)
10. **Delivery estimate:** "Delivery to [Cairo ▾]: 2–4 days · 150 ج.م" (+ large-item note)
11. Key highlights: 3–5 bullet specs
12. **Tabs/accordions:** Description · Full specifications (table from category attributes) · Warranty · Reviews
13. ☐ Add to compare
14. Related products row

Desktop: gallery on the start side (60%), info column on the end side (40%) with sticky price + CTA. Tabs full width below.
Mobile: **sticky bottom bar** with price + CTA once the main button scrolls out of view.

---

### 1.4 Compare `/compare?ids=…`

- Columns = products (2–4), horizontally scrollable on mobile with the first column (labels) pinned
- Rows: image, name, price, [CTA], then every `is_comparable` attribute
- Toggle: **Show differences only**
- Remove product ✕ per column

---

### 1.5 Search results `/search?q=…`

- Same as category listing, plus a **category facet** at the top ("Refrigerators (8) · Freezers (2)")
- No results: suggestions ("Check spelling", popular categories) + 📞 "Tell us what you're looking for"
- Search box suggestions dropdown: products (image + name + price) and categories, as you type

---

### 1.6 Cart `/cart`

Also available as a **mini-cart drawer** after adding an item ("Added ✓ [View cart] [Checkout]").

1. Item rows: image, name, variant, unit price, quantity stepper, line total, remove
2. Warnings inline: "Only 1 left, quantity adjusted", "Price changed since you added this"
3. Coupon field (phase 5)
4. **Summary:** subtotal · delivery ("calculated at checkout") · discount · **total**
5. **[CTA: إتمام الطلب]**
6. Empty state: "Your cart is empty" + [Browse offers]

---

### 1.7 Checkout `/checkout` (single page, no account required)

Minimal header (logo + "Secure checkout"), no footer, no WhatsApp float.

1. **Contact:** full name · phone (01xxxxxxxxx) · email (optional, "for order updates")
   - Logged-in: pre-filled. Guest: small "Have an account? Log in" link.
2. **Delivery address:**
   - Governorate ▾ → Area ▾ (only areas we deliver to)
   - Street · Building · Floor · Apartment · Landmark
   - Has elevator? (Yes/No), shown when the cart has a large item
   - Delivery notes (optional)
   - Logged-in: choose a saved address or add new
3. **Delivery:** zone fee and ETA appear once the area is chosen ("Delivery in 2–4 days · 150 ج.م")
4. **Payment method** (radio cards):
   - 💵 **Cash on delivery**: "Pay when you receive your order"
   - 🏦 **Transfer** (InstaPay / Vodafone Cash / bank): "Account details shown after placing the order"
5. **Order summary** (collapsible on mobile): items, subtotal, delivery, discount, total, "includes VAT"
6. ☐ I agree to the terms and returns policy
7. **[CTA: تأكيد الطلب]**, with the note "Our team will call you to confirm before shipping"

Validation inline, Arabic/English messages; the phone is validated as Egyptian mobile.

---

### 1.8 Order placed `/order/[number]/placed`

- ✅ "Order **26-000123** received"
- "We'll call you on 010… to confirm"
- **If transfer:** account details card (InstaPay ID / wallet number / bank IBAN with copy buttons), amount to transfer, **[Upload receipt]**, 📞 "Or send the receipt on WhatsApp"
- Order summary
- [Track your order] · [Continue shopping]
- Offer: "Create an account with this phone to track orders easily" (sets password only)

---

### 1.9 Track order `/track`

- Form: order number + phone → result
- **Status timeline:** Placed → Confirmed → Preparing → Out for delivery → Delivered (with dates/times; failed/cancelled shown clearly)
- Payment status (and receipt upload if transfer is pending/rejected)
- Items + totals + address (partially masked)
- [Print invoice] (after delivery) · 📞 Contact support about this order

---

### 1.10 Account `/account`

- **Log in / Register:** tabs. Phone + password (default) · email + password · [Continue with Google]
- **My orders:** list with status badge → order detail (same as tracking)
- **Addresses:** list, add/edit/delete, set default
- **Wishlist** (phase 5)
- **Profile:** name, email, change password, language

### 1.11 Static pages

About · FAQ (accordion) · Returns policy · Terms · Privacy · Contact (phones, WhatsApp, map link, hours)

---

## Part 2: Staff dashboard

### 2.0 Shell

```
┌──────────┬─────────────────────────────────────────┐
│ [Logo]   │  🔍 Search orders/products…   🔔 3  ع/EN  👤 │
│          ├─────────────────────────────────────────┤
│ Home     │                                         │
│ Orders 5 │             page content                │
│ Products │                                         │
│ Inventory│                                         │
│ Customers│                                         │
│ Delivery │                                         │
│ Promos   │                                         │
│ Content  │                                         │
│ Reports  │                                         │
│ Settings │                                         │
└──────────┴─────────────────────────────────────────┘
```

- Sidebar on the start side (right in Arabic), collapsible; a drawer on mobile.
- **Menu items appear only if the user has the permission.**
- Badges: orders awaiting confirmation, transfers awaiting verification.
- Global search: order number, phone, SKU, product name.

---

### 2.1 Home

1. **Action cards** (click → filtered list): Awaiting confirmation call · Transfers to verify · Ready to assign driver · Failed deliveries · Low stock items
2. **Today:** orders placed, revenue, delivered, cash with drivers
3. Chart: orders and revenue, last 30 days (manager+)
4. Latest orders table (10)

### 2.2 Orders list

- **Status tabs:** All · Placed · Confirmed · Preparing · Out for delivery · Delivered · Problems (failed, needs attention) · Cancelled
- Filters: date range, payment method, payment status, zone/governorate, driver, location
- Table: number · date · customer + phone · area · items count · total · payment (badge) · status (badge) · assigned driver
- Bulk actions: assign driver, print delivery slips
- Row click → order detail

### 2.3 Order detail

```
Header: #26-000123 · [Status badge] · [Payment badge] · placed 2h ago
        Primary next action button, e.g. [✓ Confirm order] / [Mark as paid] / [Assign driver]
        ⋯ menu: Edit, Cancel, Print invoice, Print delivery slip
```

Two columns (stack on mobile):

- **Main:** items (editable before shipping: qty, remove, add), totals, **timeline** (status history + audit), **internal notes** (add note)
- **Side:** customer card (name, phone 📞 call / WhatsApp, previous orders count, ⚠ blocked flag), shipping address (map link, elevator), **payment** panel (method, receipt image, [Verify] [Reject]), **fulfilment** (stock location ▾, stock check per item), **shipment** (driver/courier, tracking number, attempts)

**Confirm-call dialog:** outcome (Confirmed / No answer / Cancelled by customer / Fake) + note → transitions accordingly.

### 2.4 Products list

- Search, filters (category, brand, status, stock), table with thumbnail, name, SKU, price, stock (total), status
- Actions: [+ New product], **Import CSV/Excel**, **Export**
- Inline quick edit for price and status

### 2.5 Product editor

Sections (single scrolling page with sticky section nav):

1. **Basics:** category ▾ (changing it reloads the spec form), brand ▾, slug, status, large item ☐, warranty months
2. **Name & description:** `[العربية] [English]` tabs
3. **Specifications:** form generated from the category's attribute template
4. **Variants:** table: options, SKU, model, price, sale price + dates, dimensions, active
5. **Images:** drag-and-drop upload, reorder, set main, alt text, assign to variant
6. **Stock:** per variant × location, with [Adjust] (requires a reason)
7. **SEO:** title/description per language, preview of the Google result

- Sticky footer: [Save draft] [Publish]

### 2.6 Categories & attributes

- Tree (drag to reorder) · edit name/slug/image
- **Attribute template editor:** key, label (ar/en), type, unit, options, filterable/comparable/required flags

### 2.7 Inventory

- Stock table: variant × location, on hand / reserved / available, low-stock highlight
- [Adjust] · [Transfer between locations] · [Receive stock]
- Movements log (filter by product, location, type, date)

### 2.8 Customers

- List: name, phone, orders count, total spent, last order, blocked flag
- Detail: orders, addresses, notes, [Block] with reason

### 2.9 Delivery

- **Assignment board:** columns per driver (+ "Unassigned"), drag orders onto a driver, filter by zone/date
- **Drivers:** list, active toggle, today's load, **cash on hand**
- **Cash settlement:** pick a driver → unsettled shipments with amounts → [Settle X ج.م]
- **Zones:** zones with fees/thresholds/ETA, area-to-zone mapping per governorate

### 2.10 Driver view (mobile, role: driver)

```
┌──────────────────────────┐
│ Today · 6 deliveries     │
│ Cash on hand: 48,500 ج.م │
├──────────────────────────┤
│ #26-000123   Nasr City   │
│ Ahmed M. · 4th floor 🛗  │
│ 💵 Collect 24,999 ج.م    │
│ [📞 Call] [🗺 Map]        │
│ [✓ Delivered] [✕ Failed] │
├──────────────────────────┤
│ #26-000124 …             │
└──────────────────────────┘
```

- Delivered → confirm the cash amount collected
- Failed → reason (no answer, wrong address, refused, reschedule) + note
- Large touch targets; works on a cheap Android phone over 3G/4G

### 2.11 Promotions · Content · Reports

- **Coupons:** list + editor (type, value, limits, dates, targets)
- **Content:** banners (upload ar/en image, link, schedule), pages (markdown editor ar/en), FAQ
- **Reports:** sales by period, top products, orders by governorate/zone, payment-method split, driver performance, cancellations by reason; export CSV

### 2.12 Settings (owner/manager)

- Store info, contact numbers, WhatsApp, hours
- **Transfer accounts** (InstaPay, wallets, bank): shown to customers
- VAT rate, order number prefix, staff notification emails
- **Users:** invite staff, assign roles, deactivate, revoke sessions
- **Roles:** permission matrix editor
- **Audit log:** filterable list

### 2.13 Print layouts

- **Invoice (A4):** logo + legal name, invoice/order number, dates, customer + address, items table, subtotal, delivery, discount, total, VAT included, payment method, footer with returns policy summary
- **Delivery slip (A5):** order number (large), customer name + phone, full address + landmark + floor/elevator, items + quantities, **amount to collect** (COD) or "PAID", signature line
