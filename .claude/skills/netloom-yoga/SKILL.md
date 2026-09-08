---
name: netloom-yoga
description: Build a Netloom client site on the yoga template — yoga studios, pilates, gyms, dance schools, martial arts, coaching centres and tuition. Covers the page map, theme class, the class schedule and pricing structure that carry the site, the trial-class conversion, teacher credentials and the health-claims rules. Use after netloom-build has run intake and picked this vertical.
---

# Yoga, fitness and coaching

**Template:** `yoga/` · **Theme class:** `theme-sage` (`#6B9E7A`) ·
**Reference build:** Praana Yoga Studio

Run `netloom-build` first. This file is only what is specific to this
vertical. The same template serves gyms, dance schools, martial arts and
tuition centres — the structure is identical, only the vocabulary changes.

---

## Pages

| # | File | Tier |
|---|---|---|
| 1 | `index.html` | Starter |
| 2 | `classes.html` | Starter — the schedule and the pricing |
| 3 | `about.html` | Starter |
| 4 | `contact.html` | Starter |
| 5 | `gallery.html` | Business |
| 6 | `testimonials.html` | Business |
| 7 | `faq.html` | Business |
| 8 | `booking.html` | Premium |
| 9 | `blog.html` | Premium |

`assets/photos/yoga-*.webp` — 24 reference images. **Note: all 24 contain
identifiable people in postures.** Read the photography section below.

---

## The one thing that matters

**The conversion is the trial class, not the membership.** Nobody commits to
a year of yoga from a website. They come to find out: when are the classes,
what does a beginner do, and can I try it once without committing.

So the primary CTA on every page is the trial, and `classes.html` must answer
"when" and "what should I book" in the first screen.

---

## Ask the client

1. **The full schedule** — day, time, class name, level, teacher, duration.
   Ask for the timetable as they display it in the studio.
2. **Levels**, and specifically: what should a complete beginner book? Most
   studios cannot answer this crisply and it is the single question every
   visitor has.
3. **Pricing:** drop-in, monthly, quarterly, annual, class packs. Any student
   or senior rate?
4. **Trial class** — do you offer one, what does it cost, how is it booked?
5. Teachers: name, training and lineage (which school, which certification —
   this genuinely matters in yoga), years teaching, what they specialise in.
6. Capacity per class. Do classes fill? Is booking required?
7. What to bring, what to wear, how early to arrive. This is the FAQ.
8. Do you do one-to-one or corporate sessions?
9. Prenatal, therapeutic, senior or kids classes? Each is a different
   audience and worth naming.
10. Changing rooms, showers, mats provided, parking.
11. *(gym)* Equipment list, trainer availability, peak hours.
12. *(coaching)* Boards and subjects, batch sizes, results — **only real,
    verifiable results.**

---

## Content slots

### Home

| Slot | Guidance | Example |
|---|---|---|
| Eyebrow | Locality + practice type | `Lake Gardens · Hatha & Vinyasa` |
| `h1` | Calm and specific, one `<em>` | `Breath first, <em>everything</em> follows.` |
| Sub | Concrete | `Six classes a day, six days a week. Small groups, never more than twelve. Beginners start on Tuesday.` |
| Stats | Since · Teachers · Classes/week · Class size | Real numbers only |
| Primary CTA | `Book a Trial Class` | |
| Secondary CTA | `See the Schedule` | |
| Features ×6 | Small groups · Beginner batches · Certified teachers · Mats provided · Early morning · Prenatal |
| CTA banner | `New to yoga? Start on Tuesday.` | |

### `classes.html`

Two blocks, in this order:

**The schedule** — a day-by-day grid. Time · class · level · teacher ·
duration. This is what people came for; put it above pricing.

**Pricing** — drop-in, class packs, monthly, quarterly. Show the per-class
cost of each pack so the value is visible without arithmetic.

Then a short "what to expect on your first visit" block: arrive 10 minutes
early, wear this, bring this, we provide that. It removes the anxiety that
stops beginners booking.

### `about.html`

Teacher bios live here. Training lineage matters enormously in yoga — which
school, which teacher, which certification. Get it exactly right; the
community notices.

The studio's own story goes above them.

---

## Photography — read this carefully

The 24 reference images in `assets/photos/yoga-*.webp` **all contain
identifiable people**, because a yoga photograph with nobody in it is a
photograph of a floor. That makes this the highest-risk vertical for
likeness, and `LICENCES.md` §2 at the repo root flags it as an open item.

Rules:

- **Client's own students, with written permission each.** Ask the studio to
  collect it. Most students say yes and are pleased.
- **Never name a student.**
- **Never present a stock person as a teacher.** Teacher photos must be the
  actual teachers. If a teacher will not be photographed, run the bio without
  one.
- Stock is acceptable for generic practice imagery where nobody is presented
  as belonging to this studio. Unsplash, Pexels, Pixabay only, source
  recorded.

Shot list:
1. The studio space, empty, in morning light. This is the hero and it does
   the most work — people want to see the room.
2. A class in progress, wide, from behind.
3. Props, mats, the altar or focal point if there is one.
4. Teachers, individually.
5. Exterior and entrance — small studios are hard to find.

---

## Traps

- **No health claims.** Not "cures back pain", not "guaranteed weight loss",
  not "boosts immunity". Describe the practice, not the outcome. This is the
  same rule as `netloom-clinic` and it applies just as hard.
- Schedules change constantly. Add a "schedule as of <month>" line and put
  updates in the care plan — this is the vertical where the care plan sells
  itself.
- Beginner guidance is the highest-converting content on the site and is
  always missing. Push for it.
- Do not build class booking with capacity limits unless someone will
  actually maintain the counts. An overbooked class is worse than a phone
  call.
- *(coaching)* **Results claims must be verifiable.** "12 students scored
  above 90%" needs to be true and defensible. Do not publish student names or
  photographs without written parental consent for minors.
- *(gym)* Do not publish trainer certifications you have not seen.

---

## JSON-LD

```json
{
  "@context": "https://schema.org",
  "@type": "ExerciseGym",
  "name": "<exact name>",
  "telephone": "+91-XXXXX-XXXXX",
  "address": { "@type": "PostalAddress", "…": "…" },
  "geo": { "@type": "GeoCoordinates", "latitude": 0, "longitude": 0 },
  "openingHoursSpecification": [],
  "priceRange": "₹₹"
}
```

`SportsActivityLocation`, `DanceSchool`, `EducationalOrganization` or
`School` where they fit better.
