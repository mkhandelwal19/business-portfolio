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
2. **`ecommerce-lux`** — rotatable product viewer with variant/colour switching.
   The most reusable, since it maps to any physical-product client.

Each is a **self-contained page** like `jewellery-lux`, not a 10-page site. The
flagship's job is to win the meeting, not to be a complete website.

---

## 4. How this maps to pricing

| Tier | Price | Demo shown | What sells it |
|------|-------|-----------|---------------|
| Starter | ₹12,999 | The eight standard demos, **with Track A applied** | Fast, modern, complete, live in 10 days |
| Business | ₹24,999 | `jewellery-lux` + the two new flagships | One signature 3D moment on the homepage |
| Premium | ₹44,999 | *To be built* — see below | Full interactive configurator |

The ₹44,999 tier currently has no demo of its own. The obvious candidate is a
**product configurator**: choose metal, stone, size, and watch the piece rebuild
in real time, with live pricing. That is a genuinely different product from "a
website with a 3D hero", and it is defensible at that price.

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

## 6. Sequencing

Ordered by value per unit of effort, not by ambition.

1. **Track A uplift** on `demo.css` / `demo.js` — all eight demos improve at once.
2. **`3d-core.js` extraction** from `jewellery-lux`, refactoring the flagship onto it.
3. **`realestate-lux`** — the highest-ticket category.
4. **`ecommerce-lux`** — the most reusable.
5. **Premium configurator** — only once a client is actually asking for it.

Steps 1 and 2 are worth doing regardless. Steps 3–5 should wait for demand;
building three more flagships nobody has asked for is the same trap as building
eight.

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
