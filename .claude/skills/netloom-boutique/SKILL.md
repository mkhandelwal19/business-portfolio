---
name: netloom-boutique
description: Build a Netloom client site on the boutique 3D flagship — boutiques, designer labels, saree houses and handloom studios. Covers the fabric and drape 3D study, the WEAVES data, what is swappable versus real 3D work, sizing and made-to-measure, the weaver-story content that carries the value, and when to use the store template instead. Use after netloom-build has run intake and picked this vertical.
---

# Boutique and label — the 3D flagship

**Template:** `boutique-lux/` · **Self-contained**: does *not* use
`demo.css` / `demo.js` · **3D:** `flagship/3d-core.js` + three.js 0.147.0 ·
**Reference build:** Riyaaz Boutique

Run `netloom-build` first. This file is only what is specific to boutiques.

---

## First: is this the right template?

Ask one question. **Do they sell online, or does the site drive people to
the shop?**

| They sell online | → `netloom-store` with a boutique skin. Cart, checkout, GST invoice, returns. |
| The site is a lookbook | → this one. A single page that makes the cloth desirable and gets them into the shop or into a WhatsApp conversation. |

Do not build a lookbook for someone who needs a cart. The prettiest page in
the world does not take money.

---

## What this actually is

A **single page** whose job is to win the meeting. Not a ten-page website.
Dark, and it stays dark — there is no light theme for the flagships.

The 3D is a **fabric and drape study**: the weave, the fall, the way light
moves across a length of cloth. It is not a photorealistic garment on a
photorealistic body, and it should not be sold as one.

---

## Swappable, versus real 3D work

### Swappable in under a day

- Business name, wordmark, all copy
- The photo gallery
- The `WEAVES` array — weave names, fibre, origin, description
- Colours, within the dark palette
- Section order

### Real 3D work — quote it separately

- A **new weave structure**. The material is procedural: a woven normal map,
  a roughness variation, a drape simulation. A new one is real work.
- A specific garment shape not already modelled.
- Anything that begins "can it show *our actual* saree" — it cannot, not
  without modelling and photographing that specific cloth. Say so early.

### The texture trap that has already cost time

**In three.js 0.147, only `map` gets a UV transform.** `normalMap`,
`roughnessMap` and the rest sample `vUv` directly and silently ignore their
own `repeat`. A weave tile set to `repeat(14, 20)` does not tile — it is
stretched once across the whole surface, and thread-scale relief comes out as
a quilted eiderdown a foot across.

Either bake the detail at the same scale as the colour map, or accept 1:1.

---

## Ask the client

1. **Which weaves or fabrics do you work in?** This drives the 3D. Jamdani,
   Kantha, Baluchari, Tussar, Khadi, Ikat, Chanderi — get the actual names,
   and the region each comes from.
2. Where is the cloth woven, and by whom? **This is the entire value
   proposition** and it is almost always undersold.
3. Size range. Standard sizes, or made-to-measure, or both?
4. Made-to-measure: what measurements do you need, what is the lead time,
   what does it cost extra?
5. Collections — how many a year, are they named, are they seasonal?
6. Price range, and do you publish prices?
7. Do you ship? Domestic only, or international?
8. Alterations — included or charged?
9. Care instructions per fabric. Handloom customers genuinely want this and
   it is content nobody else provides.
10. Do you take commissions or bridal orders?

---

## Content

| Slot | Guidance |
|---|---|
| Eyebrow | Craft and place — `Handloom · Shantiniketan` |
| `h1` | The cloth, not the brand |
| Sub | What is woven, where, by whom, and how long it takes |
| Weave study | The 3D, driven by `WEAVES` |
| Weave detail | Fibre · origin · loom · yardage |
| Gallery | Their actual garments |
| Weaver story | The single highest-value block on the page |
| Care | Per fabric. Nobody else publishes it. |
| CTA | `Visit the studio` or `Enquire on WhatsApp` |

---

## Photography

1. **Flat-lay of the cloth itself**, in daylight, close enough to see the
   weave. This is the hero and it does more than any garment shot.
2. Detail macros — the selvedge, the border, the stitch, a knot.
3. 6–9 garments, on a stand or flat, evenly lit and consistent.
4. The loom and the weaver's hands, if they can get them. This is the story.
5. The studio or shop interior.

**Model photography needs the model's written permission.** Faces are
optional — the cloth is the subject, and a cropped or turned-away frame often
sells the drape better anyway.

**Their own garments only.** Stock clothing on a boutique site is a
photograph of somebody else's product. Handloom customers are unusually
knowledgeable and will spot a Rajasthani print on a Bengali handloom page.

---

## Traps

- **Handloom versus powerloom is a factual claim**, and in this market it is
  a serious one. Do not write "handwoven" unless it is. Some customers pay a
  multiple for handloom specifically.
- **Do not name a GI-tagged weave loosely.** Jamdani, Baluchari, Kanjeevaram
  and others carry Geographical Indication protection. If the cloth is not
  from that region and tradition, it may not be called that.
- Do not claim "one of a kind" for something they reorder.
- Sizes must be in the measurements the customer understands. Publish a chart
  in inches and centimetres.
- If prices are not published, the WhatsApp CTA has to be immediate and
  obvious, or the page converts nothing.
- Colour accuracy matters more here than anywhere. Warn the client that
  screens vary, and put that line on the page.

---

## The 3D lessons already paid for

- **three.js 0.147.0**, pinned — last clean UMD on cdnjs.
- **Only `map` gets a UV transform** in 0.147. See above; this is the one
  that cost real time on this build.
- **An environment map belongs to one renderer.** Passing another stage's
  `env` hands it a texture from a foreign GL context and it samples as
  nothing — silently. A near-mirror surface goes pure black; metal keeps its
  highlights because those come from the discrete lights, so the symptom does
  not look like an environment problem. `makeStage` now rebuilds from the
  recipe when it sees one from another renderer.
- **Reveal the canvas before the first `resize()`.** A `[hidden]` canvas
  measures 0×0 and the renderer comes up 1×1.
- **Nothing reads as real while it floats.** Ground, contact shadow.

Verify visually. `npm test` cannot see rendering, and
`--virtual-time-budget` does not advance while a `requestAnimationFrame`
loop is running — which this page runs forever. Recipe in
`netloom-build/references/qa.md`.
