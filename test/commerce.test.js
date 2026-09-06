/* commerce/ — the ₹44,999 tier.
   ----------------------------------------------------------------------------
   The existing ecommerce/ demo has a cart page with no cart logic. The premium
   tier's entire justification is that this one transacts, so what is tested
   here is the transacting: that the maths is right to the paisa, that the
   basket survives a page change, and above all that the money decisions happen
   somewhere a customer cannot reach.

   The last of those is why this file exists at all. A storefront that looks
   right and lets someone buy an ₹18,500 saree for one rupee is worse than no
   storefront, and it is not a bug you would ever notice by clicking around. */
'use strict';
const fs = require('fs');
const path = require('path');
const { ROOT, loadPage, suite } = require('./lib');

const INLINE = {
  '<script src="catalog.js"></script>': 'commerce/catalog.js',
  '<script src="store.js"></script>':   'commerce/store.js',
  '<script src="chrome.js"></script>':  'commerce/chrome.js',
  '<script src="card.js"></script>':    'commerce/card.js'
};

const PAGES = ['index.html', 'shop.html', 'product.html', 'cart.html', 'checkout.html',
               'order.html', 'account.html', 'admin.html',
               'shipping.html', 'refunds.html', 'terms.html', 'privacy.html'];

/* A stand-in for the browser's persistent localStorage, so a basket can be
   carried from one page to the next the way it is in real life. */
let SESSION = {};

function open(page, query) {
  const html = fs.readFileSync(path.join(ROOT, 'commerce', page), 'utf8');
  const inline = {};
  for (const [tag, file] of Object.entries(INLINE)) if (html.includes(tag)) inline[tag] = file;
  return loadPage('commerce/' + page, {
    url: 'https://netloom.in/commerce/' + page + (query || ''),
    inline,
    stub(w) { try { for (const k in SESSION) w.localStorage.setItem(k, SESSION[k]); } catch (e) {} }
  });
}
function persist(r) {
  try {
    const ls = r.window.localStorage;
    SESSION = {};
    for (let i = 0; i < ls.length; i++) SESSION[ls.key(i)] = ls.getItem(ls.key(i));
  } catch (e) {}
}
const tick = () => new Promise(r => setTimeout(r, 25));

module.exports = async function run() {
  const s = suite('commerce — the store that takes money');
  SESSION = {};

  /* ── every page loads, runs clean, and gets its shared chrome ── */
  for (const p of PAGES) {
    const r = open(p);
    await tick();
    const d = r.document;
    const ok = r.errors.length === 0 && !!d.querySelector('.head') && !!d.querySelector('.foot');
    s.check(ok, p + ': loads, runs clean and mounts its chrome' +
      (r.errors.length ? ' — ' + r.errors[0] : ''));
  }

  /* ── every internal link and image resolves ── */
  const broken = [];
  for (const p of PAGES) {
    const r = open(p);
    await tick();
    const dir = path.join(ROOT, 'commerce');
    for (const a of r.document.querySelectorAll('a[href]')) {
      const h = a.getAttribute('href') || '';
      if (/^(https?:|mailto:|tel:|#)/.test(h)) continue;
      const f = h.split('#')[0].split('?')[0];
      if (!f) continue;
      if (!fs.existsSync(path.normalize(path.join(dir, f)))) broken.push(p + ' -> ' + h);
    }
    for (const im of r.document.querySelectorAll('img')) {
      const src = im.getAttribute('src') || '';
      if (!fs.existsSync(path.normalize(path.join(dir, src)))) broken.push(p + ' img -> ' + src);
    }
  }
  s.check(broken.length === 0,
    'no broken links or images anywhere in the store' +
    (broken.length ? ' — ' + broken.slice(0, 4).join(', ') : ''));

  /* ── the catalogue is real: search, filter and sort actually run ── */
  let r = open('shop.html');
  await tick();
  s.check(r.document.querySelectorAll('.card').length === 14, 'shop lists all fourteen pieces');

  r = open('shop.html', '?cat=textiles');
  await tick();
  s.check(r.document.querySelectorAll('.card').length === 2, 'category filter narrows to textiles');

  r = open('shop.html', '?q=bankura');
  await tick();
  const hits = r.document.querySelectorAll('.card').length;
  s.check(hits > 0 && hits < 14, 'search narrows rather than matching everything (' + hits + ')');

  r = open('shop.html', '?q=zzzznothing');
  await tick();
  s.check(!r.document.getElementById('empty').hidden, 'a search with no matches shows the empty state');

  /* ── the purchase, end to end ── */
  SESSION = {};
  r = open('product.html', '?sku=DHK-NANDI-01');
  await tick();
  let d = r.document;
  s.check(d.querySelectorAll('#variants .opt-btn').length === 3, 'PDP: three variants offered');
  const basePrice = d.querySelector('.pdp-price .now').textContent;
  d.querySelectorAll('#variants .opt-btn')[1].click();
  s.check(d.querySelector('.pdp-price .now').textContent !== basePrice,
    'PDP: choosing a bigger variant changes the price');
  d.getElementById('qPlus').click();          // qty 2
  d.getElementById('addBtn').click();
  s.check(d.querySelector('[data-cart-count]').textContent === '2',
    'PDP: adding two updates the basket badge');
  persist(r);

  r = open('cart.html');
  await tick();
  d = r.document;
  s.check(d.querySelectorAll('.line').length === 1, 'cart: the basket survived the page change');
  const before = d.querySelector('.sum.total span:last-child').textContent;
  d.querySelector('[data-act="inc"]').click();
  const after = d.querySelector('.sum.total span:last-child').textContent;
  s.check(before !== after, 'cart: changing quantity re-totals');
  persist(r);

  r = open('checkout.html');
  await tick();
  d = r.document;
  d.getElementById('payBtn').click();
  await tick();
  s.check(d.querySelectorAll('.field.bad').length === 6,
    'checkout: an empty form is refused, with an error on each field');
  s.check(Store_ordersIn(SESSION).length === 0, 'checkout: nothing was ordered while the form was invalid');

  ['cName', 'cPhone', 'cEmail', 'cAddr', 'cCity', 'cPin'].forEach((id, i) => {
    d.getElementById(id).value =
      ['Mayank Khandelwal', '9830010001', 'm@example.com', '12 Gariahat Road', 'Kolkata', '700019'][i];
  });
  d.getElementById('payBtn').click();
  await tick(); await tick();
  persist(r);

  const orders = Store_ordersIn(SESSION);
  s.check(orders.length === 1, 'checkout: a valid form places exactly one order');
  s.check(/^KAA-\d{6}-\d{4}$/.test(orders[0] && orders[0].ref), 'checkout: the order gets a reference');
  s.check(JSON.parse(SESSION['netloom_commerce_cart_v1'] || '[]').length === 0,
    'checkout: the basket is emptied once the order is placed');

  /* GST has to reconcile exactly, or the invoice is not a legal document. */
  const o = orders[0];
  const rateSum = Object.values(o.byRate).reduce((n, v) => n + v, 0);
  s.check(o.base + o.tax + o.shipping === o.total, 'invoice: base + tax + shipping === total, to the paisa');
  s.check(rateSum === o.tax, 'invoice: the per-rate GST lines sum to the tax total');

  r = open('order.html', '?ref=' + encodeURIComponent(o.ref));
  await tick();
  s.check(r.document.querySelectorAll('table tbody tr').length === o.items.length,
    'confirmation: the invoice lists every line');

  r = open('account.html');
  await tick();
  s.check(r.document.querySelectorAll('[data-reorder]').length === 1, 'account: the order appears in history');

  r = open('admin.html');
  await tick();
  s.check(r.document.querySelectorAll('table tbody tr').length === 1, 'admin: the owner sees the order');

  /* ── the Worker: where money is actually decided ── */
  const W = await import('../worker/src/commerce.js');

  const priced = W.priceBasket([{ sku: 'DHK-NANDI-01', variant: 'md', qty: 3 }]);
  s.check(priced.total === 1323000, 'worker: prices the basket itself, matching the client (₹13,230)');
  s.check(priced.base + priced.tax === priced.gross, 'worker: backs GST out of an inclusive price exactly');

  /* The attack this whole file exists for: the client naming its own price. */
  const tampered = W.priceBasket([{ sku: 'JAM-SAREE-06', variant: 'white', qty: 1, price: 100, total: 100 }]);
  s.check(tampered.total === 1240000,
    'worker: a price sent by the client is ignored — the server looks it up (₹12,400 not ₹1)');

  [['unknown sku', [{ sku: 'NOPE', variant: 'sm', qty: 1 }]],
   ['unknown variant', [{ sku: 'DHK-NANDI-01', variant: 'xl', qty: 1 }]],
   ['zero quantity', [{ sku: 'DHK-NANDI-01', variant: 'sm', qty: 0 }]],
   ['negative quantity', [{ sku: 'DHK-NANDI-01', variant: 'sm', qty: -5 }]],
   ['fractional quantity', [{ sku: 'DHK-NANDI-01', variant: 'sm', qty: 1.5 }]],
   ['an empty basket', []]
  ].forEach(([label, items]) => {
    s.check(!!W.priceBasket(items).error, 'worker: rejects ' + label);
  });

  /* Signature verification. Razorpay signs order|payment with the key secret;
     only a server holds it, which is the entire reason this cannot be done in
     the browser. */
  const SECRET = 'test_secret_not_a_real_key';
  const env = { RAZORPAY_KEY_SECRET: SECRET, RAZORPAY_WEBHOOK_SECRET: SECRET };
  const req = (b) => new Request('https://x/commerce/verify', { method: 'POST', body: JSON.stringify(b) });

  async function sign(msg, secret) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const buf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg));
    return [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2, '0')).join('');
  }

  const oid = 'order_Test123', pid = 'pay_Test789';
  const good = await sign(oid + '|' + pid, SECRET);

  let res = await W.handleVerify(req({ razorpay_order_id: oid, razorpay_payment_id: pid, razorpay_signature: good }), env, {});
  s.check((await res.json()).verified === true, 'worker: a genuine Razorpay signature verifies');

  res = await W.handleVerify(req({ razorpay_order_id: oid, razorpay_payment_id: pid, razorpay_signature: good.slice(0, -1) + '0' }), env, {});
  s.check((await res.json()).verified === false, 'worker: a signature altered by one character is refused');

  res = await W.handleVerify(req({ razorpay_order_id: oid, razorpay_payment_id: pid, razorpay_signature: await sign(oid + '|' + pid, 'guessed') }), env, {});
  s.check((await res.json()).verified === false, 'worker: a signature made with the wrong secret is refused');

  res = await W.handleVerify(req({ razorpay_order_id: oid, razorpay_payment_id: 'pay_OTHER', razorpay_signature: good }), env, {});
  s.check((await res.json()).verified === false, 'worker: a signature replayed onto another payment is refused');

  res = await W.handleVerify(req({ razorpay_order_id: oid, razorpay_payment_id: pid, razorpay_signature: good }), {}, {});
  s.check(res.status === 503, 'worker: refuses to verify at all when no secret is configured');

  const payload = JSON.stringify({ event: 'payment.captured' });
  res = await W.handleWebhook(new Request('https://x/commerce/webhook', {
    method: 'POST', body: payload, headers: { 'X-Razorpay-Signature': await sign(payload, SECRET) } }), env);
  s.check(res.status === 200, 'worker: a correctly signed webhook is accepted');

  res = await W.handleWebhook(new Request('https://x/commerce/webhook', {
    method: 'POST', body: payload, headers: { 'X-Razorpay-Signature': 'deadbeef' } }), env);
  s.check(res.status === 400, 'worker: a forged webhook is rejected');

  /* The store must never ship with a live secret in a file the browser can read. */
  const clientFiles = ['store.js', 'catalog.js', 'chrome.js', 'card.js', 'checkout.html']
    .map(f => fs.readFileSync(path.join(ROOT, 'commerce', f), 'utf8')).join('\n');
  s.check(!/rzp_live_|rzp_test_[A-Za-z0-9]{10}|KEY_SECRET\s*[:=]\s*['"][^'"]{8}/.test(clientFiles),
    'no Razorpay key or secret is hard-coded into anything the browser downloads');

  /* The price row on a product card.
        On a two-up mobile grid there is not room for price + struck MRP +
        discount on one line. Without flex-wrap the browser breaks "11% off"
        mid-phrase, and .card{overflow:hidden} clips the orphaned half — a
        defect invisible to every check here except a human looking at a
        phone, which is how it was found. These assert the rule, not the
        pixels: the row may wrap, and none of the three parts may be split. */
  const css = fs.readFileSync(path.join(ROOT, 'commerce', 'store.css'), 'utf8');
  const footRule = css.slice(css.indexOf('.card-foot{'), css.indexOf('.card-price,'));
  s.check(/flex-wrap:s*wrap/.test(footRule),
    'card price row is allowed to wrap rather than overflow');
  s.check(/.card-price,s*.card-mrp,s*.card-off{[^}]*white-space:s*nowrap/.test(css),
    'price, MRP and discount are each unbreakable');
  s.check(/.pdp-price{[^}]*flex-wrap:s*wrap/.test(css),
    'product-page price row wraps too');

  /* Legal pages are a launch blocker — Razorpay will not activate without
     them, so their absence is a deployment failure, not a nicety. */
  ['shipping.html', 'refunds.html', 'terms.html', 'privacy.html'].forEach(f => {
    const html = fs.readFileSync(path.join(ROOT, 'commerce', f), 'utf8');
    s.check(html.length > 2500 && /<h2/.test(html), 'legal: ' + f + ' has real content, not a placeholder');
  });

  return s.report();
};

function Store_ordersIn(session) {
  try { return JSON.parse(session['netloom_commerce_orders_v1'] || '[]'); }
  catch (e) { return []; }
}
