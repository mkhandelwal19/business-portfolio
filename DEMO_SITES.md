# Demo sites — page inventory and navigation reference

Accurate as of 8 September 2026. For the business procedure around these
templates — intake, pricing, previews, go-live — see `NETLOOM_PLAYBOOK.md`.

## Tier summary

| Tier | Pages | Price | What's included |
|------|-------|-------|-----------------|
| Starter  | 4 pages | ₹14,999 | Home, core page, About, Contact |
| Business | 7 pages | ₹24,999 | Starter + Gallery, Reviews, FAQ |
| Premium | 9+ pages | ₹44,999 | Business + Booking and Blog — or a full store, or a 3D flagship |

---

## What exists

Eight verticals, three template families.

| Vertical | Business name | Template | Family | Theme | Pages |
|---|---|---|---|---|---|
| Restaurant & cafe | Aangan Thali House | `/restaurant` | standard | `theme-ember` | 9 |
| Clinic & healthcare | Basu Family Clinic | `/healthcare` | standard | `theme-mint` | 9 |
| Salon & spa | Lumière Salon & Spa | `/salon` | standard | `theme-plum` | 9 |
| Yoga & fitness | Praana Yoga Studio | `/yoga` | standard | `theme-sage` | 9 |
| Online store | Kaarigar | `/commerce` | commerce | own light system | 12 |
| Jewellery | Vaira | `/jewellery-lux` | 3D flagship | own dark system | 1 |
| Boutique | Sutra | `/boutique-lux` | 3D flagship | own dark system | 1 |
| Real estate | Anvaya Residences | `/realestate-lux` | 3D flagship | own dark system | 1 |

### Retired, 6 September 2026

`boutique/`, `jewellery/`, `ecommerce/` and `realestate/` — the standard
9-page demos for those four verticals — were deleted in favour of their
premium replacements:

```
ecommerce  →  commerce/          a store that actually transacts
jewellery  →  jewellery-lux/
realestate →  realestate-lux/
boutique   →  boutique-lux/
```

All eight verticals still answer to their own words in the industry switcher
and the hero preview; four of them now open the premium page instead.
`restaurant`, `healthcare`, `salon` and `yoga` were untouched, because they
have no premium version and deleting them would have left those verticals
with nothing at all.

### No team pages

`restaurant/team.html`, `salon/team.html`, `realestate/team.html`,
`healthcare/doctors.html` and `yoga/teachers.html` were deleted on
6 September 2026, along with their 88 inbound links and all 18 portrait
images. They presented stock portraits as specific named employees, which
asserts a professional relationship that does not exist. See `LICENCES.md` §2.

If a client wants a team page, it needs real photographs of real staff who
have agreed to appear. Build it then.

---

## Page inventory — the four standard templates

Each has 9 pages. The tier decides which ship.

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

## Page inventory — the store

`commerce/` — twelve pages, none of them optional.

| Page | File | What it is |
|---|---|---|
| Storefront | `index.html` | |
| Catalogue | `shop.html` | Search, filter, sort |
| Product | `product.html` | Variants, add to cart |
| Cart | `cart.html` | Survives a reload |
| Checkout | `checkout.html` | Validates, payment handshake |
| Order | `order.html` | Confirmation + GST invoice |
| Account | `account.html` | Order history |
| Admin | `admin.html` | Owner view |
| Shipping | `shipping.html` | **Legal — launch blocker** |
| Refunds | `refunds.html` | **Legal — launch blocker** |
| Terms | `terms.html` | **Legal — launch blocker** |
| Privacy | `privacy.html` | **Legal — launch blocker** |

Razorpay reads the four legal pages during account activation and rejects
placeholder text.

## The 3D flagships

One self-contained page each. They do **not** use `demo.css` / `demo.js`.
3D comes from `flagship/3d-core.js` plus three.js 0.147.0 from cdnjs.

A flagship's job is to win the meeting, not to be a complete website.

---

## Technical notes

- **Total**: 36 standard demo pages + 12 store pages + 3 flagships = 51
- **Stack**: vanilla HTML / CSS / JS. No framework, no bundler.
- **Hosting**: static, GitHub Pages, `netloom.in`
- **Photography**: `assets/photos/` — 216 WebP originals plus `xs`/`sm`/`md`
  derivatives. **Provenance unrecorded — see `LICENCES.md` §1, open risk.**
- **Fonts**: Playfair Display, DM Sans, JetBrains Mono via Google Fonts.
  The flagships use Cormorant Garamond.
- **Icons**: Font Awesome 6.5.1 via cdnjs
- **Tests**: `npm test` — 386 assertions across 8 suites

### Themes

Eight category accent classes in `demo.css`, set on `<body>`:

| Class | Accent | Category |
|---|---|---|
| `theme-ember` | `#D9823C` | Restaurant |
| `theme-mint` | `#4DA99A` | Healthcare |
| `theme-plum` | `#9B59B6` | Salon |
| `theme-pearl` | `#C9A07A` | Boutique |
| `theme-sage` | `#6B9E7A` | Yoga |
| `theme-gold` | `#C9A84C` | Jewellery |
| `theme-saffron` | `#E8A13E` | Ecommerce |
| `theme-cocoa` | `#B8895A` | Real estate |

The last four have no standard demo any more but the classes remain, because
a client build in any of those verticals starts from a standard template.

### Light and dark

The four standard templates ship **both palettes**. Selected by
`data-theme="light"` on `<html>`; the control is in the preview bar and
`demo.js` remembers the choice across pages.

- Dark is the default and stays the default.
- `?theme=light` or `?theme=dark` on any demo URL forces one, and it sticks
  as the visitor clicks through — useful for sending a client one specific
  register.
- `?embed=1` (the homepage hero preview iframe) ignores the stored
  preference, so the homepage's own choice is never overridden.
- **Accent used as text must go through `--accent-ink`, never `--accent`**,
  and text on an accent fill through `--on-accent`, never `--bg`. `npm test`
  asserts both — the raw accent on paper is about 2.2:1 and unreadable.
- The flagships are dark only, deliberately: the gem and material rendering
  depends on a near-black environment map.

### Interactive

- `demo.js` drives the industry switcher, mobile nav, FAQ accordions, gallery
  filters, listing sort, jump-nav scroll spy, the live open/closed state, the
  `?biz=` personalisation, the theme control and the cookie banner.
- Booking calendars and time-slot grids are **demonstrations**. They do not
  reserve anything.
- `commerce/` is genuinely clickable end to end. Only the payment is
  simulated, and the page says so.
