# Next session — Track A, Track B, and the ₹44,999 tier

Written 5 September 2026. Everything described as "done" below is **live on
netloom.in** and verified byte-identical to the repo.

> **Working rule for the next session: do not push until the very end.**
> Build all three pieces locally, verify, then commit and push once. GitHub
> Pages redeploys on every push to `main`, and the site is being shown to
> prospects — a half-finished Track A going live mid-session is the thing to
> avoid.

---

## 0. Read this before touching anything

Five things that will cost you an hour each if you learn them the hard way.

1. **`node build-routes.js` after EVERY `index.html` edit.** `/work`, `/about`,
   `/services`, `/pricing` and `/contact` are generated clones of `index.html`
   with swapped meta. Edit them by hand and the next build silently overwrites
   you. `npm run build` does the same thing.

2. **Every file is CRLF.** Any script doing string replacement must normalise
   line endings or every multi-line match returns 0 hits. The pattern used
   throughout this repo's tooling:
   ```js
   const NL = s.indexOf('\r\n') > -1 ? '\r\n' : '\n';
   find = find.split('\n').join(NL);
   ```

3. **`index.html` has ONE giant inline `<script>`.** A top-level throw anywhere
   in it silently kills every IIFE after that point. The hero Preview button
   shipped dead twice because "the markup is present" and "the script parses"
   both passed while the button did nothing. `npm test` asserts
   `window.__netloomOpenPreview` is defined specifically to catch this.

4. **`npm test` before every commit.** 33 jsdom assertions across the preview
   modal and the `?biz=` / `?embed=1` demo path. Takes about a second.

5. **DOM tests cannot see rendering.** They will not catch a gem that renders as
   white plastic, a ring floating above its band, or a badge detached from its
   mockup — all real bugs from this build that only a screenshot caught. For any
   visual work, look at it.

   **You can look at it. Headless Chrome renders WebGL here.** This is worth
   the two minutes to set up, and it is how every 3D bug listed below was
   found:

   ```bash
   # serve the repo (any static server), then:
   chrome --headless=new --enable-unsafe-swiftshader --use-angle=swiftshader \
          --hide-scrollbars --window-size=1280,860 --virtual-time-budget=26000 \
          --screenshot=out.png "http://localhost:8124/jewellery-lux/"
   ```

   Two traps, both of which will waste an hour:

   - **`--virtual-time-budget` does not advance while a rAF loop is running**,
     and every one of these pages runs one forever. So a `setTimeout` in a
     debug snippet never fires. Do not drive a screenshot harness off timers:
     write a temporary copy of the page with the state you want already set in
     the source (`selectPiece(2)`, `var currentUnit = 1`), and inject CSS to
     blow the stage up to `position:fixed; inset:0` so you get a full-viewport
     render of just the model.
   - **three.js comes from a CDN, so a run can fail transiently** and leave you
     looking at the SVG fallback. That is the gate working, not a bug. Retry
     before you go hunting.

### Repo shape

```
index.html            the whole SPA — nav, 5 views, all CSS, all JS
build-routes.js       regenerates the 5 route pages from index.html
test/                 npm test — jsdom suites
demo.css / demo.js    SHARED by all 8 demos = 80 pages. High leverage, high blast radius.
<category>/           8 demos x 10 pages (restaurant, healthcare, salon, boutique,
                      yoga, jewellery, ecommerce, realestate)
jewellery-lux/        the 3D flagship. Self-contained: does NOT use demo.css/demo.js.
worker/               Cloudflare Worker, sends enquiry mail via Zoho SMTP
DEMO_UPGRADE_PLAN.md  the full argument behind the three tracks below
```

### House style, decided and settled

- **Voice is studio "we", never "I".** Netloom is the brand.
- **No claims of team size, years in business, client counts, or named clients.**
  There are few or no paid clients yet. Four such claims were removed from the
  live site on 5 Sep; do not reintroduce them.
- **No numbered section labels** ("01 — Services"). Removed everywhere on the
  main site. The flagship demo keeps its own — that's a fictional client's page.
- Guarantees are stated as policy, not apology. "We won't show you testimonials
  you can't verify" is the most credible line on the site — keep that posture.

---

## 1. Track A — modern-UI uplift, all 8 demos, zero added weight

**Do this first. It is the highest value per hour in the whole plan.**

Everything lands in `demo.css` / `demo.js`, so one change ships to **all 80 demo
pages at once**. No 3D, no new libraries, essentially no bytes.

| Item | What it does | Cost |
|------|--------------|------|
| Scroll-driven animation | Native CSS `animation-timeline: view()` — parallax, reveals, progress bars, with no JS and no observers | 0 KB |
| View Transitions API | Cross-fade / morph between demo pages so a static multi-page site feels like an app | ~0 KB |
| Real depth | Layered shadows, gradient meshes, glass surfaces, subtle grain | ~2 KB |
| Typographic pass | Fluid `clamp()` scale, tighter display tracking, better vertical rhythm | 0 KB |
| Cursor-reactive tilt | Subtle 3D transform on cards — reads as 3D, costs nothing | ~1 KB |
| Sticky section transitions | Panels that pin and swap on scroll | ~2 KB |

**Why this and not 3D everywhere:** see `DEMO_UPGRADE_PLAN.md` §2. Short
version — making all 8 demos 3D would collapse the ₹24,999 tier's only
differentiator, add ~150% page weight against the "95+ performance standard"
claim now in the hero copy, and push 3D into categories (healthcare, salon,
yoga) where it actively damages credibility.

**Risks specific to Track A:**
- `demo.css` and `demo.js` are shared by 80 pages. A mistake breaks all of them
  simultaneously. Gate new behaviour behind a class and check **one page per
  category** before pushing.
- `animation-timeline` and View Transitions are progressive enhancements. They
  must degrade to a static, correct page — never a broken one. Test with the
  features disabled.
- Honour `prefers-reduced-motion` throughout. The existing code already does.

---

## 2. Track B — two more 3D flagships

### 2a. Extract `flagship/3d-core.js` FIRST

`jewellery-lux/index.html` currently holds all its 3D inline. Before building a
second flagship, lift the reusable parts out:

- `makeStage()` — renderer, camera, lights, drag-with-inertia, visibility gating
- `studioEnv()` — the painted equirect environment map
- `frame()` — bounding-box auto-centre and camera fit
- `brilliant()` / `mergeGeoms()` — procedural gem geometry
- the load gate (WebGL present, motion not reduced, not `save-data`/2G)

Three flagships hand-copying this will drift, and the same bug will need fixing
three times. Refactor `jewellery-lux` onto the module as the proof it works.

### 2b. Build, in this order

1. **`realestate-lux`** — 3D floor-plan walkthrough, unit selector, orbit around a
   building massing model. Highest-ticket clients, clearest ROI story.
2. **`boutique-lux`** — fabric/drape treatment and a 3D lookbook carousel.
   *(This was `ecommerce-lux`. Reassigned on 5 Sep because the ₹44,999 tier in §3
   is now a full commerce platform and owns ecommerce outright — the two would
   have been the same build twice.)*

Each is a **single self-contained page**, like `jewellery-lux` — not a 10-page
site. A flagship's job is to win the meeting, not to be a complete website.

### 3D lessons already paid for — do not relearn these

- **`three.js 0.147.0` is the last clean UMD build on cdnjs.** r150+ prints a
  deprecation warning, r160 removed UMD entirely. r128 has no `transmission`/`ior`.
- **A gem needs `metalness: 1.0`.** A physically-correct dielectric reflects only
  ~4% of its environment head-on, so the other 96% is flat diffuse colour — which
  is literally white plastic. That was the first bug.
- **Facet sparkle IS environment contrast.** Hard-edged bright bands over near
  black in the env map. A smooth gradient reflects as a smooth, dull stone.
- **Do not use real `transmission` here.** It needs something behind the stone to
  refract; on these dark pages there is only background, so it renders dark.
- **Derive seat heights, never guess them.** `brilliant(r)` spans `-1.32r` to
  `+0.42r` from the girdle. The first ring had the stone parked at a height with
  no relation to the band and prongs both inside and below the girdle.
- **Reveal the canvas before the first `resize()`.** A `[hidden]` canvas measures
  0×0 and the renderer comes up 1×1.
- **Auto-frame every piece.** `frame()` recentres on the bounding box and fits the
  camera, so composition never depends on hand-tuned offsets.

- **An environment map belongs to ONE renderer.** A PMREM env is a
  `WebGLRenderTarget` texture, and a render target belongs to the GL context
  that made it. Every stage has its own `WebGLRenderer`, so passing
  `env: firstStage.env` to a second stage hands it a texture from a foreign
  context and it samples as nothing — silently. Both `realestate-lux` and
  `boutique-lux` shipped with a dead environment on their second canvas this
  way. **What it looks like is not obviously an environment problem:** metal
  keeps its highlights, because those come from the discrete lights, so a gold
  band still reads as lit metal, just dark. A near-mirror surface has almost no
  analytic specular and goes PURE BLACK. `makeStage` now rebuilds the env from
  the recipe when it sees one from another renderer, so `opts.env` means "the
  same look", not "that texture".

- **In three.js 0.147 only `map` gets a UV transform.** `normalMap`,
  `roughnessMap` and the rest sample `vUv` directly and silently ignore their
  own `repeat`. A weave tile set to `repeat(14, 20)` does not tile — it is
  stretched once across the whole surface, and thread-scale relief comes out as
  a quilted eiderdown a foot across. Either bake detail at the same scale as
  the colour map, or accept 1:1.

- **Facet count is not the point; the ENVIRONMENT is.** The stone was cut as
  two cones and no material tuning could rescue it, because a cone has one
  continuous surface per side and therefore one continuous highlight. But the
  57-facet cut alone did not fix it either: with a smooth warm gradient for an
  env map, neighbouring facets differ by a few degrees and reflect nearly the
  same value, so the crown still read as one surface. Fire is environment
  CONTRAST and FREQUENCY. `GEM_ENV` is three rings of strip lights at even
  azimuths over near-black: whichever way a facet turns there is something to
  catch, and the gaps between them are what makes it sparkle rather than glow.

- **A lit zenith is not optional.** In an equirectangular map the top edge is
  the ceiling, and the table — the big flat facet on top of every cut stone —
  points almost straight at it. Left black, every small stone renders as a
  black hole with a gold outline while the big hero gem looks fine.

- **Derive, never guess — this keeps costing.** The chased bands on the jhumka
  were placed at a hand-picked radius and hung in mid-air beside the bell,
  because the cone's radius at that height is a quarter of what was guessed.
  Ask the geometry: `radius = bellR * (1 - t)`.

- **Compose placement from a quaternion, not stacked Euler rotations.**
  `rotateX` then `rotateY` do not commute, and applying them in the order they
  were typed is how the bangle studs ended up clustered on one side of the hoop
  and the repoussé domes ended up buried inside the metal. There is a
  `placeGeom(geo, x,y,z, dx,dy,dz)` in `jewellery-lux` that does it properly.

- **Nothing reads as real while it floats.** The tower was a diagram until it
  got a ground plane, a road, six neighbours and some trees. Site context is
  flagged `userData.n3ignoreFrame` so it can be as big as it needs to be
  without the camera pulling back to fit it.

---

## 3. The ₹44,999 tier — `commerce/`, a store that actually takes money

**Decided by Mayank on 5 Sep 2026: this is being built.** Sequenced last, after
Track A and Track B. Full spec in `DEMO_UPGRADE_PLAN.md` §5A — read it before
starting; only the essentials are repeated here.

Tiers one and two are brochures. This one **transacts** — a categorical jump,
which is what holds the price.

Note the existing `ecommerce/` demo has a cart *page* but no cart *logic*. The
premium demo must be genuinely clickable end to end or it demos worse than the
tier it upsells from.

### Architecture — no new vendor

```
Static front end  →  GitHub Pages       (as everything else)
Data / auth       →  Supabase           (already chosen in PHASE2_ROADMAP.md)
Payments          →  Razorpay           (test mode for the demo)
Server logic      →  Cloudflare Worker  (extends the existing worker/)
Order email       →  Zoho SMTP          (already working in worker/)
```

**Verify Razorpay signatures in the Worker, never in the browser** — a
client-side "payment succeeded" check is trivially forged.

### Three things that must not be forgotten

1. **A store is an operational relationship, not a delivery.** Failed payments,
   stock discrepancies, refunds and delivery disputes continue forever. Flat
   ₹44,999 with no retainer could make this the least profitable item on the
   price list. The plan recommends a mandatory monthly retainer quoted as part
   of the tier.
2. **Ownership promise still applies.** The site says *"you own everything"* and
   *"never locked in."* The Supabase project and Razorpay account must be in the
   **client's** name, exactly as domains already are.
3. **Legal pages are a launch blocker, not a nicety.** Shipping, refund and
   cancellation, terms, privacy, and GST-compliant invoicing. Razorpay demands
   several of these before it will activate an account. Build them as real pages
   in the demo.

---

## 4. Still open, unrelated to the tracks

- **Google Places API key is committed and public.** `.claude/settings.json`,
  present since commit `8c05236`, in a public repo. **Rotate it in Google Cloud
  Console and add an HTTP-referrer restriction.** Scrubbing git history is
  pointless while the old key still works. Then move it to an untracked `.env`
  (`.gitignore` already covers `**/.env`).
- **Consider a visual test.** Headless Chrome now demonstrably renders these
  pages (recipe in §0.5), so the remaining work is only to commit a script and
  a set of reference images. Worth it: every 3D bug in §2b was invisible to
  `npm test` and obvious in a screenshot.

---

## 5. State as of this handoff

Live and verified on netloom.in at commit `adfeb76`:

- Hero Preview button opens a personalised live demo in a modal (industry guessed
  from the typed business name; iframe gets `?biz=` + `embed=1`)
- Footer rebuilt — four filled columns, eight demo links, flagship link
- Tabs flattened to vertical scroll; Services keeps a scroll-spy jump nav
- Every WhatsApp link opens with a prefilled, context-specific message
- Zoho `hello@netloom.in` live; enquiry form posts to the Cloudflare Worker
- `jewellery-lux` 3D flagship shipped
- Copy rewritten to studio voice; four unsupportable claims removed
- Section label numbers removed
- Autofilled form fields stay dark; mobile hero badge anchored to its mockup
