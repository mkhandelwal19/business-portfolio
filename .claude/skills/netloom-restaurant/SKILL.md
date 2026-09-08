---
name: netloom-restaurant
description: Build a Netloom client site on the restaurant template — restaurants, cafes, thali houses, sweet shops, bakeries, cloud kitchens and caterers. Covers the page map, the theme class, every content slot, the food-specific intake questions, the photo shot list and the FSSAI and menu-marker requirements. Use after netloom-build has run intake and picked this vertical.
---

# Restaurant, cafe and food

**Template:** `restaurant/` · **Theme class:** `theme-ember` (warm orange
`#D9823C`) · **Reference build:** Aangan Thali House, Ballygunge

Run `netloom-build` first for intake, assets and deployment. This file is
only what is specific to food.

---

## Pages

| # | File | Tier | What it is |
|---|---|---|---|
| 1 | `index.html` | Starter | Home |
| 2 | `menu.html` | Starter | The menu. The most-visited page on the site. |
| 3 | `about.html` | Starter | The story |
| 4 | `contact.html` | Starter | Address, hours, map, form |
| 5 | `gallery.html` | Business | Food and room |
| 6 | `testimonials.html` | Business | Reviews |
| 7 | `faq.html` | Business | |
| 8 | `booking.html` | Premium | Table reservation |
| 9 | `blog.html` | Premium | |

`assets/photos/restaurant-*.webp` — 24 reference images with derivatives.

---

## The one thing that matters

**People come to the website to look at the menu, and then to find out if you
are open.** Everything else is secondary. If the menu is hard to read on a
phone, or if the hours are wrong, the site has failed regardless of how good
it looks.

So: `data-hours` on the local bar must be exact, and `menu.html` must be one
tap from anywhere.

---

## Ask the client

Beyond `intake-sop.md` Part A:

1. **The full menu, with prices.** Ask them to photograph the physical menu
   card — faster than dictation and it is authoritative. Get section headings
   too.
2. **Veg / non-veg / Jain / egg markers.** Non-negotiable in this market. If
   they have not marked them, go back and ask again.
3. Does the menu change? Daily board, seasonal, festival specials?
4. **Do you take table bookings?** Phone, WhatsApp, or a form? Do you hold
   tables, and for how long?
5. Do you deliver? Own riders, Swiggy, Zomato? Get the actual links.
6. Covers (seats). Private parties, catering, bulk orders?
7. **FSSAI licence number.** Legally required on display.
8. Payment methods — UPI, card, cash only?
9. Alcohol served? Changes the tone and it has its own licence display rules.
10. **One dish you are known for.** It becomes the hero image and the
    headline. If they say "everything", ask what people order twice.

---

## Content slots

### Home

| Slot | Guidance | Example |
|---|---|---|
| Eyebrow | Year + locality | `Since 1968 · Gariahat, Kolkata` |
| `h1` | Cuisine + the thing that distinguishes it. One `<em>`. | `Bengali thali, cooked <em>slow</em>.` |
| Sub | Concrete and countable | `Four generations of recipes. A changing board of eleven seasonal items, served fresh every afternoon.` |
| Stats | Best for · Open · Covers · Since | `Families & Food Lovers` · `Tue–Sun 12–3:30 PM` · `48 Tables` · `1968` |
| Primary CTA | `Reserve a Table` / `Order on WhatsApp` | Whichever they actually want |
| Secondary CTA | `See Today's Menu` | |
| Features ×6 | What the customer gets | Daily menu board · Table booking · Heritage story · Direct order · Maps ready · Review capture |
| Menu preview | 4–6 signature dishes with prices | Links to `menu.html` |
| CTA banner | A question | `Ready to reserve your table?` |

### `menu.html`

The jump nav pills are the menu sections — Starters, Thali, Mains, Breads,
Sweets, Drinks. Six is the comfortable maximum.

Per item: name (≤6 words) · description (10–18 words) · price · veg marker.

Descriptions should say what is in it, not how good it is. *"Mustard, green
chilli, steamed in a banana leaf"* sells; *"a delicious traditional
preparation"* does not.

If prices change often, put a line at the top: *"Prices as of <month>. Ask
for today's board."* Then it is never wrong.

### `about.html`

Food businesses have the best stories and almost never tell them. Record two
minutes of the owner talking and use it close to verbatim.

The process timeline — market morning, prep, kitchen opens, service — is
genuinely interesting to customers and almost nobody publishes it. Ask for
the real times.

### `booking.html`

The calendar and slot grid in `demo.js` is a **demonstration**. It does not
hold a table or check availability. It submits to WhatsApp or email. The page
must say *"we'll confirm within the hour"*, never *"booked"*.

---

## Photo shot list

Ask for, in this order of value:

1. **The signature dish**, shot from above, in daylight, on the real table.
   This is the hero and it is worth more than everything else combined.
2. The room, empty, in daylight — people want to know what it looks like.
3. The room full, in service — people want to know it is busy.
4. 6–8 individual dishes for the gallery and menu.
5. The kitchen, or hands cooking.
6. The owner or the family, if they are comfortable.
7. The exterior with signage — this is how people recognise it from the
   street.

**Food photographs must be the client's own.** Stock food is the most
obviously fake thing you can put on a restaurant site, and regulars will spot
that it is not the actual thali immediately. If they genuinely have nothing,
a ₹5,000 half-day shoot is the best money in the whole project — sell it.

---

## Traps

- **Hours.** Lunch-only, closed Mondays, different on Sundays, shut for two
  weeks at Puja. Get every variation. A wrong "Open now" costs a customer
  who drove there.
- **Last order time** is always different from closing time and never
  volunteered.
- **Never invent a review.** Restaurants live on reviews and it is the most
  tempting place to fake one. Link the real Google profile instead.
- **Never write "the best biryani in Kolkata"** unless they can point at
  something that says so.
- **Do not publish a home address** for a cloud kitchen or home baker without
  asking. Many run out of a residence.
- FSSAI number goes in the footer.
- If they are on Swiggy/Zomato, link out — do not try to replicate ordering.

---

## JSON-LD

```json
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "<exact name>",
  "servesCuisine": "<cuisine>",
  "priceRange": "₹₹",
  "telephone": "+91-XXXXX-XXXXX",
  "address": { "@type": "PostalAddress", "streetAddress": "…",
    "addressLocality": "Kolkata", "postalCode": "700019",
    "addressRegion": "WB", "addressCountry": "IN" },
  "geo": { "@type": "GeoCoordinates", "latitude": 0, "longitude": 0 },
  "openingHoursSpecification": [{ "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Tuesday","…"], "opens": "12:00", "closes": "15:30" }],
  "acceptsReservations": true
}
```

Use `Bakery`, `CafeOrCoffeeShop` or `FoodEstablishment` where they fit better.
Real coordinates — right-click the exact spot in Google Maps.
