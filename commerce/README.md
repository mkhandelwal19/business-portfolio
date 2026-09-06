# commerce/ — the ₹44,999 tier

A working store. Fourteen products, real search, a cart that survives a reload,
a checkout that validates, a GST invoice that reconciles to the paisa, an
order history and an owner admin.

**What is real:** every price, every calculation, the whole flow.
**What is simulated:** the payment, and only the payment.

There is no Razorpay account and no Supabase project yet, so `Store.pay()`
returns a clearly-labelled simulated result and the checkout page says so on
screen. It never claims a real payment happened. Everything else — the maths,
the invoice, the stock caps, the order record — runs exactly as it would live.

---

## The one rule this build is organised around

**The browser never decides what something costs, and never decides that a
payment succeeded.**

Both of those live in `worker/src/commerce.js`, and there are tests for both:

- `priceBasket()` takes SKUs and quantities and looks the prices up itself. A
  client that sends `{sku, variant, qty, price: 100}` gets charged the real
  ₹12,400, not ₹1. There is a test named for exactly that.
- `handleVerify()` recomputes Razorpay's HMAC-SHA256 over `order_id|payment_id`
  using the key **secret**. A signature altered by one character, made with a
  different key, or replayed onto another payment is refused. Comparison is
  constant-time, because `===` leaks through timing how many leading characters
  of a forgery were right.

A client-side `if (response.status === 'paid')` is a wish, not a check. Anyone
with devtools open can make a browser say anything.

---

## Files

| File | What it is |
|------|------------|
| `catalog.js` | The products. Shaped like database rows so moving to Supabase is a change of source, not a rewrite. |
| `store.js` | Cart, money, GST, search, orders, the checkout handshake. No page-specific DOM. |
| `chrome.js` | Header and footer, injected. Eleven pages cannot drift apart if there is one copy. |
| `card.js` | One product tile, rendered the same way on the storefront and the catalogue. |
| `store.css` | The design system. Light, deliberately — see the note at the top of the file. |
| `index · shop · product · cart · checkout · order · account · admin` | The eight store pages. |
| `shipping · refunds · terms · privacy` | Legal. Not optional — see below. |

Money is **integer paise** everywhere. Never floats: `0.1 + 0.2 !== 0.3`, and a
store that is a rupee out on one order in a thousand is a store nobody trusts
twice.

GST is **backed out of an inclusive price**, never added on. Indian retail
prices are quoted with tax included; adding 12% to a shelf price would
overcharge every customer.

---

## To make it take real money

Four things, in this order. None of them are code changes beyond step 4.

### 1. Razorpay account — in the client's name

Not yours. The site promises *"you own everything"* and *"never locked in"*,
and a payment account in the agency's name breaks both. Same policy as domains.

They will ask for: PAN, bank account, GSTIN, and **the four legal pages**. That
is why those pages exist and are written properly rather than stubbed — Razorpay
reads them during activation and rejects placeholder text.

Start in **test mode**. Test keys look like `rzp_test_…`.

### 2. Supabase project — also in the client's name

Region: Mumbai (`ap-south-1`), for latency and for data residency.

Tables: `products`, `variants`, `orders`, `order_items`, `customers`.
Turn **row-level security on** before inserting a single row, not after. A
customer must be able to read their own orders and nobody else's; the owner
reads all of them.

Then replace the `PRICES` constant in `worker/src/commerce.js` with a query.
The shape is already identical, which is the point.

### 3. Worker secrets

```bash
cd worker
wrangler secret put RAZORPAY_KEY_ID
wrangler secret put RAZORPAY_KEY_SECRET
wrangler secret put RAZORPAY_WEBHOOK_SECRET
wrangler deploy
```

Never in `wrangler.toml`. That file is committed; secrets are not. The repo
already has one committed Google API key that needs rotating — do not add a
second lesson.

### 4. Point the store at the Worker

One line, in `commerce/store.js`:

```js
var API = 'https://netloom-enquiry.<subdomain>.workers.dev';
```

Add Razorpay's checkout script to `checkout.html`:

```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

Then set the webhook in the Razorpay dashboard to
`<worker>/commerce/webhook` for `payment.captured`, `payment.failed` and
`refund.processed`.

---

## Things that will bite, written down before they do

**Stock must move on payment, not on add-to-cart.** Reserving at add-to-cart
means an abandoned basket holds inventory hostage. Decrement inside the same
transaction that marks the order paid.

**The webhook must be idempotent.** Razorpay retries until it gets a 2xx.
Applying `payment.captured` twice must not decrement stock twice — upsert keyed
on the payment id.

**Write the order before the customer pays.** As `pending`, in `handleOrder`.
If the browser dies between payment and confirmation, the webhook still has a
row to attach to. Without it that money arrives with nothing to reconcile
against.

**Two people can buy the last one.** Much of this catalogue is one of one.
Whoever's payment captures first gets it; refund the other the same day. This
is in the terms page already.

---

## Deliberately not built

**A 3D product viewer.** The plan called for one reusing `flagship/3d-core.js`.
Procedural geometry can convincingly make a gem, a building and a length of
cloth — it cannot make a Dhokra Nandi or a Kantha stole. A crude 3D model of a
handicraft looks worse than a good photograph of it and would actively reduce
sales. If a product genuinely needs rotation, photogrammetry or a 36-frame spin
is the right tool, and it is a per-product cost the client should choose to pay.

**Customer login.** Order history is keyed to the browser. Real accounts need
Supabase Auth, which needs the project from step 2. The page says so rather than
implying otherwise.

---

## The commercial part, which is not a technical problem

A brochure site ships and is finished. A store generates failed payments, stock
discrepancies, refund requests, delivery disputes and "where is my order" messages
**forever**.

Sold flat at ₹44,999 with no retainer, this is likely the least profitable thing
on the price list. Attach a mandatory monthly retainer — ₹2,000–4,000 is a
reasonable opening range — and quote it as part of the tier rather than as an
upsell, because the support tail is part of the product whether it is priced or
not.

Recurring costs land on the client and should be in writing before anyone signs:
Razorpay fees (~2% + GST per domestic transaction — **verify the current rate**,
do not quote from memory), Supabase beyond the free tier, domain and hosting,
and the retainer above.
