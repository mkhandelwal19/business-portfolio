# Tiers, prices and what is actually in them

Prices as of 8 September 2026. If you change one, change it in `index.html`,
`build-routes.js`, `worker/src/templates.js`, `outreach/`, and here — then run
`node build-routes.js` and `node worker/preview.js`.

---

## The three tiers

| | Starter | Business | Premium |
|---|---|---|---|
| **Price** | ₹14,999 | ₹24,999 | ₹44,999 |
| **Care plan** | — | ₹1,999/mo (optional) | ₹3,499/mo (**quote it as part of the tier**) |
| **Delivery** | 5–7 days | 10–14 days | 3–4 weeks |
| **Pages** | 4 | 7 | 10, or a full store, or a 3D flagship |
| **Revisions** | 2 rounds | 2 rounds | 2 rounds |

### Starter — ₹14,999
Home · the one core page (menu / services / classes / collections) · About ·
Contact.

**Sell it when:** they need to exist, be findable, and be contactable. A
salon, a coaching centre, a gym, a sweet shop.

**What it does not have:** gallery, reviews, FAQ, booking. Say that plainly
on the call rather than letting them discover it.

### Business — ₹24,999
Starter + Gallery + Reviews + FAQ.

**Sell it when:** the customer chooses between them and two competitors and
needs a reason. Restaurants, boutiques, clinics, studios.

This is the default recommendation for most walk-in businesses. The gallery
is what closes it — people buy the room, not the paragraph.

### Premium — ₹44,999
Three shapes, one price. Pick the one the business actually needs.

1. **The 10-page site.** Business + three category-specific pages (booking,
   team, blog / bridal, custom orders, care guide / EMI calculator).
2. **The store** (`commerce/`). Catalogue, cart, checkout, GST invoice,
   order history, owner admin, and the four legal pages. See `netloom-store`.
3. **The 3D flagship** (`jewellery-lux`, `boutique-lux`, `realestate-lux`).
   A single, extraordinary page whose job is to win the meeting.

> **The retainer is not optional on a store.** A store is an operational
> relationship that continues forever — failed payments, stock
> discrepancies, refunds, delivery disputes. Flat ₹44,999 with no retainer
> makes it the least profitable thing on the price list. Quote ₹3,499/mo
> **with** the tier, in the same sentence, not as an upsell afterwards.

---

## Page maps

### Standard templates — `restaurant/` `healthcare/` `salon/` `yoga/`

Nine pages exist in each. The tier decides which ones ship.

| Page | restaurant | healthcare | salon | yoga | Tier |
|---|---|---|---|---|---|
| Home | `index.html` | `index.html` | `index.html` | `index.html` | Starter |
| Core | `menu.html` | `services.html` | `services.html` | `classes.html` | Starter |
| About | `about.html` | `about.html` | `about.html` | `about.html` | Starter |
| Contact | `contact.html` | `contact.html` | `contact.html` | `contact.html` | Starter |
| Gallery | `gallery.html` | `gallery.html` | `gallery.html` | `gallery.html` | Business |
| Reviews | `testimonials.html` | `testimonials.html` | `testimonials.html` | `testimonials.html` | Business |
| FAQ | `faq.html` | `faq.html` | `faq.html` | `faq.html` | Business |
| Booking | `booking.html` | `appointments.html` | `booking.html` | `booking.html` | Premium |
| Blog | `blog.html` | `health-tips.html` | `blog.html` | `blog.html` | Premium |

**Note there is no team page.** The team pages were deleted on 6 September
2026 because they presented stock portraits as named employees. If a client
wants one, it needs real photographs of real staff who have agreed to appear.
Build it then, not before. See `LICENCES.md` §2 at the repo root.

**Downgrading to a lower tier is a delete, and then a link sweep.** Removing
`gallery.html` without removing the nav link, the footer link and any inline
mention produces a 404 that the client will find in the first thirty seconds.

### The store — `commerce/`

Twelve pages, and none of them are optional:

`index` · `shop` · `product` · `cart` · `checkout` · `order` · `account` ·
`admin` · `shipping` · `refunds` · `terms` · `privacy`

The four legal pages are a launch blocker — Razorpay demands several of them
before it will activate an account.

### The 3D flagships — `jewellery-lux/` `boutique-lux/` `realestate-lux/`

One self-contained page each. They do **not** use `demo.css` / `demo.js`;
everything is inline, and the 3D comes from `flagship/3d-core.js` plus
three.js 0.147.0 from cdnjs.

A flagship's job is to win the meeting, not to be a complete website. If the
client needs ten pages *and* 3D, that is a flagship landing page plus a
standard site, and it is quoted as two things.

---

## Add-ons, and what to charge

Quote these as additions to a tier, not as negotiating room inside it.

| Add-on | Price | Notes |
|---|---|---|
| Extra page beyond the tier | ₹2,999 | Same template, new content |
| Online booking form | ₹3,999 | Form → WhatsApp + email. Not a calendar system. |
| Second language (Bengali / Hindi) | ₹4,999 | Real translation, not machine output |
| Logo redraw from a low-res original | ₹3,499 | Comes up constantly |
| Photography, half day, Kolkata | ₹5,000–₹12,000 | Passed through at cost, arranged by us |
| Google Business Profile setup | Free | Do it anyway. Highest-return 20 minutes in the project. |
| Domain email on Zoho, one mailbox | Free | Their account, their name |
| Third revision round | Quote it | Do not absorb it silently |

---

## Care plans

| | ₹1,999/mo | ₹3,499/mo |
|---|---|---|
| Hosting and domain renewals handled | ✓ | ✓ |
| Content updates | 2/month | Unlimited, reasonable |
| Uptime monitoring | ✓ | ✓ |
| Backups | ✓ | ✓ |
| Analytics report | Quarterly | Monthly |
| Payment / order support | — | ✓ |
| Response time | 2 working days | Same day |

Everything the care plan covers is work someone actually has to do. Do not
promise "unlimited changes" on the ₹1,999 plan.

---

## Scope creep — the four sentences that hold the line

1. *"That's not in this pack, but I can add it for ₹X — want me to?"*
2. *"Two rounds of changes are included, and this is round three. Let me quote it."*
3. *"I can do that, but it moves delivery to <date>. Your call."*
4. *"I'd rather not put that on the site — you can't back it up, and if a
   customer challenges it, it's you they'll challenge."*

The fourth one is the important one, and it is why we win against the
competition. See `intake-sop.md` Part D.
