# Netloom playbook

**Start here** if you are building a site for a real client, or if you are new
and need to know how this works.

The templates are finished. The work now is intake, content and delivery.

---

## The skills

Everything below is executable as a Claude Code skill. Type the slash command
and Claude loads the procedure.

| Command | What it does |
|---|---|
| **`/netloom-build`** | **The master procedure.** Intake → tier → build → preview → live. Start here for every project. |
| `/netloom-restaurant` | Restaurants, cafes, thali houses, sweet shops, bakeries, caterers |
| `/netloom-clinic` | Clinics, doctors, dentists, physio, diagnostics, vets |
| `/netloom-salon` | Salons, spas, beauty parlours, barbers, nails, makeup |
| `/netloom-yoga` | Yoga, pilates, gyms, dance, martial arts, coaching, tuition |
| `/netloom-store` | Anyone who needs to take money on the site |
| `/netloom-jewellery` | Jewellers, goldsmiths, bridal — the 3D flagship |
| `/netloom-boutique` | Boutiques, labels, saree houses — the 3D flagship |
| `/netloom-realestate` | Builders, developers, project sales — the 3D flagship |

They live in `.claude/skills/`. They are plain Markdown — read them directly
if you prefer.

### The reference files

`/netloom-build` carries six of them in
`.claude/skills/netloom-build/references/`:

| File | What it is |
|---|---|
| **`intake-sop.md`** | **The client call script.** 51 universal questions plus a branch per vertical, each with why we ask and what to do when the answer is "I don't have that". Print it. |
| `tiers.md` | Prices, page maps, add-ons, care plans, and the four sentences that hold the line on scope |
| `assets.md` | Image sourcing, the three permitted stock sources, provenance recording, the derivative script |
| `content-slots.md` | Every text slot in every template, with the length that actually fits |
| `deploy.md` | Preview subdomain setup and runbook, then the go-live DNS runbook |
| `qa.md` | The checklist before anyone outside sees it |
| `handover.md` | What the client owns and how they get it |

---

## Prices

| Tier | Price | Delivery | Pages | Care plan |
|---|---|---|---|---|
| Starter | **₹14,999** | 5–7 days | 4 | — |
| Business | **₹24,999** | 10–14 days | 7 | ₹1,999/mo optional |
| Premium | **₹44,999** | 3–4 weeks | 10, or a store, or 3D | ₹3,499/mo — quote it *with* the tier |

Full detail, add-on pricing and what each plan actually covers:
`.claude/skills/netloom-build/references/tiers.md`.

---

## What we have to sell

Eight verticals, three template families, all live on netloom.in.

| Vertical | Template | Family | Pages | Theme |
|---|---|---|---|---|
| Restaurant & cafe | `restaurant/` | standard | 9 | `theme-ember` |
| Clinic & healthcare | `healthcare/` | standard | 9 | `theme-mint` |
| Salon & spa | `salon/` | standard | 9 | `theme-plum` |
| Yoga & fitness | `yoga/` | standard | 9 | `theme-sage` |
| Online store | `commerce/` | commerce | 12 | own light system |
| Jewellery | `jewellery-lux/` | 3D flagship | 1 | own dark system |
| Boutique | `boutique-lux/` | 3D flagship | 1 | own dark system |
| Real estate | `realestate-lux/` | 3D flagship | 1 | own dark system |

The four standard templates share `demo.css` and `demo.js`. **A change to
either ships to all 36 pages at once** — highest leverage and highest blast
radius in the repo.

The `boutique/`, `jewellery/`, `ecommerce/` and `realestate/` standard demos
were retired on 6 September 2026 in favour of their premium replacements.
All eight verticals still answer in the industry switcher and the hero
preview; four of them now open the premium page.

---

## Light and dark

Every standard template ships **both palettes**. The switch is in the grey
Netloom bar at the top of every demo, and the choice follows the visitor
through the site.

- **Dark is the default** and stays the default. It is the register the site
  is selling, and following the visitor's OS setting would open the demo in
  light for anyone whose laptop is set that way — who would then never see
  it.
- To send a client one specific theme: append `?theme=light` or
  `?theme=dark` to any demo URL. The choice sticks as they click through.
- **Use this on the call.** *"Here it is in dark, here it is in light — which
  one feels like you?"* It gives the client something concrete to have an
  opinion about, which is worth more than twenty questions.

Rough guidance: **dark** reads premium, evening, considered — restaurants,
salons, jewellers. **Light** reads clean, clinical, open, trustworthy —
clinics, labs, coaching, anything selling reassurance.

The flagships (`*-lux/`) are dark only, and deliberately so: the gem and
material rendering depends on a near-black environment map. There is no light
theme for them and there should not be one.

---

## Client previews

`https://preview.netloom.in/<client-slug-with-random-suffix>/`

One repo (`netloom-preview`), one DNS record, ever. Each client is a folder.
Every page carries `noindex, nofollow`; the unguessable slug is the access
control.

**This is not set up yet.** The one-time setup is eight ticks at the top of
`.claude/skills/netloom-build/references/deploy.md`. Whoever does it first,
tick them and commit.

---

## The rules that do not bend

These are the reason we win against shops that will say anything.

1. **Never write a fact the client did not give us.** Not a year, not a
   headcount, not a review, not an award, not "20+ years of experience".
2. **Never fabricate a testimonial.** If there are no real reviews, the
   section comes out.
3. **Never put a stock face under a real person's name.** Five pages were
   deleted from this repo on 6 September 2026 for exactly this.
4. **Every image's source is recorded before it enters a build.** This repo
   has 216 photographs with no recorded provenance and it is an open risk
   written up in `LICENCES.md`. Do not create a second one on a client's site.
5. **Nothing is ever in Netloom's name.** Domain, repo, email, Razorpay,
   Supabase — all in the client's account. We may hold manager access; we
   never hold ownership. The site promises this in writing.
6. **The client sees it on a private link before it goes live.** Always.
7. **Two rounds of revisions, stated in writing before round one.**

---

## Repo orientation

| Path | What it is |
|---|---|
| `index.html` | The whole marketing site — a client-routed SPA with 5 views, all CSS, one inline script |
| `build-routes.js` | Regenerates `/work` `/about` `/services` `/pricing` `/contact` from `index.html`. **Run after every `index.html` edit.** |
| `demo.css` / `demo.js` | Shared by the four standard demos = 36 pages |
| `commerce/` | The store. `README.md` there is the authoritative technical doc. |
| `flagship/3d-core.js` | Shared WebGL core for the three flagships |
| `worker/` | Cloudflare Worker — enquiry mail over Zoho SMTP |
| `test/` | `npm test` — 209 jsdom assertions across 7 suites |
| `LICENCES.md` | Asset provenance. Section 1 is an open risk. |
| `NEXT_SESSION.md` | Engineering handoff: current state and traps |
| `DEMO_SITES.md` | Page inventory per template |

### Things that will cost you an hour

- **`node build-routes.js` after every `index.html` edit**, or the five route
  pages go stale.
- **Every file is CRLF.** Any script doing multi-line string replacement must
  normalise line endings or every match returns zero hits.
- **`index.html` has one giant inline script.** A top-level throw anywhere in
  it silently kills every IIFE after that point.
- **`npm test` before every commit.** About a second.
- **DOM tests cannot see rendering.** For anything visual, take a screenshot.
- **Accent-as-text must use `--accent-ink`, never `--accent`**, or it is
  unreadable in light mode. `npm test` asserts this.
- **Push once at the end of a session, not per change.** GitHub Pages
  redeploys on every push to `main` and the site is shown to prospects.
