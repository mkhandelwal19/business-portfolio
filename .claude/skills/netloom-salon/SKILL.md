---
name: netloom-salon
description: Build a Netloom client site on the salon template — salons, spas, beauty parlours, barbers, nail bars and makeup artists. Covers the page map, theme class, the service-menu structure that drives most of the value, bridal as an upsell, booking flow and the photography and claims rules. Use after netloom-build has run intake and picked this vertical.
---

# Salon and spa

**Template:** `salon/` · **Theme class:** `theme-plum` (`#9B59B6`) ·
**Reference build:** Lumière Salon & Spa, Park Street

Run `netloom-build` first. This file is only what is specific to salons.

---

## Pages

| # | File | Tier |
|---|---|---|
| 1 | `index.html` | Starter |
| 2 | `services.html` | Starter — the price list. The whole point of the site. |
| 3 | `about.html` | Starter |
| 4 | `contact.html` | Starter |
| 5 | `gallery.html` | Business |
| 6 | `testimonials.html` | Business |
| 7 | `faq.html` | Business |
| 8 | `booking.html` | Premium |
| 9 | `blog.html` | Premium |

`assets/photos/salon-*.webp` — 31 reference images.

---

## The one thing that matters

**People come to a salon website to find out what it costs.** Not to admire
the design. A salon that publishes its price list beats one that says "call
for pricing", because the customer is deciding between three salons at
11pm and will not call any of them.

So `services.html` is the page, and it needs every service with a starting
price and a duration.

---

## Ask the client

1. **The full service menu.** Ask for a photo of the physical price card.
   Every service needs: name, starting price, duration, and which category it
   belongs to.
2. Why prices vary — hair length, condition, product choice. Get their actual
   sentence for it, because it goes at the top of the page and it prevents a
   hundred phone calls.
3. Which services need a consultation first?
4. **Do you do bridal?** If yes, that is a separate high-value section or
   page, with its own package prices and lead times. Bridal is where the
   money is and it is usually buried.
5. Stylists — how many, and do you want them named? What are their
   specialities?
6. **Walk-ins or appointment only?** What is the typical wait for a walk-in?
7. Product brands used. Clients recognise them and they signal tier — L'Oréal
   Professionnel, Wella, Olaplex, Kérastase.
8. Men, women, or both? Separate areas?
9. Home service? Extra charge and radius?
10. Loyalty scheme or memberships?
11. Cancellation policy for appointments.

---

## Content slots

### Home

| Slot | Guidance | Example |
|---|---|---|
| Eyebrow | Locality + year | `Park Street · Est. 2016` |
| `h1` | The promise, one `<em>` | `Where beauty meets <em>craft</em>.` |
| Sub | Concrete | `Eight years of expert cuts, colour, and care. Kolkata's most trusted salon for working professionals and bridal looks.` |
| Stats | Est. · Stylists · Happy clients · Rating | Real numbers only |
| Primary CTA | `Book Appointment` | |
| Secondary CTA | `See Services` | Straight to the price list |
| Features ×6 | Consultation included · Bridal packages · Evening slots · Product brands · Loyalty · WhatsApp booking |
| CTA banner | `Ready for a change?` | |

### `services.html`

Jump-nav categories, five or six maximum: Hair · Colour & Chemical ·
Skin & Face · Nails · Bridal.

Per service:
- Name (≤6 words)
- Description, 10–18 words, in the customer's language — *"Shampoo, precision
  cut, and blow-dry finish by a senior stylist"*
- **Starting price**, written as `₹800+` when it varies
- Duration — `45 min`
- A `BOOK` action

Top of page, in the intro: *"Starting prices shown; final cost may vary based
on hair length and condition."* That one sentence is the most useful thing on
the page.

The stat chips under the intro — free consultation, N services across N
categories, from ₹X, today's walk-in time — do real work. Fill them in.

### `booking.html`

Demonstration only; submits to WhatsApp or email. Say *"we'll confirm your
slot"*, never *"booked"*. Include the cancellation policy on the page.

---

## Photo shot list

1. **The interior**, in daylight, empty and immaculate. This is the hero. A
   salon sells the room.
2. Styling stations, the wash area, the treatment room.
3. 6–8 finished-work photographs — a cut, a colour, a bridal look, nails.
   These carry the gallery.
4. Products on the shelf, if the brands are recognisable.
5. Stylists at work — hands and technique, not necessarily faces.
6. Exterior and signage.

**Finished-work photos need the client's customer's permission.** A woman's
face on a salon website is a personal thing. Ask, get a yes in writing, and
give her a way to change her mind later. If in doubt, shoot from behind or
crop to the hair.

Stock is acceptable for products and abstract texture. It is not acceptable
for "this is our work" — regulars will know it is not, and the whole page
loses credibility with it.

---

## Traps

- **No outcome or medical claims.** Not "permanent", not "guaranteed
  results", not "cures hair fall", not "clinically proven" without the
  clinical study. Skin and hair treatments attract this language and it must
  be trimmed.
- Before/after images are a claim. If used, they must be genuine, of the same
  person, in comparable lighting, with permission.
- Do not publish stylist names unless the client is sure they will stay.
  Salons have turnover, and a named page goes stale fast.
- Prices go stale. Add a "prices as of <month>" line and put price updates in
  the care plan.
- Get bridal lead times right — brides book six months out and a wrong
  lead time loses the highest-value booking on the list.
- Do not build a payment flow for deposits without a written cancellation
  policy.

---

## JSON-LD

```json
{
  "@context": "https://schema.org",
  "@type": "HealthAndBeautyBusiness",
  "name": "<exact name>",
  "priceRange": "₹₹",
  "telephone": "+91-XXXXX-XXXXX",
  "address": { "@type": "PostalAddress", "…": "…" },
  "geo": { "@type": "GeoCoordinates", "latitude": 0, "longitude": 0 },
  "openingHoursSpecification": []
}
```

`BeautySalon`, `HairSalon`, `DaySpa` or `NailSalon` where they fit better.
