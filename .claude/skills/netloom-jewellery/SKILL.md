---
name: netloom-jewellery
description: Build a Netloom client site on the jewellery 3D flagship — jewellers, goldsmiths, bridal jewellery and diamond houses. Covers what is swappable versus what needs real 3D work, the PIECES data shape, hallmarking and BIS requirements, the gold-rate trap, photography, and the three.js constraints that have already cost time. Use after netloom-build has run intake and picked this vertical.
---

# Jewellery — the 3D flagship

**Template:** `jewellery-lux/` · **Self-contained**: does *not* use
`demo.css` / `demo.js` · **3D:** `flagship/3d-core.js` + three.js 0.147.0
from cdnjs · **Reference build:** Mallika Jewels

Run `netloom-build` first. This file is only what is specific to jewellery.

---

## What this actually is

A **single page** whose job is to win the meeting. Not a ten-page website.

If the client needs a full site *and* the 3D, that is a flagship landing
page plus a standard build, quoted as two things.

The page is dark, and it stays dark. The gem rendering depends on a
near-black environment map — fire is environment *contrast*, and a light
environment produces a dull stone. **There is no light theme for the
flagships and there should not be one.**

---

## Swappable, versus real 3D work

Know which side of this line a request falls on before you quote it.

### Swappable in under a day

- Business name, wordmark, all copy
- Colours, within the dark palette
- The nine-image photo gallery
- The `PIECES` array — piece names, metal, certification, lead time
- Section order and which sections appear

```js
var PIECES = [
  { name:'Solitaire', metal:'18K Gold',       cert:'IGI', time:'6 weeks' },
  { name:'Bangle',    metal:'22K Gold',       cert:'BIS', time:'4 weeks' },
  { name:'Pendant',   metal:'18K White Gold', cert:'IGI', time:'5 weeks' },
  { name:'Jhumka',    metal:'22K Gold',       cert:'BIS', time:'8 weeks' }
];
```

Four pieces. The viewer, badge and spec strip all read from this array.

### Real 3D work — quote it separately

- A **new piece geometry** not among the four. This is procedural modelling
  in code, not importing a file. Budget days, not hours, and expect to
  iterate against screenshots.
- A different **cut** — `3d-core.js` provides `brilliant()`, `stepCut()` and
  `roseCut()`. Anything else is new geometry.
- Changing the environment map, which changes how every surface reads.
- Any request that begins "can it show *our actual* ring" — it cannot,
  not without modelling that ring. Say so plainly and early.

---

## Ask the client

1. **Which four pieces should the viewer show?** Map them onto the available
   geometry: solitaire, bangle, pendant, jhumka. If their signature piece is
   not one of those, decide now whether it is a swap or a build.
2. **Metal purity per piece** — 18K, 22K, 24K — and **BIS hallmarking**. The
   hallmark is a legal mark and a major trust signal; get it right.
3. **Certification** — IGI, GIA, SGL, in-house? Per piece.
4. Making charges: percentage or per gram, and do they publish them?
5. Custom and bridal commissions — do they take them, and what is the lead
   time?
6. **Buy-back and exchange policy.** Every Indian jewellery customer asks
   this and it is a genuine differentiator.
7. Do they want **live gold rates** on the site? *(See traps.)*
8. Insurance, certification and the after-sale service they offer.
9. GST — jewellery is 3%, making charges are 5%. Confirm how they quote.
10. Do they sell online, or is the site a showroom driver? If they sell
    online, this is `netloom-store` with a jewellery skin instead.

---

## Content

| Slot | Guidance |
|---|---|
| Eyebrow | Locality and heritage — `Bowbazar · Since 1954` |
| `h1` | Restrained. This page is already showing off; the words should not. |
| Sub | What is made, by whom, in how long |
| Viewer | Four piece buttons, driven by `PIECES` |
| Spec strip | Metal · certification · lead time, from the selected piece |
| Gallery | Nine photographs. Real ones, of their real work. |
| Story | The workshop, the family, the craft |
| CTA | `Book a showroom visit` — the conversion is a visit, never a purchase |

---

## Photography

**This is the vertical where photography decides whether the page works.**
The 3D carries the hero; the gallery has to carry the reality, and a
prospect will compare the two.

1. 9 photographs of their actual pieces, on a dark ground, hard-lit to catch
   the facets.
2. The workshop and the hands working — this is what nobody else shows and it
   is the whole story.
3. The showroom interior.
4. Bridal sets, if they do bridal.

**Client's own pieces only.** A stock photograph of somebody else's necklace
on a jeweller's website is both a lie and immediately obvious to anyone in
the trade. If they have no photography, sell the shoot — for a jeweller it
pays for itself.

Bridal model photography needs the model's permission in writing. Faces are
optional; the jewellery is the subject.

---

## Traps

- **Do not publish live gold rates** unless someone updates them daily. A
  stale rate is worse than none — customers price their exchange on it and
  arrive angry. If they insist, it goes in the care plan as a daily task and
  it is priced accordingly.
- **Do not state carat weights or clarity grades** unless they come from an
  actual certificate.
- Hallmarking claims must be true. BIS hallmarking has legal force.
- Do not imply a stone is natural if it is lab-grown, or the reverse. This is
  the single most consequential factual claim on a jewellery page.
- Price transparency is rare in this trade. If the client will publish making
  charges, that alone is a competitive advantage worth building the page
  around.

---

## The 3D lessons already paid for

Do not relearn these. `flagship/3d-core.js` encodes most of them as defaults.

- **three.js 0.147.0 is the last clean UMD build on cdnjs.** r150+ warns,
  r160 removed UMD, r128 has no `transmission`/`ior`. Pinned for a reason.
- **A gem needs `metalness: 1.0`.** A physically-correct dielectric reflects
  only ~4% of its environment head-on; the other 96% is flat diffuse colour,
  which is literally white plastic.
- **Facet sparkle is environment contrast.** Hard-edged bright bands over
  near-black. A smooth gradient reflects as a smooth, dull stone. `GEM_ENV`
  is three rings of strip lights at even azimuths for exactly this reason.
- **A lit zenith is not optional.** The table — the big flat facet on top of
  every cut stone — points almost straight at the top edge of the equirect
  map. Left black, every small stone renders as a black hole with a gold
  outline.
- **Do not use real `transmission` here.** It needs something behind the
  stone to refract; on these dark pages there is only background.
- **An environment map belongs to one renderer.** Passing another stage's
  `env` hands it a texture from a foreign GL context and it samples as
  nothing — silently. `makeStage` rebuilds from the recipe when it sees one.
- **Derive seat heights, never guess them.** `brilliant(r)` spans `-1.32r` to
  `+0.42r` from the girdle.
- **Compose placement from a quaternion, not stacked Euler rotations.**
  `rotateX` then `rotateY` do not commute. Use `placeGeom()`.
- **Reveal the canvas before the first `resize()`.** A `[hidden]` canvas
  measures 0×0 and the renderer comes up 1×1.
- **Nothing reads as real while it floats.** Ground plane, contact shadow.

### Verifying 3D changes

`npm test` cannot see rendering. Every 3D bug in this repo's history was
invisible to the test suite and obvious in a screenshot. Recipe in
`netloom-build/references/qa.md` — and note that `--virtual-time-budget` does
not advance while a `requestAnimationFrame` loop is running, which these
pages run forever.
