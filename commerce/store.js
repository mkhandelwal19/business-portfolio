/* =============================================================================
   commerce/store.js — cart, money, tax and the checkout handshake
   -----------------------------------------------------------------------------
   The existing ecommerce/ demo has a cart *page* but no cart *logic*. This is
   the logic. Every page in commerce/ loads this, and nothing here touches the
   DOM of a specific page — pages ask it questions and render the answers.

   Three rules that the rest of the file exists to keep:

   1. MONEY IS INTEGER PAISE. Never a float, never a string, never rupees.
      0.1 + 0.2 !== 0.3 in binary floating point, and a store that is a rupee
      out on one order in a thousand is a store nobody trusts twice.

   2. GST IS BACKED OUT, NOT ADDED ON. Indian retail prices are quoted
      inclusive of tax. The customer pays the shelf price; the invoice has to
      show what part of it was tax. Adding 12% to a displayed price would
      overcharge every customer.

   3. THE BROWSER NEVER DECIDES THAT A PAYMENT SUCCEEDED. It cannot: anything
      the client asserts, a client can forge. The Worker verifies Razorpay's
      signature and the Worker alone. See commerce/README.md.
   ========================================================================== */
window.Store = (function () {
  'use strict';

  var CART_KEY  = 'netloom_commerce_cart_v1';
  var ORDER_KEY = 'netloom_commerce_orders_v1';
  var USER_KEY  = 'netloom_commerce_user_v1';

  /* Where the Worker lives. In the demo there is no deployed commerce Worker,
     so checkout runs in simulated mode and says so on screen — see pay(). */
  var API = '';

  /* ── storage, defensively ──────────────────────────────────────────────────
     localStorage throws in private windows and when a browser is set to block
     site data. A store that white-screens because storage is unavailable is
     worse than a store that forgets the cart. */
  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }

  /* ── money ─────────────────────────────────────────────────────────────── */
  function rupees(paise) {
    var neg = paise < 0;
    var whole = Math.round(Math.abs(paise)) / 100;
    var s = whole.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    return (neg ? '-' : '') + '₹' + s;
  }

  /* ── tax ───────────────────────────────────────────────────────────────────
     price is GST-inclusive, so base = price * 100 / (100 + rate) and the tax
     is the remainder. Rounded once per line, then summed — rounding the total
     instead would drift away from the sum of the printed lines, which is the
     kind of thing that fails a GST audit. */
  function taxSplit(inclusivePaise, ratePercent) {
    var base = Math.round(inclusivePaise * 100 / (100 + ratePercent));
    return { base: base, tax: inclusivePaise - base };
  }

  /* ── cart ──────────────────────────────────────────────────────────────── */
  var listeners = [];
  function notify() { listeners.forEach(function (fn) { try { fn(getCart()); } catch (e) {} }); }
  function onChange(fn) { listeners.push(fn); return function () { listeners = listeners.filter(function (f) { return f !== fn; }); }; }

  function getCart() { return read(CART_KEY, []); }
  function setCart(items) { write(CART_KEY, items); notify(); return items; }

  function lineId(sku, variantId) { return sku + '::' + variantId; }

  function add(sku, variantId, qty) {
    var product = window.CATALOG.bySku(sku);
    if (!product) return { ok: false, reason: 'unknown-sku' };
    qty = Math.max(1, parseInt(qty, 10) || 1);

    var items = getCart();
    var id = lineId(sku, variantId);
    var existing = null;
    for (var i = 0; i < items.length; i++) if (items[i].id === id) existing = items[i];

    var wanted = (existing ? existing.qty : 0) + qty;
    /* Stock is checked here AND again in the Worker before payment. The client
       check is a courtesy so nobody reaches checkout with an impossible cart;
       it is not the authority, because a client cannot be one. */
    if (wanted > product.stock) {
      if (product.stock === 0) return { ok: false, reason: 'out-of-stock' };
      wanted = product.stock;
      if (existing && existing.qty === wanted) return { ok: false, reason: 'stock-capped', max: product.stock };
    }

    if (existing) existing.qty = wanted;
    else items.push({ id: id, sku: sku, variant: variantId, qty: wanted });

    setCart(items);
    return { ok: true, capped: wanted !== (existing ? existing.qty : qty) && wanted === product.stock, max: product.stock };
  }

  function setQty(id, qty) {
    var items = getCart();
    qty = parseInt(qty, 10) || 0;
    if (qty <= 0) return remove(id);
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) {
        var p = window.CATALOG.bySku(items[i].sku);
        items[i].qty = p ? Math.min(qty, p.stock) : qty;
      }
    }
    return setCart(items);
  }

  function remove(id) {
    return setCart(getCart().filter(function (l) { return l.id !== id; }));
  }

  function clear() { return setCart([]); }

  function count() {
    return getCart().reduce(function (n, l) { return n + l.qty; }, 0);
  }

  /* Expand cart lines into everything a page or an invoice needs. Anything
     whose SKU has vanished from the catalogue is dropped rather than rendered
     as a broken row. */
  function lines() {
    return getCart().map(function (l) {
      var p = window.CATALOG.bySku(l.sku);
      if (!p) return null;
      var unit = window.CATALOG.priceOf(p, l.variant);
      var variant = null;
      for (var i = 0; i < p.variants.length; i++) if (p.variants[i].id === l.variant) variant = p.variants[i];
      var gross = unit * l.qty;
      var split = taxSplit(gross, p.gst);
      return {
        id: l.id, sku: l.sku, qty: l.qty, product: p,
        variant: variant || p.variants[0],
        unit: unit, gross: gross, base: split.base, tax: split.tax, gstRate: p.gst
      };
    }).filter(Boolean);
  }

  /* Free delivery over ₹2,500 — a real threshold, applied before tax so the
     invoice stays coherent. */
  var FREE_SHIPPING_OVER = 250000;
  var SHIPPING_FLAT      = 15000;

  function totals() {
    var ls = lines();
    var gross = ls.reduce(function (n, l) { return n + l.gross; }, 0);
    var taxTotal = ls.reduce(function (n, l) { return n + l.tax; }, 0);
    var base = gross - taxTotal;
    var shipping = (gross === 0 || gross >= FREE_SHIPPING_OVER) ? 0 : SHIPPING_FLAT;

    // GST grouped by rate, which is how it has to appear on the invoice.
    var byRate = {};
    ls.forEach(function (l) {
      byRate[l.gstRate] = (byRate[l.gstRate] || 0) + l.tax;
    });

    return {
      lines: ls,
      itemCount: ls.reduce(function (n, l) { return n + l.qty; }, 0),
      base: base, tax: taxTotal, byRate: byRate,
      shipping: shipping, gross: gross,
      total: gross + shipping,
      freeShippingGap: Math.max(0, FREE_SHIPPING_OVER - gross)
    };
  }

  /* ── catalogue queries ─────────────────────────────────────────────────────
     Real search, filter and sort. The standard demo.js versions are cosmetic;
     these actually run over the data. */
  function search(opts) {
    opts = opts || {};
    var q = (opts.q || '').trim().toLowerCase();
    var cat = opts.cat || 'all';
    var sort = opts.sort || 'featured';
    var maxPrice = opts.maxPrice || Infinity;

    var out = window.CATALOG.products.filter(function (p) {
      if (cat !== 'all' && p.cat !== cat) return false;
      if (p.price > maxPrice) return false;
      if (!q) return true;
      var hay = (p.name + ' ' + p.craft + ' ' + p.origin + ' ' + p.cat + ' ' + p.blurb).toLowerCase();
      // every word must appear somewhere, so "brass bankura" narrows instead
      // of widening the way an OR match would
      return q.split(/\s+/).every(function (w) { return hay.indexOf(w) > -1; });
    });

    out.sort(function (a, b) {
      if (sort === 'price-asc')  return a.price - b.price;
      if (sort === 'price-desc') return b.price - a.price;
      if (sort === 'rating')     return b.rating - a.rating;
      if (sort === 'name')       return a.name.localeCompare(b.name);
      return 0;
    });
    return out;
  }

  /* ── customer ──────────────────────────────────────────────────────────── */
  function getUser() { return read(USER_KEY, null); }
  function setUser(u) { write(USER_KEY, u); return u; }
  function signOut() { try { localStorage.removeItem(USER_KEY); } catch (e) {} }

  /* ── orders ────────────────────────────────────────────────────────────── */
  function orders() { return read(ORDER_KEY, []); }

  function orderRef() {
    var d = new Date();
    var stamp = String(d.getFullYear()).slice(2) +
                String(d.getMonth() + 1).padStart(2, '0') +
                String(d.getDate()).padStart(2, '0');
    return 'KAA-' + stamp + '-' + String(Math.floor(Math.random() * 9000) + 1000);
  }

  function placeOrder(details, payment) {
    var t = totals();
    if (!t.lines.length) return null;
    var order = {
      ref: orderRef(),
      placedAt: new Date().toISOString(),
      status: 'confirmed',
      customer: details,
      payment: payment,
      items: t.lines.map(function (l) {
        return {
          sku: l.sku, name: l.product.name, variant: l.variant.label,
          qty: l.qty, unit: l.unit, gross: l.gross, gstRate: l.gstRate,
          hsn: l.product.hsn, photo: l.product.photo
        };
      }),
      base: t.base, tax: t.tax, byRate: t.byRate,
      shipping: t.shipping, total: t.total
    };
    var all = orders();
    all.unshift(order);
    write(ORDER_KEY, all);
    clear();
    return order;
  }

  /* ── payment ───────────────────────────────────────────────────────────────
     The real flow is:

       browser  -> POST /commerce/order   { items }        (Worker prices it)
       Worker   -> Razorpay Orders API                     (server-side key)
       Worker   -> browser  { order_id, amount, key_id }
       browser  -> Razorpay Checkout
       Razorpay -> browser  { payment_id, order_id, signature }
       browser  -> POST /commerce/verify  { those three }
       Worker   -> HMAC-SHA256 check with the key SECRET, then mark paid

     Note what is missing: at no point does the browser tell the server that a
     payment succeeded. It relays a signature the server checks. A client-side
     "if (response.status === 'paid')" is trivially forged with devtools open.

     API is empty in this demo because no commerce Worker is deployed and no
     Razorpay account exists yet, so this returns a clearly-labelled simulated
     result. It never pretends a real payment happened. */
  function pay(details) {
    if (!API) {
      return Promise.resolve({
        simulated: true,
        method: 'Simulated (test mode)',
        paymentId: 'pay_demo_' + Math.random().toString(36).slice(2, 12)
      });
    }
    var t = totals();
    return fetch(API + '/commerce/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: getCart(),
        customer: { name: details.name, email: details.email, phone: details.phone }
      })
    })
      .then(function (r) { return r.json(); })
      .then(function (created) {
        if (!created || !created.order_id) throw new Error('order not created');
        return new Promise(function (resolve, reject) {
          var rzp = new window.Razorpay({
            key: created.key_id,
            order_id: created.order_id,
            amount: created.amount,
            currency: 'INR',
            name: 'Kaarigar',
            prefill: { name: details.name, email: details.email, contact: details.phone },
            handler: function (resp) {
              fetch(API + '/commerce/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(resp)
              })
                .then(function (r) { return r.json(); })
                .then(function (v) {
                  // The Worker's verdict is the only one that counts.
                  if (v && v.verified) resolve({ simulated: false, method: v.method, paymentId: resp.razorpay_payment_id });
                  else reject(new Error('payment could not be verified'));
                })
                .catch(reject);
            },
            modal: { ondismiss: function () { reject(new Error('cancelled')); } }
          });
          rzp.open();
        });
      });
  }

  /* ── shared chrome ─────────────────────────────────────────────────────────
     Every page has a cart badge in the header; wire it once here rather than
     in eight separate files. */
  function mountBadge() {
    var badges = document.querySelectorAll('[data-cart-count]');
    if (!badges.length) return;
    function paint() {
      var n = count();
      badges.forEach(function (b) {
        b.textContent = n;
        b.hidden = n === 0;
      });
    }
    paint();
    onChange(paint);
    // A second tab is a different page with the same cart. Keep them in step.
    window.addEventListener('storage', function (e) { if (e.key === CART_KEY) paint(); });
  }

  document.addEventListener('DOMContentLoaded', mountBadge);

  return {
    rupees: rupees, taxSplit: taxSplit,
    add: add, setQty: setQty, remove: remove, clear: clear,
    count: count, lines: lines, totals: totals, onChange: onChange,
    search: search,
    getUser: getUser, setUser: setUser, signOut: signOut,
    orders: orders, placeOrder: placeOrder, pay: pay,
    mountBadge: mountBadge,
    FREE_SHIPPING_OVER: FREE_SHIPPING_OVER,
    _keys: { cart: CART_KEY, orders: ORDER_KEY, user: USER_KEY }
  };
})();
