---
name: netloom-realestate
description: Build a Netloom client site on the real estate 3D flagship — builders, developers, project sales and property brokers. Covers the UNITS floor-plan data shape, the 3D massing and walkthrough, RERA compliance which is a legal requirement on every page showing a price, carpet-versus-super-built-up area, the enquiry flow and the site-context modelling lessons. Use after netloom-build has run intake and picked this vertical.
---

# Real estate — the 3D flagship

**Template:** `realestate-lux/` · **Self-contained**: does *not* use
`demo.css` / `demo.js` · **3D:** `flagship/3d-core.js` + three.js 0.147.0 ·
**Reference build:** Saha Properties

Run `netloom-build` first. This file is only what is specific to property.

Highest-ticket clients on the list, and the clearest ROI story: one extra
enquiry that converts pays for the site many times over. Say that on the
call, because it is true and it is checkable arithmetic.

---

## RERA — read this before anything else

**The RERA registration number must appear on every page that shows a price,
a floor plan or a possession date.** This is a legal requirement under the
Real Estate (Regulation and Development) Act, not a nicety. Advertising a
registrable project without it exposes the promoter to penalties.

Additionally:

- **Carpet area is the legally defined figure.** If the client wants to show
  super built-up area, carpet area must be shown alongside it and given at
  least equal prominence.
- **Possession dates are commitments.** Publish the RERA-declared date, not
  an optimistic one.
- **Amenities shown must be committed in the sanctioned plan.** A clubhouse
  in the render that is not in the plan is a misrepresentation.
- Every render and floor plan needs a visible **"artist's impression,
  not to scale"** or **"indicative only"** line.

If the client pushes back on any of this, that is a red flag about the
project, not about the website. Put your position in writing.

---

## What this actually is

A **single page** whose job is to win the meeting: orbit a building massing
model, step through unit floor plans, get an enquiry. Not a ten-page site.

Dark, and it stays dark — there is no light theme for the flagships.

---

## Swappable, versus real 3D work

### Swappable in under a day

- Project name, developer name, all copy
- The photo gallery
- The `UNITS` array — **including the floor plans themselves**
- Colours, within the dark palette

The floor plans are data, not modelling. This is the most configurable of the
three flagships:

```js
var UNITS = [
  {
    code:'2B', name:'2 BHK', sub:'Tower A · east face',
    price:'₹1.42 Cr', area:'1,180', beds:'2', baths:'2', face:'East',
    w:12, d:9,                       // overall plan footprint
    rooms:[
      { x:0, z:0, w:6, d:5, k:LIVING, label:'Living / dining',
        f:[[0.8,0.7,3.2,1.1,0.42]] },   // furniture: x, z, w, d, height
      { x:6, z:0, w:3, d:3, k:WET, label:'Kitchen' },
      { x:0, z:5, w:6, d:4, k:BED, label:'Bedroom 1' }
    ]
  }
];
```

Room kinds are `LIVING`, `BED`, `WET`. Coordinates are metres from the
plan's origin. A new unit type is a new entry in this array — an afternoon,
not a modelling job.

### Real 3D work — quote it separately

- A **different building massing**. The tower is procedural; a different
  shape is real work.
- Interior walkthrough at eye level rather than plan view.
- Actual site context — the neighbouring buildings, roads and trees are
  generic. Matching a real plot is modelling.

---

## Ask the client

1. **Project name, exact location, and the RERA registration number.**
2. Developer name, and their previous completed projects.
3. **Possession date**, as declared to RERA.
4. **Every unit type:** code, name, tower, facing, **carpet area**, super
   built-up area if they insist, price, beds, baths.
5. **Floor plans** — as PDF, image or CAD. You need room dimensions and
   positions to fill in `UNITS`.
6. Amenities list — only what is in the sanctioned plan.
7. Approvals and bank tie-ups for loans.
8. Payment plan / construction-linked schedule.
9. **Who takes the enquiry, and how fast do they call back?** In property the
   answer is usually "within an hour" and that speed is the product. If
   nobody is going to call back, the website will not fix the business.
10. Site visit logistics — is there a site office, is there a show flat?
11. Broker or developer? A broker cannot make commitments about the project
    and the copy must not read as if they can.

---

## Content

| Slot | Guidance |
|---|---|
| Eyebrow | Location and status — `New Town · Under construction` |
| `h1` | The place, not the adjectives |
| Sub | Unit types, area range, price range, possession |
| Massing model | Orbit the tower with site context |
| Unit selector | From `UNITS` |
| Plan viewer | Room-by-room, with labels |
| Spec strip | Carpet area · beds · baths · facing · price |
| Amenities | Committed only |
| Location | Map, and honest distances to metro, schools, hospitals |
| **RERA line** | Registration number, visible, on every page with a price |
| CTA | `Book a site visit` |

---

## Photography

1. Actual construction progress, dated. Buyers want to see the real thing,
   not only renders — and a dated progress photo is more persuasive than any
   render.
2. The location — the road, the neighbourhood, the view from the plot.
3. Show flat interiors, if there is one.
4. Amenity areas as built.
5. Developer's completed previous projects. This is the trust signal.

**Renders must be labelled as renders.** Every single one. A render presented
as a photograph of a finished building is a misrepresentation with a
regulator attached.

---

## Traps

- **Never publish an appreciation or rental-yield projection.** "Expected 12%
  appreciation" is an investment claim and it is not ours to make.
- **Never say "sold out" or "only 3 left"** unless it is true and they can
  evidence it. Artificial scarcity in property is a regulated deception.
- Distances must be real. "5 minutes from the metro" is checkable and
  somebody will check it. Use actual walking or driving distance.
- Do not show amenities from a different project's render library.
- Prices change. Add "prices as of <month>, subject to change" and put price
  updates in the care plan.
- A broker's site must not read as the developer's site.
- If the project is not RERA-registered because it is below the threshold,
  say so explicitly rather than leaving a blank.

---

## The 3D lessons already paid for

- **three.js 0.147.0**, pinned — last clean UMD on cdnjs.
- **Lighting was the bug, not the model.** `LIGHTS` was copied from the
  jewellery flagship, where those values sit against a near-black environment
  map. Here they sit against a bright sky map that is already lighting the
  scene through `scene.environment`, so ambient 0.55 + key 2.0 + IBL + ACES
  clipped every surface to white — which is why the tower read as loose
  plates and the floor plan as a featureless tray. Lights are cut to roughly
  a fifth, glazing is dark against pale slabs, and the glass volume fills the
  whole storey pitch so the tower reads as one mass rather than a stack of
  shelves.
- **An environment map belongs to one renderer.** Passing another stage's
  `env` hands it a texture from a foreign GL context and it samples as
  nothing — silently. Both this page and `boutique-lux` shipped with a dead
  environment on their second canvas.
- **Nothing reads as real while it floats.** The tower was a diagram until it
  got a ground plane, a road, six neighbours and some trees. Site context is
  flagged `userData.n3ignoreFrame` so it can be as large as it needs to be
  without the camera pulling back to fit it.
- **Auto-frame every unit.** `frame()` recentres on the bounding box, so
  composition never depends on hand-tuned offsets — which matters because
  every new unit in `UNITS` is a different size.
- **Reveal the canvas before the first `resize()`.**

Verify visually. `npm test` cannot see rendering, and
`--virtual-time-budget` does not advance while a `requestAnimationFrame`
loop is running. Recipe in `netloom-build/references/qa.md`.
