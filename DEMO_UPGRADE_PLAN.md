# Demo upgrade plan — "next-gen" templates

Status: **plan only, nothing built.** Written 5 September 2026.

The brief was: take the eight live demos linked in the footer and make them 3D,
next-gen, advanced UI. This document argues for a different shape of the same
goal, and sets out what to build in what order.

---

## 1. What exists today

| Demo | Pages | Weight | 3D | Category-specific pages |
|------|-------|--------|-----|------------------------|
| restaurant | 10 | 256 KB | — | booking, menu, team |
| healthcare | 10 | 248 KB | — | appointments, doctors, health-tips, services |
| realestate | 10 | 248 KB | — | calculator, properties, team |
| salon | 10 | 236 KB | — | booking, services, team |
| yoga | 10 | 232 KB | — | booking, classes, teachers |
| boutique | 10 | 228 KB | — | collections, lookbook, shop |
| jewellery | 10 | 224 KB | — | bridal, care, collections, custom |
| ecommerce | 10 | 216 KB | — | cart, categories, products |
| **jewellery-lux** | **1** | **72 KB** | **WebGL** | flagship, self-contained |

All eight share `demo.css` (56 KB) and `demo.js` (20 KB), which already carry a
real component system — 16 working behaviours including filtering, listing sort,
scroll-spy jump nav, an EMI calculator, a booking calendar, FAQ accordions and
WhatsApp prefill. **That shared layer is the most valuable asset here** and the
plan below leans on it hard.

---

## 2. The recommendation: do not make all eight 3D

Four reasons, in order of how much they matter.

### It would destroy the thing that makes the flagship worth ₹25,000

`jewellery-lux` exists to justify a higher tier. If every demo is 3D, there is
nothing to move a client *up* to, and the flagship becomes the baseline you are
expected to deliver for ₹12,999. The 3D is only worth money while it is scarce.

### 3D does not sell every category

3D earns its weight when **the product is the purchase decision** and the
customer wants to inspect it. Ranked honestly:

| Category | Does 3D actually help? | Why |
|----------|------------------------|-----|
| Jewellery | **Strong** | Inspecting the piece *is* the buying process. Already proven by the flagship. |
| Real estate | **Strong** | Floor plans and walkthroughs are the product. Highest ticket clients. |
| Ecommerce / D2C | **Good** | Rotatable product = fewer returns; a real commercial argument, not decoration. |
| Boutique | **Moderate** | Fabric drape is hard to fake convincingly without real garment assets. |
| Restaurant | **Weak** | Food photography outsells a rotating 3D thali. Photos are cheaper and better. |
| Salon | **Weak** | Booking speed and price clarity are what convert. |
| Yoga | **Weak** | Schedule and trial-class friction, not visuals. |
| Healthcare | **Actively harmful** | A spinning stethoscope reads as unserious. Clinics sell trust, credentials, proximity. |

Building 3D into a clinic template is not a neutral cost — it makes the demo
*worse* at its job.

### It breaks the performance claim now on the homepage

The hero copy just shipped with *"engineered to a 95+ performance standard."*
That claim is now on the live site.

- A standard demo page: **~100 KB** (HTML + shared CSS/JS, gzipped)
- With three.js: **~250 KB** — **150% heavier**

On good 4G that is a fraction of a second. On the congested 3G that a lot of
Indian small-business customers actually browse on, it is several seconds of
blank canvas before anything paints. Adding that to 80 pages would make the
homepage claim false, which matters more than the visual.

### The effort is a rebuild, not a completion

The flagship is 72 KB of bespoke, hand-written code for **one page**. Eight
categories × 10 pages at that standard is not "completing the work" — it is
rebuilding the entire demo estate from scratch.

---

## 3. Proposed shape: two tracks

### Track A — "next-gen" uplift for all eight, without 3D

Most of what reads as *modern and expensive* on a 2026 site is not 3D. It is
motion, depth and typography. All of this lands in the shared `demo.css` /
`demo.js`, so **one change ships to all 80 pages at once.**

| Item | What it does | Weight |
|------|--------------|--------|
| Scroll-driven animation | Native CSS `animation-timeline: view()` — parallax, reveal, progress, with zero JS | 0 KB |
| View Transitions API | Cross-fade/morph between demo pages, so a static site feels like an app | ~0 KB |
| Real depth | Layered shadows, gradient meshes, glass surfaces, grain | ~2 KB CSS |
| Typographic pass | Fluid `clamp()` scale, tighter display tracking, better rhythm | 0 KB |
| Cursor-reactive tilt | Subtle 3D transform on cards — reads as 3D, is not | ~1 KB |
| Sticky section transitions | Panels that pin and swap on scroll | ~2 KB |

**This is the highest-leverage work in the document.** It costs almost nothing
in bytes, applies to all eight demos simultaneously, protects the performance
claim, and closes most of the perceived gap with the flagship.

### Track B — genuine 3D, for the categories that earn it

Build **two** more flagships, not eight. Suggested order:

1. **`realestate-lux`** — 3D floor-plan walkthrough, unit selector, orbit around a
   building massing model. Highest ticket clients, clearest ROI story.
2. **`boutique-lux`** — fabric/drape treatment and a 3D lookbook carousel.
   *(Was `ecommerce-lux`; reassigned because the premium tier in §5A now owns
   ecommerce outright and the two would have duplicated each other.)*

Each is a **self-contained page** like `jewellery-lux`, not a 10-page site. The
flagship's job is to win the meeting, not to be a complete website.

---

## 4. How this maps to pricing

| Tier | Price | Demo shown | What sells it |
|------|-------|-----------|---------------|
| Starter | ₹12,999 | The eight standard demos, **with Track A applied** | Fast, modern, complete, live in 10 days |
| Business | ₹24,999 | `jewellery-lux` + one new flagship | One signature 3D moment on the homepage |
| Premium | ₹44,999 | **`commerce/` — a store that actually takes money** | It sells, rather than just describes |

The premium tier is a **commerce platform** (decided 5 Sep 2026). Full spec in
§5A. This is a better tier-three than the configurator originally proposed here,
because the jump is categorical rather than cosmetic: tiers one and two are
brochures, tier three transacts.

**Consequence for Track B:** the premium tier owns ecommerce, so building
`ecommerce-lux` as a Track B flagship would duplicate it. Track B's second
flagship should become **`boutique-lux`** instead — the next best 3D fit, and a
category the premium build does not touch.

---

## 5. Technical approach for Track B

Learn from `jewellery-lux`, which got two things right and one thing wrong.

**Keep:**
- Self-contained page — no `demo.css` / `demo.js` inheritance to fight
- Lazy, gated three.js load: only when WebGL exists, motion is not reduced, and
  the connection is not `save-data`/2G
- A hand-drawn SVG fallback that stands on its own rather than looking broken
- Procedural geometry and a painted environment map — no downloaded assets

**Change:**
- Extract the shared parts of the flagship (`makeStage`, the studio environment,
  the drag/inertia controller, `frame()` auto-centring) into a
  **`flagship/3d-core.js`** module. Three flagships hand-copying that code will
  drift, and the same bug will need fixing three times.
- Add a visual check to `npm test`. The current suites are DOM-only and cannot
  see a gem rendering as white plastic or a ring floating above its band — both
  real bugs from this build that only a screenshot caught. Playwright would
  cover this.

---

## 5A. Premium tier — `commerce/`, a store that actually takes money

Decided 5 September 2026. Build **after** Track A and Track B.

### What separates it from the ₹24,999 tier

Tiers one and two are brochures — beautiful, fast, and they describe a business.
This one **transacts**. That is a categorical jump, which is why it holds a
higher price without argument.

The existing `ecommerce/` demo has a cart *page* but no cart *logic* — it is a
static mockup. The premium demo has to be genuinely clickable end to end, or it
demos worse than the thing it is meant to upsell from.

### Scope of the demo

| Area | What it does |
|------|--------------|
| Catalogue | Real search, filter, sort — not the decorative versions in `demo.js` |
| Product page | 3D viewer reusing `3d-core.js` from Track B, variant + colour switching |
| Cart | Persistent across reloads and devices |
| Checkout | Razorpay in **test mode**, so the demo is fully clickable without real money |
| Order confirmation | Email via the existing `worker/` Zoho SMTP path |
| Customer account | Login, order history, re-order |
| Owner admin | Products, stock levels, orders, order status |

### Architecture — every piece already exists or is already chosen

```
Static front end  →  GitHub Pages          (same as the rest of the site)
Data / auth       →  Supabase              (already chosen in PHASE2_ROADMAP.md)
Payments          →  Razorpay              (UPI, cards, netbanking — the Indian default)
Server logic      →  Cloudflare Worker     (extends the existing worker/)
Order email       →  Zoho SMTP             (already working in worker/)
```

**No new vendor is introduced.** The Worker already sends mail over Zoho SMTP;
it gains order creation, Razorpay signature verification and a payment webhook.
Supabase was already the chosen backend for the Phase 2 admin portal, so the
premium tier and that portal share one database rather than competing.

Payment signature verification **must** happen in the Worker, never in the
browser. A client-side "payment succeeded" check is trivially forged.

### Two commercial risks — read before quoting anyone

**1. A store is an operational relationship, not a delivery.** A brochure site
ships and is done. A store generates failed payments, stock discrepancies,
refund requests, delivery disputes and "why is my order not showing" messages —
forever. Sold as a flat ₹44,999 with no retainer, the support tail can make it
the least profitable thing on the price list.

*Recommendation:* attach a mandatory maintenance retainer (₹2,000–4,000/month is
a reasonable opening range — Mayank's call) covering support, stock help and
platform updates. Quote it as part of the tier, not an upsell.

**2. Recurring costs land on someone.** Be explicit in writing about which:

| Cost | Who pays | Note |
|------|----------|------|
| Razorpay fees | Client | ~2% + GST per domestic transaction. **Verify current rates before quoting** |
| Supabase | Client or absorbed | Free tier is real but has limits; a busy store may need the paid tier |
| Domain + hosting | Client | Already the policy — registered in their name |
| Support / updates | Client | The retainer above |

The site already promises *"you own everything"* and *"never locked in."* Both
must stay true here: the Supabase project and Razorpay account should be in the
**client's** name, exactly as domains already are.

### Legal, and non-negotiable for a store

Taking payments raises obligations a brochure site does not have. Required
before any real store goes live: **shipping policy, refund/cancellation policy,
terms of service, privacy policy**, and GST-compliant invoicing. Razorpay
requires several of these before it will activate an account, so this is a
launch blocker, not a nicety. Build them into the demo as real pages.

---

## 6. Sequencing

Ordered by value per unit of effort, not by ambition.

1. **Track A uplift** on `demo.css` / `demo.js` — all eight demos improve at once.
2. **`3d-core.js` extraction** from `jewellery-lux`, refactoring the flagship onto it.
3. **`realestate-lux`** — the highest-ticket category.
4. **`boutique-lux`** — second flagship.
5. **`commerce/`** — the ₹44,999 store. §5A.

Steps 1–2 are pure leverage and worth doing regardless. Step 5 is the largest
single piece of work in this document by a wide margin — it is the only one with
a backend, a payment provider and a legal surface — so it must not start until
1–4 are shipped and stable.

---

## 7. Risks

- **Track A regressions.** `demo.css` and `demo.js` are shared by 80 pages, so a
  mistake breaks everything at once. Change behind a class, and check one page
  per category before pushing.
- **Browser support.** `animation-timeline` and View Transitions are progressive
  enhancements — they must degrade to a static, correct page, not a broken one.
- **Flagship sprawl.** Three self-contained pages that each duplicate the 3D
  code will drift. `3d-core.js` before the third flagship, not after.
- **Scarcity.** Every category that gains 3D reduces what the ₹24,999 tier is
  worth. Two more flagships is a ceiling, not a starting point.
