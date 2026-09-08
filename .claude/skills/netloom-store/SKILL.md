---
name: netloom-store
description: Build a Netloom client store on the commerce template — any business that needs to take money on the site. Covers the twelve-page map, the catalogue data shape, GST and paise arithmetic, the four mandatory legal pages, Razorpay and Supabase setup in the client's name, the Worker secrets, and why this tier must carry a monthly retainer. Use after netloom-build has run intake and the client wants to transact.
---

# Online store — the ₹44,999 tier

**Template:** `commerce/` · **Design system:** `commerce/store.css`, light by
design · **Reference build:** Kolkata Craft Co.

Run `netloom-build` first. Read `commerce/README.md` in the repo — it is the
authoritative technical document and this file does not repeat all of it.

---

## Before you sell this

**A store is an operational relationship, not a delivery.** Failed payments,
stock discrepancies, refunds, delivery disputes and chargebacks continue
forever. A flat ₹44,999 with no retainer makes this the least profitable
thing on the price list.

**Quote ₹3,499/month as part of the tier, in the same sentence.** Not as an
upsell afterwards.

And ask the qualifying question early: **who packs and ships the boxes?** If
the answer is vague, the store will fail for reasons that have nothing to do
with the website, and it will be remembered as our failure.

---

## Pages — all twelve, none optional

| Page | What it is |
|---|---|
| `index.html` | Storefront |
| `shop.html` | Catalogue, search, filter, sort |
| `product.html` | One product, variants, add to cart |
| `cart.html` | Cart, survives a reload |
| `checkout.html` | Address, validation, payment handshake |
| `order.html` | Confirmation and GST invoice |
| `account.html` | Order history |
| `admin.html` | Owner view of orders |
| `shipping.html` | **Legal** |
| `refunds.html` | **Legal** |
| `terms.html` | **Legal** |
| `privacy.html` | **Legal** |

The four legal pages are a **launch blocker**. Razorpay reads them during
account activation and rejects placeholder text. Write them properly, from
the client's actual policies collected at intake.

### Supporting files

| File | What it is |
|---|---|
| `catalog.js` | The products. Shaped like database rows so moving to Supabase is a change of source, not a rewrite. |
| `store.js` | Cart, money, GST, search, orders, checkout handshake. No page-specific DOM. |
| `chrome.js` | Header and footer, injected. Twelve pages cannot drift apart if there is one copy. |
| `card.js` | One product tile, rendered identically on storefront and catalogue. |
| `store.css` | The design system. |

---

## The rule the whole build is organised around

> **The browser never decides what something costs, and never decides that a
> payment succeeded.**

Both live in `worker/src/commerce.js`, and both have tests.

- `priceBasket()` takes SKUs and quantities and looks the prices up itself. A
  client that posts `{sku, qty, price: 100}` gets charged the real price.
- `handleVerify()` recomputes Razorpay's HMAC-SHA256 over
  `order_id|payment_id` with the key **secret**, compared in constant time.

A client-side `if (response.status === 'paid')` is a wish, not a check.
Anyone with devtools open can make a browser say anything.

---

## Money

**Integer paise, everywhere. Never floats.** `0.1 + 0.2 !== 0.3`, and a store
that is a rupee out on one order in a thousand is a store nobody trusts
twice. ₹3,450.00 is `345000`.

**GST is backed out of an inclusive price, never added on.** Indian retail
prices are quoted with tax included. Adding 12% to a shelf price overcharges
every customer. Confirm this with the client explicitly — some will assume
the opposite.

GST rate is **per product**, because it genuinely differs: handicrafts are
mostly 12%, textiles under ₹1,000 are 5%. Getting it wrong is a compliance
problem, not a rounding one.

---

## The catalogue

Per product, collect all of this at intake:

```js
{
  sku: 'DHK-NANDI-01',          // stable, never reused
  name: 'Dhokra Nandi',
  cat: 'metalwork',
  price: 345000,                 // PAISE, GST-inclusive
  mrp: 398000,                   // paise, for the strike-through. Must be real.
  gst: 12,                       // percent
  hsn: '7419',                   // required on a GST invoice
  photo: 'ecommerce-28',         // basename in assets/photos
  stock: 6,
  rating: 4.8, reviews: 34,      // ONLY if real
  craft: 'Dhokra lost-wax casting',
  origin: 'Bikna, Bankura',
  blurb: '…',                    // 25-40 words, what it is and why it is made that way
  variants: [
    { id: 'sm', label: 'Small · 4 in', delta: 0 },
    { id: 'md', label: 'Medium · 7 in', delta: 96000 }   // delta in paise
  ]
}
```

Client-facing intake checklist per product: **name · price · GST rate · HSN
code · stock · variants · one paragraph · photos · weight and dimensions for
shipping.**

Under about 50 products this stays a static file. Above that, or if stock
moves fast, it needs Supabase from day one — say so in the quote.

**`mrp` must be a real previous or list price.** A fabricated
strike-through is a misleading commercial practice under Indian consumer law,
not a design flourish.

---

## Ask the client

Beyond `intake-sop.md` Part A:

1. Product count now, and in a year.
2. Every product's data, as above.
3. **GST number**, and confirmation that prices are GST-inclusive.
4. **Shipping:** which courier, which zones, what it costs, how long,
   free-shipping threshold, what happens to a lost parcel.
5. **Returns:** window, condition required, who pays return postage, how the
   refund is issued and in how many days.
6. **Cancellations:** before dispatch, after dispatch.
7. Do they have a Razorpay account? *(It is opened in their name.)*
8. Bank account and PAN for Razorpay KYC.
9. Who packs and ships? What happens when they are on holiday?
10. Stock: is it one-of-one handmade, or replenishable?
11. COD? *(Recommend against it for a first store — the reconciliation
    burden is disproportionate.)*
12. Invoice requirements — do B2B customers need a GST invoice with their
    GSTIN on it?

---

## Going live with real money — four steps

Full detail in `commerce/README.md`. In order:

### 1. Razorpay, in the client's name
Not ours. They will need PAN, bank account, GSTIN and the four legal pages.
Start in **test mode** — test keys look like `rzp_test_…`.

### 2. Supabase, also in the client's name
Region Mumbai (`ap-south-1`), for latency and data residency. Tables:
`products`, `variants`, `orders`, `order_items`, `customers`. **Turn
row-level security on before inserting a single row**, not after. A customer
reads their own orders and nobody else's; the owner reads all of them.

### 3. Worker secrets
```bash
cd worker
wrangler secret put RAZORPAY_KEY_ID
wrangler secret put RAZORPAY_KEY_SECRET
wrangler secret put RAZORPAY_WEBHOOK_SECRET
wrangler deploy
```
Never in `wrangler.toml` — that file is committed. The repo already has one
committed Google API key that needs rotating; do not add a second lesson.

### 4. Point the store at the Worker
One line in `commerce/store.js`:
```js
var API = 'https://netloom-enquiry.<subdomain>.workers.dev';
```
Add Razorpay's script to `checkout.html`, and set the dashboard webhook to
`<worker>/commerce/webhook` for `payment.captured`, `payment.failed` and
`refund.processed`.

---

## Things that will bite

- **Stock moves on payment, not on add-to-cart.** Reserving at add-to-cart
  lets an abandoned basket hold inventory hostage. Decrement inside the same
  transaction that marks the order paid.
- **The webhook must be idempotent.** Razorpay retries until it gets a 2xx.
  Applying `payment.captured` twice must not decrement stock twice — upsert
  keyed on the payment id.
- **Write the order before the customer pays**, as `pending`. If the browser
  dies between payment and confirmation, the webhook still has a row to
  attach to. Without it, money arrives with nothing to reconcile against.
- **Two people can buy the last one.** Whoever's payment captures first gets
  it; refund the other the same day. This is already in the terms page.
- **Never store card details.** Razorpay's checkout handles them; they never
  touch our page or our Worker.

---

## Deliberately not built: a 3D product viewer

Procedural geometry can convincingly make a gem, a building and a length of
cloth. It cannot make a Dhokra Nandi or a Kantha stole. A crude 3D model of a
handicraft looks worse than a good photograph and would reduce sales. If a
product genuinely needs rotation, photogrammetry or a 36-frame spin is the
right tool, and it is a per-product cost the client chooses to pay.

---

## Photography

This is the vertical where photography decides revenue.

- **Every product, on a plain background, evenly lit.** Consistency across
  the grid matters more than any individual shot.
- 3–5 angles per product, plus one detail shot showing the making.
- One in-use or in-context shot per product.
- Scale reference where size is not obvious.
- **Client's own product photographs only.** Stock is impossible here — it
  would be a photograph of a different object.

If they have no usable photographs, the store cannot ship. Sell the shoot,
or sell them a smaller tier until they have images.

---

## Demo state

The demo store's payment is **simulated** and says so on screen. Everything
else — the maths, the invoice, the stock caps, the order record — runs
exactly as it would live. When showing it to a prospect, say that plainly.
It is more impressive that the arithmetic is real than that the payment is
fake, and claiming otherwise would be the one dishonest thing in the pitch.
