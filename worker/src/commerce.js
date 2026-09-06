/* =============================================================================
   worker/src/commerce.js — order creation and payment verification
   -----------------------------------------------------------------------------
   The single most important file in the ₹44,999 tier, because it is the only
   place where money is decided.

   Two things happen here that must NEVER move into the browser:

   1. PRICING. The client sends SKUs and quantities, never prices. If the
      browser sent a price, a customer could edit it in devtools and buy a
      ₹18,500 Baluchari for one rupee. The Worker looks every price up itself.

   2. PAYMENT VERIFICATION. Razorpay returns an HMAC-SHA256 signature over
      "order_id|payment_id", keyed with the account's key SECRET. Only a server
      holds that secret, so only a server can check it. A client-side
      `if (response.status === 'paid')` is a wish, not a check.

   Deployment notes are in commerce/README.md. Secrets, as with the enquiry
   path, are set with `wrangler secret put` and never committed:

     RAZORPAY_KEY_ID       public-ish, but kept here so it is never hard-coded
     RAZORPAY_KEY_SECRET   the one that signs. Never leaves the Worker.
     RAZORPAY_WEBHOOK_SECRET
   ========================================================================== */

/* The catalogue the Worker trusts. In production this is a SELECT against
   Supabase; the shape is deliberately identical to commerce/catalog.js so the
   move is a change of source rather than a rewrite. It is duplicated here on
   purpose — a server that asks the client what things cost is not a server. */
const PRICES = {
  'DHK-NANDI-01':  { base: 345000, gst: 12, variants: { sm: 0, md: 96000, lg: 245000 } },
  'KTH-STOLE-02':  { base: 289000, gst: 5,  variants: { indigo: 0, madder: 0, ochre: 0 } },
  'TER-HORSE-03':  { base: 165000, gst: 12, variants: { sm: 0, md: 84000, lg: 210000 } },
  'PAT-SCROLL-04': { base: 520000, gst: 12, variants: { std: 0 } },
  'BRS-DIYA-05':   { base: 142000, gst: 12, variants: { plain: 0, etched: 38000 } },
  'JAM-SAREE-06':  { base: 1240000, gst: 5, variants: { white: 0, grey: 60000 } },
  'WOD-OWL-07':    { base: 98000,  gst: 12, variants: { sm: 0, md: 62000 } },
  'SHO-DECOR-08':  { base: 76000,  gst: 12, variants: { std: 0 } },
  'CAN-BASKET-09': { base: 124000, gst: 12, variants: { md: 0, lg: 46000 } },
  'BNG-GLASS-10':  { base: 54000,  gst: 12, variants: { '2-4': 0, '2-6': 0, '2-8': 0 } },
  'PEA-WALL-11':   { base: 218000, gst: 12, variants: { std: 0 } },
  'BRS-IDOL-12':   { base: 386000, gst: 12, variants: { sm: 0, md: 128000 } },
  'WOD-PANEL-13':  { base: 645000, gst: 12, variants: { std: 0 } },
  'TER-LAMP-14':   { base: 89000,  gst: 12, variants: { plain: 0, paint: 24000 } }
};

const FREE_SHIPPING_OVER = 250000;
const SHIPPING_FLAT      = 15000;
const MAX_LINE_QTY       = 20;

/* ── helpers ─────────────────────────────────────────────────────────────── */

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers }
  });
}

function hex(buf) {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacSha256Hex(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  return hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message)));
}

/* Compare in constant time. A plain === leaks, through timing, how many
   leading characters of a forged signature were right — which is enough to
   recover a valid one a byte at a time given sufficient attempts. */
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* ── pricing ──────────────────────────────────────────────────────────────── */

/* Takes the client's [{sku, variant, qty}] and returns what it actually costs.
   Anything unrecognised is rejected outright rather than skipped, so a
   tampered basket fails loudly instead of quietly costing less. */
export function priceBasket(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { error: 'empty basket' };
  }
  if (items.length > 50) return { error: 'too many lines' };

  let gross = 0;
  const byRate = {};
  const lines = [];

  for (const item of items) {
    const p = PRICES[item && item.sku];
    if (!p) return { error: 'unknown sku: ' + (item && item.sku) };

    const variant = item.variant;
    if (!(variant in p.variants)) return { error: 'unknown variant for ' + item.sku };

    const qty = Number(item.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_LINE_QTY) {
      return { error: 'bad quantity for ' + item.sku };
    }

    const unit = p.base + p.variants[variant];
    const lineGross = unit * qty;
    // GST is inclusive: back it out rather than adding it on.
    const lineBase = Math.round(lineGross * 100 / (100 + p.gst));
    const lineTax  = lineGross - lineBase;

    gross += lineGross;
    byRate[p.gst] = (byRate[p.gst] || 0) + lineTax;
    lines.push({ sku: item.sku, variant, qty, unit, gross: lineGross, gst: p.gst, tax: lineTax });
  }

  const shipping = gross >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FLAT;
  const tax = Object.values(byRate).reduce((n, v) => n + v, 0);

  return { lines, gross, tax, base: gross - tax, byRate, shipping, total: gross + shipping };
}

/* ── Razorpay ─────────────────────────────────────────────────────────────── */

async function createRazorpayOrder(env, amountPaise, receipt) {
  const auth = btoa(env.RAZORPAY_KEY_ID + ':' + env.RAZORPAY_KEY_SECRET);
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + auth },
    body: JSON.stringify({ amount: amountPaise, currency: 'INR', receipt, payment_capture: 1 })
  });
  if (!res.ok) throw new Error('razorpay order failed: ' + res.status);
  return res.json();
}

/* ── routes ───────────────────────────────────────────────────────────────── */

/* POST /commerce/order — price the basket here, then open a Razorpay order for
   exactly that amount. The response carries the amount so the client can show
   it, but the amount Razorpay will collect was fixed server-side. */
export async function handleOrder(request, env, head) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad request' }, 400, head); }

  const priced = priceBasket(body.items);
  if (priced.error) return json({ error: priced.error }, 422, head);

  const c = body.customer || {};
  if (!c.name || !c.email || !c.phone) {
    return json({ error: 'customer details required' }, 422, head);
  }

  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    return json({ error: 'payments not configured' }, 503, head);
  }

  const receipt = 'KAA-' + Date.now().toString(36).toUpperCase();
  let rzp;
  try {
    rzp = await createRazorpayOrder(env, priced.total, receipt);
  } catch (e) {
    return json({ error: 'could not reach the payment provider' }, 502, head);
  }

  /* In production the order is written to Supabase as `pending` HERE, before
     the customer pays — so a payment that succeeds while the browser crashes
     still has a row to attach itself to when the webhook lands. */

  return json({
    order_id: rzp.id,
    amount:   priced.total,
    receipt,
    key_id:   env.RAZORPAY_KEY_ID,
    breakdown: { base: priced.base, tax: priced.tax, byRate: priced.byRate, shipping: priced.shipping }
  }, 200, head);
}

/* POST /commerce/verify — the only place a payment becomes real.
   Razorpay signs `order_id|payment_id` with the key secret. Recomputing that
   HMAC here is the entire proof; nothing the browser says is trusted. */
export async function handleVerify(request, env, head) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad request' }, 400, head); }

  const orderId   = body.razorpay_order_id;
  const paymentId = body.razorpay_payment_id;
  const signature = body.razorpay_signature;

  if (!orderId || !paymentId || !signature) {
    return json({ verified: false, error: 'incomplete payment response' }, 422, head);
  }
  if (!env.RAZORPAY_KEY_SECRET) {
    return json({ verified: false, error: 'payments not configured' }, 503, head);
  }

  const expected = await hmacSha256Hex(env.RAZORPAY_KEY_SECRET, orderId + '|' + paymentId);

  if (!timingSafeEqual(expected, String(signature))) {
    /* Worth logging loudly: a mismatch is either a bug or somebody trying it
       on, and both are things the shop owner should hear about. */
    console.warn('signature mismatch for order', orderId);
    return json({ verified: false, error: 'signature mismatch' }, 400, head);
  }

  /* In production: mark the order paid in Supabase, decrement stock inside the
     same transaction, and hand off to the existing Zoho SMTP path for the
     confirmation email. Stock must move here and not at add-to-cart, or an
     abandoned basket holds inventory hostage. */

  return json({ verified: true, method: 'Razorpay', payment_id: paymentId }, 200, head);
}

/* POST /commerce/webhook — Razorpay's own callback.
   The browser can be closed, lose signal, or be a bot; the webhook is what
   makes the system eventually consistent regardless. Signed with a DIFFERENT
   secret from the checkout signature, over the raw body. */
export async function handleWebhook(request, env) {
  const raw = await request.text();
  const signature = request.headers.get('X-Razorpay-Signature') || '';

  if (!env.RAZORPAY_WEBHOOK_SECRET) return new Response('not configured', { status: 503 });

  const expected = await hmacSha256Hex(env.RAZORPAY_WEBHOOK_SECRET, raw);
  if (!timingSafeEqual(expected, signature)) {
    return new Response('bad signature', { status: 400 });
  }

  let event;
  try { event = JSON.parse(raw); } catch { return new Response('bad json', { status: 400 }); }

  /* Razorpay retries until it gets a 2xx, so this has to be idempotent:
     applying `payment.captured` twice must not decrement stock twice. In
     production that means an upsert keyed on the payment id. */
  switch (event.event) {
    case 'payment.captured':  /* mark paid, decrement stock, send the email */ break;
    case 'payment.failed':    /* release the reservation, tell the customer  */ break;
    case 'refund.processed':  /* restock, mark refunded                      */ break;
    default: break;
  }

  return new Response('ok', { status: 200 });
}
