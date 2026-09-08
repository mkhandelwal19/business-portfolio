---
name: netloom-build
description: Run a Netloom client website end to end — intake call, tier and template choice, content and image sourcing, build, a private client preview on preview.netloom.in, then go-live on the client's own domain. Use this whenever a real client project starts, when someone asks what to ask a customer, or when a client preview needs deploying or taking live. Delegates the vertical-specific detail to netloom-restaurant / -clinic / -salon / -yoga / -store / -jewellery / -boutique / -realestate.
---

# Netloom — building a client site

This is the operating procedure for turning an enquiry into a live website.
It is written for someone who has not seen this repo before.

**Templates are finished. The work is now intake, content and delivery.**
Almost every project that goes badly goes badly because content was missing
and someone invented it, or because an image was used without a licence, or
because the client saw the site for the first time on the day it went live.
Each of those has a step below that prevents it.

---

## The seven stages

| # | Stage | Output | Who |
|---|-------|--------|-----|
| 1 | Qualify | Vertical, tier, budget confirmed | Sales call |
| 2 | Intake | Completed intake sheet, all questions answered | Sales call |
| 3 | Assets | Photos and copy in hand, **every one with a recorded source** | Client, or us |
| 4 | Build | The site, from the matching template | Intern + Claude |
| 5 | Preview | Private link on `preview.netloom.in` | Intern |
| 6 | Review | Client sees it, two rounds of changes | Sales call |
| 7 | Go live | Their domain, their repo, their ownership | Intern |

Do not skip stage 5. A client who first sees the site on their own domain has
no safe way to say "I hate the green". A client who sees it on a preview link
has permission to.

---

## Stage 1 — Qualify

Three questions decide everything else. Get them before anything is built.

1. **What is the business?** → picks the vertical skill.
2. **What must the website actually do?** → picks the tier.
3. **Do they own a domain already?** → decides whether stage 7 is 20 minutes
   or a week of waiting on a registrar.

### Picking a template

| They say | Vertical skill | Template |
|---|---|---|
| Restaurant, cafe, thali house, sweet shop, bakery, cloud kitchen, caterer | `netloom-restaurant` | `restaurant/` |
| Clinic, doctor, dentist, physio, diagnostics, pathology lab, vet | `netloom-clinic` | `healthcare/` |
| Salon, spa, beauty parlour, barber, nails, makeup artist | `netloom-salon` | `salon/` |
| Yoga, pilates, gym, dance, martial arts, coaching, tuition | `netloom-yoga` | `yoga/` |
| Anyone who wants to **take money on the site** | `netloom-store` | `commerce/` |
| Jeweller, goldsmith, bridal jewellery | `netloom-jewellery` | `jewellery-lux/` |
| Boutique, designer wear, saree house, label | `netloom-boutique` | `boutique-lux/` |
| Builder, developer, property broker, project sales | `netloom-realestate` | `realestate-lux/` |

Nothing on that list fits? Take the closest **standard** template — the four
9-page ones — and re-skin it. Do not attempt a 3D flagship for a vertical it
was not built for; see `references/tiers.md`.

### Picking a tier

Read `references/tiers.md` for the full page maps. The short version:

| Tier | Price | Delivery | Pages | Take it when |
|---|---|---|---|---|
| Starter | **₹14,999** | 5–7 days | 4 | They need to exist online and be findable |
| Business | **₹24,999** | 10–14 days | 7 | They need to be *chosen* — gallery, reviews, FAQ |
| Premium | **₹44,999** | 3–4 weeks | 10+, or a store, or 3D | They need to transact, or the product is visual enough to need 3D |

Care plans are quoted **with the tier, not after it**: ₹1,999/mo on Business,
₹3,499/mo on Premium. A store without a retainer is the least profitable
thing we can sell — see `references/tiers.md`.

---

## Stage 2 — Intake

**Run `references/intake-sop.md`.** It is the question script for the call.
Work through it out loud with the client; do not email it as a form and hope.

Two rules that matter more than the questions:

- **Never invent a fact about the client's business.** Not a year, not a
  headcount, not a review, not "20+ years of experience", not an award. If
  they did not say it, it does not go on the page. This is the same rule the
  netloom.in copy follows, and it is the reason we can sell against shops
  that lie.
- **A blank is an answer.** "I don't have opening hours yet" is fine; write
  it on the sheet and use the fallback the vertical skill gives. Silence
  becomes invention two weeks later.

Save the completed sheet next to the build. The client will contradict it,
and you will want the record.

---

## Stage 3 — Assets

`references/assets.md` is mandatory reading before you download a single
image. The summary:

1. **Ask for their photos first.** Client photos beat stock every time, even
   mediocre ones, because they are of the actual place.
2. If they have none, source from **Unsplash, Pexels or Pixabay only**. Those
   three licences permit commercial use. Nothing else.
3. **Record the source URL of every file in the site's `LICENCES.md` as you
   download it.** Not afterwards. This repo has 216 photographs with no
   recorded provenance and it is an open legal risk written up in
   `LICENCES.md` at the repo root — do not create a second one.
4. **Never present a stock face as a named person.** "Dr. Sen, Senior
   Consultant" over a stock portrait asserts a relationship that does not
   exist. Five pages were deleted from this repo for exactly that.
5. Convert to WebP, generate the `xs`/`sm`/`md` derivatives, keep the
   originals. Sizes and the command are in `references/assets.md`.

---

## Stage 4 — Build

1. Copy the template directory to a working folder named for the client.
2. Invoke the vertical skill (`netloom-restaurant`, `netloom-store`, …). It
   lists every file, every content slot and the vertical-specific traps.
3. Use `references/content-slots.md` for what goes in each slot and how long
   it can be.
4. Delete the pages the tier does not include. Then **delete the links to
   them** — a nav item pointing at a 404 is the single most common defect in
   a downgraded build.
5. Set the theme class on `<body>`, the business name, the JSON-LD block, the
   meta description, the WhatsApp number, and the hours.
6. Run `references/qa.md` before you show it to anyone.

### Things that will cost you an hour if you learn them the hard way

- **Every file in this repo is CRLF.** Any script doing multi-line string
  replacement must normalise line endings or every match returns zero hits.
- **`demo.css` and `demo.js` are shared by all 36 demo pages.** If you are
  building a client site, copy them into the client folder and edit the copy.
  Editing them in place changes every demo on netloom.in.
- **Run `npm test` before every commit.** 209 assertions, about a second.
- **DOM tests cannot see rendering.** For anything visual, take a screenshot.
  Headless Chrome works on this machine; the recipe is in `references/qa.md`.
- **Light and dark both ship.** Every standard template now carries both
  palettes. Check the client's build in both — the switch is in the preview
  bar, or append `?theme=light` to the URL. Accent-as-text must go through
  `--accent-ink` and never `--accent`, or it will be unreadable on paper.

---

## Stage 5 — Preview

`references/deploy.md` has the full runbook. In brief: the client's folder
goes into the `netloom-preview` repo under an unguessable slug and appears at

```
https://preview.netloom.in/<client-slug-with-random-suffix>/
```

Every preview page carries `<meta name="robots" content="noindex, nofollow">`.
The slug is the only access control, so make it unguessable and never reuse
one. Send the link on WhatsApp with the review script in `references/deploy.md`.

---

## Stage 6 — Review

Two rounds of changes are included; say so when you send the link, in
writing, before the first round. A third round is billable and should be
quoted rather than argued about.

Ask for feedback in one message rather than a call if you can — written
feedback is a list, spoken feedback is a mood.

---

## Stage 7 — Go live

`references/deploy.md`, second half. The shape of it:

- The site moves to **its own GitHub repo**, and that repo is transferred to
  or shared with the client.
- The **domain stays in the client's own registrar account**, always. We
  never hold a client's domain. This is not a preference, it is the
  "you own everything, never locked in" promise the site makes in writing.
- DNS records, propagation expectations and the HTTPS wait are all in
  `references/deploy.md`.
- Hand over `references/handover.md` — what they own, how to reach us, what
  the care plan does and does not cover.

---

## Reference files

| File | Read it when |
|---|---|
| `references/intake-sop.md` | Before any client call. This is the question script. |
| `references/tiers.md` | Deciding scope or price, or pushing back on scope creep |
| `references/assets.md` | Before downloading any image, ever |
| `references/content-slots.md` | While writing the actual page copy |
| `references/deploy.md` | Publishing a preview, or taking a site live |
| `references/qa.md` | Before the client sees anything |
| `references/handover.md` | On the day of go-live |
