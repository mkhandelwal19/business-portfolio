/* =============================================================================
   commerce/chrome.js — the header and footer, in one place
   -----------------------------------------------------------------------------
   Eleven pages share this. Pasting the same header into eleven files is how a
   nav link ends up correct on nine of them and wrong on two, which is exactly
   the class of bug that has already cost this repo a session.

   Injecting rather than hard-coding is defensible here specifically because
   the store already requires JavaScript to function at all — there is no cart
   without it. On the brochure demos, where the markup has to stand alone, the
   chrome stays in the HTML.
   ========================================================================== */
(function () {
  'use strict';

  var NAV = [
    { href: 'shop.html',    label: 'Shop' },
    { href: 'index.html#crafts', label: 'Crafts' },
    { href: 'account.html', label: 'Orders' },
    { href: 'admin.html',   label: 'Admin' }
  ];

  var LEGAL = [
    { href: 'shipping.html', label: 'Shipping' },
    { href: 'refunds.html',  label: 'Refunds & cancellation' },
    { href: 'terms.html',    label: 'Terms of service' },
    { href: 'privacy.html',  label: 'Privacy' }
  ];

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  /* ?biz= and ?embed=1 — the same contract every other Netloom demo honours.
     The homepage hero sends visitors here with their own business name, and
     embeds the result in a modal. Read once, before the chrome is built, so
     the preview bar is never inserted only to be torn out again. */
  var BIZ = '', EMBED = false;
  try {
    var qs = new URLSearchParams(location.search);
    BIZ = (qs.get('biz') || '').trim().slice(0, 40);
    EMBED = qs.get('embed') === '1';
  } catch (e) { /* no URLSearchParams: fall through as a normal visit */ }

  /* Carry the name across the store's own pages, so it survives a click from
     the shop to a product to the basket. */
  function keepBiz() {
    if (!BIZ && !EMBED) return;
    var q = [];
    if (BIZ) q.push('biz=' + encodeURIComponent(BIZ));
    if (EMBED) q.push('embed=1');
    var extra = q.join('&');
    document.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href || /^(https?:|mailto:|tel:|#)/i.test(href)) return;
      if (href.indexOf('biz=') > -1 || href.indexOf('embed=1') > -1) return;
      a.setAttribute('href', href + (href.indexOf('?') > -1 ? '&' : '?') + extra);
    });
  }

  function mount() {
    var page = document.body.getAttribute('data-page') || '';

    if (EMBED) document.documentElement.classList.add('is-embedded');

    /* ── preview bar ── */
    var host = document.getElementById('chrome-top');
    if (host) {
      host.insertAdjacentHTML('beforebegin',
        '<a class="skip" href="#main">Skip to main content</a>' +
        (EMBED ? '' :
        '<div class="preview-bar">' +
          '<span class="pb-badge">Premium demo</span>' +
          '<span class="pb-tagline">Built by <a href="../index.html">Netloom</a></span>' +
          (BIZ ? '<span class="pb-badge" id="pbBiz"></span>' : '') +
          '<span class="pb-spacer"></span>' +
          '<a class="pb-cta" href="../index.html#contact">' +
            '<i class="fa-solid fa-bolt" style="font-size:9px"></i> Get mine</a>' +
        '</div>'));

      var nav = NAV.map(function (n) {
        var here = n.href.split('#')[0] === page;
        return '<li><a href="' + n.href + '"' + (here ? ' aria-current="page"' : '') + '>' + n.label + '</a></li>';
      }).join('');

      host.outerHTML =
        '<header class="head">' +
          '<div class="head-in">' +
            '<a class="brand" href="index.html">' + (BIZ ? esc(BIZ) : 'Kaarigar') + '<em>.</em></a>' +
            '<ul class="head-nav">' + nav + '</ul>' +
            '<div class="search">' +
              '<i class="fa-solid fa-magnifying-glass"></i>' +
              '<input id="headSearch" type="search" placeholder="Search dhokra, kantha, terracotta…" ' +
                     'aria-label="Search the shop">' +
            '</div>' +
            '<div class="head-sp"></div>' +
            '<div class="head-act">' +
              '<a class="icon-btn" href="account.html" aria-label="Your orders">' +
                '<i class="fa-regular fa-user"></i></a>' +
              '<a class="icon-btn" href="cart.html" aria-label="Your basket">' +
                '<i class="fa-solid fa-basket-shopping"></i>' +
                '<span class="badge" data-cart-count hidden>0</span></a>' +
            '</div>' +
          '</div>' +
        '</header>';

      /* Search from any page lands on the catalogue with the query applied. */
      var s = document.getElementById('headSearch');
      if (s) {
        s.addEventListener('keydown', function (e) {
          if (e.key !== 'Enter') return;
          var q = s.value.trim();
          location.href = 'shop.html' + (q ? '?q=' + encodeURIComponent(q) : '');
        });
      }
    }

    /* ── footer ── */
    var foot = document.getElementById('chrome-foot');
    if (foot) {
      foot.outerHTML =
        '<footer class="foot"><div class="wrap"><div class="foot-in">' +
          '<div>' +
            '<div class="foot-brand">Kaarigar<em>.</em></div>' +
            '<p class="foot-note">Bengal handicraft, bought from the maker and ' +
            'shipped from Kolkata. A demonstration store built by Netloom.</p>' +
          '</div>' +
          '<div><h4>Shop</h4><ul>' +
            '<li><a href="shop.html">Everything</a></li>' +
            '<li><a href="shop.html?cat=metalwork">Metalwork</a></li>' +
            '<li><a href="shop.html?cat=textiles">Textiles</a></li>' +
            '<li><a href="shop.html?cat=terracotta">Terracotta</a></li>' +
          '</ul></div>' +
          '<div><h4>The legal bit</h4><ul>' +
            LEGAL.map(function (l) { return '<li><a href="' + l.href + '">' + l.label + '</a></li>'; }).join('') +
          '</ul></div>' +
          '<div><h4>Built by</h4><ul>' +
            '<li><a href="../index.html">Netloom</a></li>' +
            '<li><a href="../index.html#pricing">What this tier costs</a></li>' +
            '<li><a href="../jewellery-lux/index.html">3D flagship</a></li>' +
            '<li><a href="../index.html#contact">Get one like this</a></li>' +
          '</ul></div>' +
        '</div>' +
        '<div class="foot-bottom">' +
          '<span>Fictional store. Built by Netloom as a demonstration — no order is real.</span>' +
          '<span>GSTIN 19AAAAA0000A1Z5 · Kolkata</span>' +
        '</div></div></footer>';
    }

    /* The badge lives in markup this file has only just injected, so store.js
       cannot have found it on DOMContentLoaded — its listener was registered
       first, because its <script> comes first. Wire it now the header exists. */
    if (window.Store && Store.mountBadge) Store.mountBadge();

    /* Text only, never innerHTML — a crafted ?biz= must not be able to inject
       markup into the page. */
    var pill = document.getElementById('pbBiz');
    if (pill) pill.textContent = 'Previewing as ' + BIZ;
    if (BIZ) document.title = BIZ + ' — store preview by Netloom';
    keepBiz();
  }

  /* Toast, shared by every page that changes the cart. */
  window.toast = function (msg, icon) {
    var t = document.querySelector('.toast');
    if (!t) { t = el('div', 'toast'); document.body.appendChild(t); }
    t.innerHTML = '<i class="fa-solid ' + (icon || 'fa-circle-check') + '"></i><span></span>';
    t.querySelector('span').textContent = msg;
    requestAnimationFrame(function () { t.classList.add('show'); });
    clearTimeout(t._t);
    t._t = setTimeout(function () { t.classList.remove('show'); }, 2600);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
