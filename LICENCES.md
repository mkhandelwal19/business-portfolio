# Asset licences and provenance

Last audited: 6 September 2026.

> **Status: provenance is UNVERIFIED and this is a live risk.**
> This file records what is actually known about where the photography came
> from. It does **not** assert a licence, because none has been established.
> Section 1 is the open item and needs Mayank to close it.

---

## 1. Photography — OPEN

### What is known

| Fact | Detail |
|------|--------|
| Count | 216 source photographs, `assets/photos/*.webp` |
| Size | 16 MB of originals, plus 14.4 MB of generated derivatives |
| Added | commit `0f5a20f`, 4 September 2026, *"Replace placeholder SVGs with real photography across all 80 demo pages"* |
| Author of that commit | Mayank Khandelwal |
| Attribution shipped with them | **None.** No manifest, no source list, no per-file credit, no licence text |
| Original filenames | Not preserved — every file was renamed to `<category>-NN.webp` |
| EXIF | Not checked; a WebP re-encode will in most cases have dropped it |

### What is not known

**Where these files came from.** That is the whole problem. Without a source
there is no licence, and without a licence there is no defence. Being on the
public web is not a licence. Being reachable through an image search is not a
licence. "Free to download" is not the same as "free to use commercially".

This matters more than usual here because the images are not decoration on a
personal site — they are the visual content of a product being shown to paying
prospects, on a commercial domain, to sell a service.

### What has to happen

1. **Mayank writes the source into the table below.** One row per category is
   enough if a whole set came from one place.
2. If the source is **Unsplash, Pexels or Pixabay** — their licences permit
   commercial use without attribution, and this is resolved by recording it.
   Attribution is still good manners and costs nothing.
3. If the source is **Google Images, Pinterest, a competitor's site, or "I do
   not remember"** — treat every one of those files as unlicensed and replace
   it. There is no middle position.
4. If any file was **AI-generated**, record the tool and the date; output terms
   differ per tool and some restrict commercial use.

| Category | Files | Source | Licence | Verified by | Date |
|----------|-------|--------|---------|-------------|------|
| restaurant | 24 | _TO BE FILLED_ | | | |
| healthcare | 27 | _TO BE FILLED_ | | | |
| salon | 31 | _TO BE FILLED_ | | | |
| boutique | 28 | _TO BE FILLED_ | | | |
| yoga | 24 | _TO BE FILLED_ | | | |
| jewellery | 28 | _TO BE FILLED_ | | | |
| ecommerce | 25 | _TO BE FILLED_ | | | |
| realestate | 29 | _TO BE FILLED_ | | | |

### Derivatives

`assets/photos/xs`, `sm` and `md` are generated from the originals by a Pillow
script — 200px square crops, 560×350 bands and 800px long-edge respectively.
They carry exactly the licence of their source. Resizing creates a derivative
work; it does not create a new right in it.

---

## 2. People in photographs — PARTLY CLOSED

A licence to *use a photograph* is not a licence to use the *likeness of the
person in it*. Unsplash and Pexels both say so explicitly: their licence covers
the photographer's copyright, not the subject's personality rights. Using an
identifiable face in a way that implies endorsement or a commercial
relationship needs a model release, which stock libraries do not supply.

### Closed on 6 September 2026

Five pages presented stock portraits as specific named employees — a glamour
portrait captioned *"Ratan Ghosh, Head Chef & Owner"*, a man with a whiteboard
captioned *"Priya Banerjee, Sous Chef"*. Genders were inverted and none of the
subjects were chefs, but the real problem was the claim itself: attaching a
real person's face to an invented named role asserts a relationship that does
not exist.

Deleted: `restaurant/team.html`, `salon/team.html`, `realestate/team.html`,
`healthcare/doctors.html`, `yoga/teachers.html`, their 88 inbound links, and
all 18 `portrait-*.webp` files with their derivatives.

Testimonial avatars remain monograms rather than faces. That is deliberate:
there are 42 reviewer names against one usable male portrait, so real faces
would have meant one man appearing as eleven different people. Recycled stock
faces on testimonials would also sit badly beside the site's own line, *"we
won't show you testimonials you can't verify."*

### Still open

Roughly 95 of the remaining 216 photographs contain identifiable people, used
as generic imagery with no name attached:

| Category | Photos with identifiable people |
|----------|--------------------------------|
| yoga | 24 of 24 — every frame is a person in a posture |
| boutique | ~26 of 28 — models wearing the garments |
| healthcare | ~12 of 27 — clinicians and patients |
| jewellery | ~12 of 28 — bridal models |
| salon | ~9 of 31 |
| ecommerce | ~8 of 25 — artisans at work |
| restaurant | ~5 of 24 |
| realestate | 0 of 29 — interiors and buildings only |

This is lower risk than a named role, but it is not zero, and it cannot be
assessed at all until section 1 is closed. A blanket "no people" rule was
considered and rejected: it would empty the yoga and boutique demos of their
subject matter entirely.

---

## 3. Code and libraries — CLOSED

| Dependency | Version | Licence | How it is loaded |
|------------|---------|---------|------------------|
| three.js | 0.147.0 | MIT | CDN, `cdnjs.cloudflare.com`, pinned |
| Font Awesome Free | 6.5.1 | CC BY 4.0 (icons), SIL OFL 1.1 (font), MIT (code) | CDN, `cdnjs.cloudflare.com` |
| Playfair Display | — | SIL OFL 1.1 | Google Fonts |
| DM Sans | — | SIL OFL 1.1 | Google Fonts |
| JetBrains Mono | — | SIL OFL 1.1 | Google Fonts |
| jsdom | ^30 | MIT | dev dependency, not shipped |
| Pillow | 12.2 | MIT-CMU | local tooling only, not shipped |

Font Awesome Free is CC BY 4.0, which *does* require attribution. The CDN link
carries their notice, which is the normal way of satisfying it; if the icons
are ever self-hosted, the attribution has to be carried explicitly.

---

## 4. Google Maps embeds — CLOSED, with a condition

Seven contact pages embed a map through `maps.google.com/...&output=embed`.
This needs no API key and is covered by the Google Maps Platform terms.

**The condition:** Google's attribution — the wordmark bottom-left and the
Terms link bottom-right — must not be altered, obscured or removed. The
obvious way to make a light map sit on this dark theme is a CSS
`invert()`/`hue-rotate()` filter, and it is deliberately **not** used, because
the filter would apply to that attribution too. The "Directions" button is
positioned top-right for the same reason. Do not move it.

---

## 5. Fictional businesses — NOTE

Every demo depicts an invented business at a real Kolkata street address:
Aangan Thali House, Basu Family Clinic, Lumiere Salon & Spa, Mallika Jewels,
Saha Properties and the rest. Names, reviews, staff and history are fiction.

Each page carries `<meta name="robots" content="noindex, nofollow">` and a
"Demo" badge so it is not mistaken for a real trading entity. Keep both. If any
invented name turns out to collide with a real Kolkata business at or near the
same address, change the name rather than argue about it.

---

## 6. Netloom's own material — CLOSED

The wordmark, site copy, `demo.css`, `demo.js`, `flagship/3d-core.js`, the
hand-drawn SVG fallbacks and all procedural 3D geometry are original work and
belong to Netloom. The 3D in the flagships is generated in code from primitives
— there are no downloaded models, and nothing to license.
