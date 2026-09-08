# Content slots — what goes where, and how long

Every slot in the standard templates, with the length that actually fits.
Going over the limit does not break the layout; it makes the page look like a
document instead of a design, which is worse.

Word counts are for English. Bengali and Hindi run roughly 15% longer for the
same meaning — trim accordingly.

---

## Site-wide

| Slot | Where | Limit | Notes |
|---|---|---|---|
| Business name | `.nav-logo`, footer, `<title>`, JSON-LD | 2–3 words visible | Long names get shortened in the nav ("Aangan Thali House" → "Aangan"). The full name stays in `<title>` and JSON-LD. |
| Wordmark accent | `<em>` inside `.nav-logo` | 1 word or the final syllable | This is the italic accent-coloured part. Pick the memorable half. |
| Meta description | `<head>` | 150–160 chars | Written for a human reading search results, not for a crawler. Include the locality. |
| Theme class | `<body class="theme-…">` | — | One of the eight. The vertical skill names it. |
| Phone / WhatsApp | Local bar, contact, footer, floating button | — | Country code on WhatsApp links: `918249992869`, no `+`, no spaces |
| Hours | `.local-bar[data-hours]` | — | Drives the live open/closed dot. Every day, including closed days. |

### `data-hours` format

```html
<div class="local-bar" data-hours="tue-sun 12:00-15:30">
```

Comma-separate multiple blocks: `data-hours="mon-fri 09:00-13:00,mon-fri 17:00-20:00"`.
Days are three-letter lowercase. A day not listed is closed.

### JSON-LD

Every page carries a schema block in `<head>`. Change `@type` to match the
business — `Restaurant`, `MedicalClinic`, `HealthAndBeautyBusiness`,
`ExerciseGym`, `Store`, `JewelryStore`, `RealEstateAgent`. Fill in the real
address, real phone, real geo coordinates and real opening hours.

**Only put facts in the JSON-LD.** It is the machine-readable version of the
page and inventing a `priceRange` or an `aggregateRating` there is the same
lie as putting it in the copy, with the added problem that Google may
penalise it.

---

## Home — `index.html`

| Slot | Selector | Limit | Guidance |
|---|---|---|---|
| Eyebrow | `.hero-eyebrow` | 4–7 words | Locality and a date or credential. *"Since 1968 · Gariahat, Kolkata"* |
| Headline | `.hero h1` | 3–6 words, two lines | One `<em>` word carries the accent colour and the italic. Make it the word that means something. *"Bengali thali, cooked **slow**."* |
| Sub | `.hero p` | 20–35 words | What they get, concretely. Not adjectives — *"a changing board of eleven seasonal items"* beats *"authentic and delicious"*. |
| Stat row | `.hero-stats` | 4 items, ≤3 words each | Label + value. Only real numbers. Drop the whole item rather than estimate. |
| Primary CTA | `.btn-primary` | 2–3 words | The conversion from intake Q6. Exactly one primary. |
| Secondary CTA | `.btn-ghost` | 2–3 words | The browse action |
| Hero image | `.hero-art img` | — | The single best photograph they have. Eager-loaded. |
| Section title | `.section-title` | 4–7 words | One `<em>` word again |
| Feature cards | `.feature` × 6 | h4 ≤4 words, p 15–25 words | What the business does for the customer, not a feature list of the website |
| Stats band | `.stats` | 3–4 items | Real numbers only |
| Core preview | varies | 4–6 items | A taste of the menu / services / classes, linking to the full page |
| Testimonials | `.testimonial` × 3 | 25–45 words each | **Real reviews only.** Name + one locating detail ("Priya, Ballygunge"). No reviews → delete the section and its link. |
| CTA banner | `.cta-text h3` | 5–8 words | A question. *"Ready to reserve your table?"* |

---

## The core page — menu / services / classes / collections

The commercial heart of the site. Most visitors land here second.

| Slot | Limit | Guidance |
|---|---|---|
| Page title | 2–4 words | |
| Intro | 20–30 words | Set expectations — *"Starting prices shown; final cost varies with hair length"* prevents a hundred phone calls |
| Jump nav | 3–6 categories | `.jump-nav` pills, scroll-spy driven by `demo.js` |
| Section headings | 2–4 words | One per category |
| Item name | ≤6 words | |
| Item description | 10–18 words | What it is, not how wonderful it is |
| Item price | — | `₹800+` if it varies. "On request" is fine and honest. |
| Item meta | ≤4 words | Duration, portion, level |

Vegetarian / non-vegetarian / Jain markers on food are not optional in this
market. If the client has not given them, ask again before shipping.

---

## About — `about.html`

The page nobody thinks matters and everybody reads before spending money.

| Slot | Limit | Guidance |
|---|---|---|
| Title | 3–5 words | |
| Origin story | 2 blocks, 40–70 words each | **From the recorded intake call.** A person saying "my grandmother started it in the back room" in their own words beats any copywriting. |
| Story image | — | An old photograph if they have one. Ask specifically. |
| Values | 3 cards, h4 ≤4 words, p 20–30 words | Sourcing, philosophy, promise. Concrete, not aspirational. |
| Process timeline | 4 steps, h4 ≤3 words, p 15–20 words | A day in the business. Genuinely interesting and almost nobody publishes it. |
| CTA | 5–8 words | |

**No team section.** The team pages were removed from these templates because
they used stock portraits under invented names. Build one only when there are
real photographs of real staff who have agreed to appear.

---

## Contact — `contact.html`

| Slot | Notes |
|---|---|
| Title / intro | 15–25 words, warm |
| Address card | Full postal address as the client gave it |
| Phone / WhatsApp / email cards | Working `tel:`, `wa.me` and `mailto:` links |
| Hours card | Must match `data-hours` exactly |
| Getting here | Nearest metro/station, parking, landmark. **Locals navigate by landmark, not address.** |
| Map | `https://maps.google.com/maps?q=<url-encoded address>&z=16&output=embed`. No API key needed. Do not filter or invert it — that would obscure Google's attribution, which the terms forbid. |
| Form | Name, phone, subject, message. Posts to the Cloudflare Worker. |

---

## Gallery · Reviews · FAQ *(Business tier)*

**Gallery** — 9–12 photographs minimum. Fewer looks like a placeholder.
Filter categories (Food / Kitchen / Ambiance / Events) are driven by
`data-cat` on each item. Every image needs real alt text.

**Reviews** — real ones only. Name, one locating detail, 25–45 words. If
there are fewer than four, use fewer cards rather than padding with fiction.
Link the Google Business Profile so people can verify.

**FAQ** — 8–12 questions, straight from intake Q29. Answer in 25–50 words.
Answer the awkward ones (price, cancellation, parking, waiting time) — those
are the ones people actually came for, and answering them plainly is the
whole credibility argument.

---

## Booking · Blog *(Premium tier)*

**Booking** — the calendar and time-slot grid in `demo.js` is a demonstration,
not a reservation system. It does not hold a slot or check availability. It
must submit to WhatsApp or email, and the page must not imply the booking is
confirmed. Say "we'll confirm within the hour", not "booked".

**Blog** — 3–4 posts at launch, 300–500 words each. Do not ship an empty
blog; an empty blog is worse than no blog. If the client will not write, do
not sell the page.

---

## Both themes

Every standard template ships light and dark. When writing or restyling:

- **Accent as text must use `--accent-ink`, never `--accent`.** The raw
  accent on paper is around 2.2:1 and unreadable. `npm test` asserts this.
- **Text on an accent fill uses `--on-accent`, never `--bg`.** `--bg` is
  near-black in dark and near-white in light; using it as a foreground gives
  white text on gold the moment someone switches.
- Check both. `?theme=light` on any URL, or the switch in the preview bar.
- Photo scrims are tokenised (`--scrim`, `--scrim-soft`) and already tuned
  per theme. Do not add your own gradient over a photograph.

---

## Voice

The same discipline as netloom.in's own copy, applied to the client:

- **Specific beats grand.** "Eleven seasonal items, changed daily" beats
  "an extensive and authentic menu".
- **No superlatives you cannot support.** Not "the best", not "the finest",
  not "award-winning" without the award.
- **No invented numbers.** No client counts, no years in business, no
  "10,000+ happy customers" unless it is true and they can show you.
- **Short sentences.** These are read on a phone, one-handed, on mobile data.
- **Write for the customer, not the owner.** The owner wants "we use premium
  imported products". The customer wants "your colour will not fade in six
  weeks".
