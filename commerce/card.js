/* =============================================================================
   commerce/card.js — one product card, rendered the same way everywhere
   -----------------------------------------------------------------------------
   The storefront and the catalogue both show product tiles. Two copies of this
   markup would drift the first time a price format or a stock label changed.

   The card is a <div>, not an <a>, and that matters: it contains a button and
   sometimes a <select>, and interactive controls nested inside an anchor are
   invalid HTML. Browsers "fix" it by closing the anchor early, which breaks the
   click target in ways that differ per browser. So the link wraps only the
   parts that navigate, and the buy controls sit outside it.
   ========================================================================== */
(function () {
  'use strict';

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* Stock language is deliberately specific. "In stock" tells a buyer nothing;
     "only 2 left" is what actually moves a decision, and it is only honest to
     say it when it is true. */
  function stockTag(p) {
    if (p.stock === 0) return '<span class="card-tag">Sold out</span>';
    if (p.stock <= 3)  return '<span class="card-tag low">Only ' + p.stock + ' left</span>';
    return '';
  }

  window.cardHtml = function (p) {
    var off = Math.round((1 - p.price / p.mrp) * 100);
    var many = p.variants.length > 1;
    var soldOut = p.stock === 0;

    /* Products with one option add straight to the basket. Products with
       several get the chooser inline rather than a "Choose options" button
       that bounces the customer to another page — which is the whole point of
       a quick-add. */
    var chooser = many
      ? '<select class="card-var" data-variant aria-label="Choose an option for ' + esc(p.name) + '">' +
          p.variants.map(function (v) {
            return '<option value="' + esc(v.id) + '">' + esc(v.label) +
                   (v.delta ? ' · +' + Store.rupees(v.delta) : '') + '</option>';
          }).join('') +
        '</select>'
      : '';

    return '' +
      '<div class="card" data-sku="' + esc(p.sku) + '">' +
        '<a class="card-link" href="product.html?sku=' + encodeURIComponent(p.sku) + '">' +
          '<div class="card-media">' +
            '<img src="' + CATALOG.img(p.photo, 'md') + '" alt="' + esc(p.name) + '" ' +
                 'loading="lazy" decoding="async">' +
            stockTag(p) +
          '</div>' +
          '<div class="card-body">' +
            '<div class="card-craft">' + esc(p.craft) + '</div>' +
            '<div class="card-name">' + esc(p.name) + '</div>' +
            '<div class="card-origin">' + esc(p.origin) + '</div>' +
            '<div class="card-foot">' +
              '<span class="card-price">' + Store.rupees(p.price) + '</span>' +
              (p.mrp > p.price ? '<span class="card-mrp">' + Store.rupees(p.mrp) + '</span>' : '') +
              (off > 0 ? '<span class="card-off">' + off + '% off</span>' : '') +
            '</div>' +
          '</div>' +
        '</a>' +
        '<div class="card-add">' +
          chooser +
          '<button type="button" class="btn btn-primary btn-sm card-buy" data-add' +
            (soldOut ? ' disabled' : '') + '>' +
            (soldOut ? 'Sold out'
                     : '<i class="fa-solid fa-basket-shopping"></i> Add') +
          '</button>' +
        '</div>' +
      '</div>';
  };

  /* One delegated listener for every grid on the page. Grids are re-rendered
     when a filter changes, so per-button handlers would have to be re-bound
     each time and one missed re-bind is a dead Add button nobody notices. */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-add]');
    if (!btn) return;

    var card = btn.closest('.card');
    if (!card) return;
    var sku = card.getAttribute('data-sku');
    var p = CATALOG.bySku(sku);
    if (!p) return;

    var sel = card.querySelector('[data-variant]');
    var variantId = sel ? sel.value : p.variants[0].id;
    var variant = p.variants.filter(function (v) { return v.id === variantId; })[0] || p.variants[0];

    var r = Store.add(sku, variantId, 1);

    if (r.ok && r.capped) {
      window.toast('Added — that is all ' + r.max + ' we have', 'fa-triangle-exclamation');
    } else if (r.ok) {
      // Name the option that went in. On a multi-variant product, silently
      // adding "whichever was showing" is how people end up with the wrong size.
      window.toast(p.name + (p.variants.length > 1 ? ' · ' + variant.label : '') + ' added');
      flash(btn);
    } else if (r.reason === 'out-of-stock') {
      window.toast('Sold out', 'fa-circle-xmark');
    } else if (r.reason === 'stock-capped') {
      window.toast('Your basket already has all ' + r.max, 'fa-triangle-exclamation');
    }
  });

  /* A toast alone is easy to miss on a long grid — confirm at the button the
     customer's eye is already on. */
  function flash(btn) {
    if (btn.dataset.busy) return;
    btn.dataset.busy = '1';
    var original = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Added';
    btn.classList.add('is-added');
    setTimeout(function () {
      btn.innerHTML = original;
      btn.classList.remove('is-added');
      delete btn.dataset.busy;
    }, 1400);
  }

  window.escapeHtml = esc;
})();
