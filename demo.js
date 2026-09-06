/* demo.js — shared JS for all category demo sites
   v2 · 2026-05-21
   Adds: real filter behaviour, listing count + sort, jump-nav scroll-spy,
   open-now state, FAQ accordion, calendar/time-slot, EMI calc, mobile nav.
*/

(function () {
  'use strict';

  /* ── Track A capability gates ────────────────────────────────────────
     Read once, then used by the reveal hand-off, the scroll progress bar
     and the tilt. Every read is wrapped: demo.js also runs under jsdom in
     the test suite, where matchMedia and CSS.supports are stubs or absent,
     and a throw at this depth would silently kill every behaviour defined
     below it — the exact failure mode the test suite exists to catch. */
  var mq = function (q) {
    try { return !!(window.matchMedia && window.matchMedia(q).matches); }
    catch (e) { return false; }
  };
  var reducedMotion = mq('(prefers-reduced-motion: reduce)');
  var finePointer   = mq('(pointer: fine)');
  var scrollTimelines = false;
  try {
    scrollTimelines = !!(window.CSS && window.CSS.supports &&
                         window.CSS.supports('animation-timeline: view()'));
  } catch (e) {}
  /* When true, demo.css drives the reveals on a view() timeline and this
     file must not also drive them — see TRACK A at the end of demo.css. */
  var cssDrivesReveals = scrollTimelines && !reducedMotion;


  // ── Industry switcher (preview bar) ──
  const pbSwitch = document.getElementById('pbSwitch');
  const pbBtn    = document.getElementById('pbSwitchBtn');
  if (pbSwitch && pbBtn) {
    const setOpen = (open) => {
      pbSwitch.classList.toggle('open', open);
      pbBtn.setAttribute('aria-expanded', String(open));
    };
    pbBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setOpen(!pbSwitch.classList.contains('open'));
    });
    document.addEventListener('click', (e) => {
      if (!pbSwitch.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });
    // Keyboard: arrow through the industry list
    pbSwitch.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      const items = [...pbSwitch.querySelectorAll('.pb-item')];
      if (!items.length) return;
      e.preventDefault();
      setOpen(true);
      const i = items.indexOf(document.activeElement);
      const nextI = e.key === 'ArrowDown'
        ? (i + 1) % items.length
        : (i <= 0 ? items.length - 1 : i - 1);
      items[nextI].focus();
    });
  }

  // ── Nav scroll state ──
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ── Mobile nav toggle ──
  const toggle = document.getElementById('navToggle');
  const links  = document.getElementById('navLinks');
  if (toggle && links) {
    const setIcon = (open) => {
      toggle.setAttribute('aria-expanded', open);
      toggle.querySelectorAll('span').forEach((s, i) => {
        if (open) {
          if (i === 0) s.style.transform = 'translateY(7px) rotate(45deg)';
          if (i === 1) s.style.opacity = '0';
          if (i === 2) s.style.transform = 'translateY(-7px) rotate(-45deg)';
        } else {
          s.style.transform = ''; s.style.opacity = '';
        }
      });
    };
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = !links.classList.contains('open');
      links.classList.toggle('open', open);
      setIcon(open);
    });
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && links.classList.contains('open')) {
        links.classList.remove('open');
        setIcon(false);
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && links.classList.contains('open')) {
        links.classList.remove('open');
        setIcon(false);
      }
    });
  }

  // ── Active nav link ──
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach((a) => {
    const href = a.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  // ── Scroll reveal ──
  // Skipped entirely when demo.css owns this on a scroll timeline: the two
  // must never drive opacity on the same element at the same time.
  const reveals = cssDrivesReveals ? [] : document.querySelectorAll('.reveal');
  if (reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => io.observe(el));
  }

  // ── FAQ accordion ──
  document.querySelectorAll('.faq-question').forEach((q) => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq-item');
      const wasOpen = item.classList.contains('open');
      item.closest('.faq-list, .wrap, section')
        ?.querySelectorAll('.faq-item').forEach((i) => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  // ── Calendar / time-slot demo (decorative) ──
  document.querySelectorAll('.cal-date:not(.off)').forEach((d) => {
    d.addEventListener('click', () => {
      d.closest('.cal-grid').querySelectorAll('.cal-date').forEach((x) => x.classList.remove('sel'));
      d.classList.add('sel');
    });
  });
  document.querySelectorAll('.time-slot:not(.full)').forEach((s) => {
    s.addEventListener('click', () => {
      s.closest('.time-slots').querySelectorAll('.time-slot').forEach((x) => x.classList.remove('sel'));
      s.classList.add('sel');
    });
  });

  // ── EMI calculator ──
  function updateCalc() {
    const loan   = document.getElementById('loanAmt');
    const rate   = document.getElementById('intRate');
    const tenure = document.getElementById('tenureYr');
    const result = document.getElementById('emiResult');
    if (!loan || !result) return;
    const p = parseFloat(loan.value) || 5000000;
    const r = (parseFloat(rate ? rate.value : 8.5)) / 12 / 100;
    const n = (parseFloat(tenure ? tenure.value : 20)) * 12;
    const emi = p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    result.textContent = '₹ ' + Math.round(emi).toLocaleString('en-IN');
    const loanVal = document.getElementById('loanVal');
    const rateVal = document.getElementById('rateVal');
    const tenureVal = document.getElementById('tenureVal');
    if (loanVal) loanVal.textContent = '₹ ' + p.toLocaleString('en-IN');
    if (rateVal) rateVal.textContent = (rate ? rate.value : 8.5) + '%';
    if (tenureVal) tenureVal.textContent = (tenure ? tenure.value : 20) + ' yrs';
  }
  ['loanAmt', 'intRate', 'tenureYr'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateCalc);
  });
  updateCalc();

  // ── Preview-bar body class ──
  if (document.querySelector('.preview-bar')) {
    document.body.classList.add('has-preview-bar');
  }

  /* ──────────────────────────────────────────────────────────────────
     NEW IN v2
     ────────────────────────────────────────────────────────────────── */

  // ── REAL filter behaviour (was a no-op before) ──
  // Works for both .filter-tab and .filter-btn. Reads data-filter attr or button text.
  // Filters siblings that carry data-cat (space-separated keywords).
  function setupFilterGroup(group) {
    const buttons = group.querySelectorAll('.filter-tab, .filter-btn');
    if (!buttons.length) return;

    // ARIA roles
    group.setAttribute('role', 'tablist');
    buttons.forEach((b, i) => {
      b.setAttribute('role', 'tab');
      b.setAttribute('tabindex', b.classList.contains('active') ? '0' : '-1');
      b.setAttribute('aria-selected', b.classList.contains('active') ? 'true' : 'false');
    });

    // Find the grid this filter group controls (next listing in DOM)
    const scope = group.closest('section') || document;
    const items = scope.querySelectorAll('[data-cat]');

    const apply = (filter) => {
      const f = String(filter || 'all').toLowerCase().trim();
      let shown = 0;
      items.forEach((card) => {
        const cats = (card.dataset.cat || '').toLowerCase();
        const match = f === 'all' || cats.split(/\s+/).includes(f);
        card.style.display = match ? '' : 'none';
        if (match) shown++;
      });
      // Update count chip if present
      const countEl = scope.querySelector('[data-count]');
      if (countEl) {
        const total = items.length;
        countEl.innerHTML = shown === total
          ? `<strong>${total}</strong> ${countEl.dataset.label || 'results'}`
          : `<strong>${shown}</strong> of ${total} ${countEl.dataset.label || 'results'}`;
      }
    };

    const select = (btn) => {
      buttons.forEach((b) => {
        const on = b === btn;
        b.classList.toggle('active', on);
        b.setAttribute('aria-selected', on ? 'true' : 'false');
        b.setAttribute('tabindex', on ? '0' : '-1');
      });
      const filter = btn.dataset.filter || btn.textContent;
      apply(filter);
    };

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => select(btn));
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const arr = [...buttons];
          const idx = arr.indexOf(btn);
          const next = e.key === 'ArrowRight'
            ? arr[(idx + 1) % arr.length]
            : arr[(idx - 1 + arr.length) % arr.length];
          next.focus();
          select(next);
        }
      });
    });

    // Initial apply (in case "all" isn't the active one)
    const active = group.querySelector('.active') || buttons[0];
    apply(active.dataset.filter || active.textContent);
  }
  document.querySelectorAll('.filter-tabs').forEach(setupFilterGroup);

  // ── Listing sort dropdown ──
  document.querySelectorAll('.listing-sort select').forEach((sel) => {
    sel.addEventListener('change', () => {
      const grid = document.querySelector(sel.dataset.target);
      if (!grid) return;
      const cards = [...grid.children];
      const key = sel.value;
      const priceOf = (c) => {
        const t = (c.querySelector('.product-price, .property-price')?.textContent || '').replace(/[^\d.]/g, '');
        return parseFloat(t) || 0;
      };
      const nameOf = (c) => (c.querySelector('.product-name, .property-name')?.textContent || '').toLowerCase();
      cards.sort((a, b) => {
        if (key === 'price-asc') return priceOf(a) - priceOf(b);
        if (key === 'price-desc') return priceOf(b) - priceOf(a);
        if (key === 'name') return nameOf(a).localeCompare(nameOf(b));
        return 0; // default / featured = original order
      });
      cards.forEach((c) => grid.appendChild(c));
    });
  });

  // ── Jump-nav scroll spy ──
  const jumpLinks = document.querySelectorAll('.jump-link[href^="#"]');
  if (jumpLinks.length) {
    const targets = [...jumpLinks]
      .map((a) => ({ link: a, el: document.querySelector(a.getAttribute('href')) }))
      .filter((t) => t.el);

    const spy = () => {
      const navOffset = (document.querySelector('.nav')?.offsetHeight || 0)
                      + (document.querySelector('.jump-nav')?.offsetHeight || 0)
                      + 40;
      let activeIdx = 0;
      targets.forEach((t, i) => {
        if (t.el.getBoundingClientRect().top - navOffset <= 0) activeIdx = i;
      });
      targets.forEach((t, i) => t.link.classList.toggle('active', i === activeIdx));
    };
    window.addEventListener('scroll', spy, { passive: true });
    spy();

    // Smooth scroll with nav offset
    jumpLinks.forEach((a) => {
      a.addEventListener('click', (e) => {
        const target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        const offset = (document.querySelector('.nav')?.offsetHeight || 0)
                     + (document.querySelector('.jump-nav')?.offsetHeight || 0)
                     + 8;
        const y = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      });
    });
  }

  // ── Open-now state for .local-bar[data-hours] ──
  // data-hours format: "Mon-Sat 10:00-20:00" or "Mon-Sun 09:00-13:00,17:00-20:00"
  document.querySelectorAll('.local-bar[data-hours]').forEach((bar) => {
    const dot = bar.querySelector('.live-dot');
    const label = bar.querySelector('[data-open-label]');
    if (!dot || !label) return;

    const spec = bar.dataset.hours;
    const now = new Date();
    const dayShort = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][now.getDay()];
    const minutes = now.getHours() * 60 + now.getMinutes();

    const dayOrder = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const inDayRange = (range) => {
      const [a, b] = range.split('-');
      if (!b) return range === dayShort;
      const ai = dayOrder.indexOf(a);
      const bi = dayOrder.indexOf(b);
      const ci = dayOrder.indexOf(dayShort);
      if (ai === -1 || bi === -1) return false;
      return ai <= bi ? (ci >= ai && ci <= bi) : (ci >= ai || ci <= bi);
    };

    let open = false;
    let closesAt = '';
    spec.split(';').forEach((slot) => {
      const [dayRange, timeRanges] = slot.trim().split(' ');
      if (!timeRanges) return;
      if (!inDayRange(dayRange)) return;
      timeRanges.split(',').forEach((tr) => {
        const [start, end] = tr.split('-').map((t) => {
          const [h, m] = t.split(':').map(Number);
          return h * 60 + (m || 0);
        });
        if (minutes >= start && minutes < end) {
          open = true;
          const h = Math.floor(end / 60), m = end % 60;
          const ampm = h >= 12 ? 'PM' : 'AM';
          const h12 = ((h + 11) % 12) + 1;
          closesAt = `${h12}${m ? ':' + String(m).padStart(2, '0') : ''} ${ampm}`;
        }
      });
    });

    dot.classList.toggle('closed', !open);
    label.textContent = open
      ? `Open now · closes ${closesAt}`
      : 'Closed now · see hours';
  });

  // ── WhatsApp prefill from data-wa attributes ──
  document.querySelectorAll('[data-wa-prefill]').forEach((a) => {
    const msg = a.dataset.waPrefill;
    if (!msg) return;
    try {
      const u = new URL(a.href);
      if (!u.searchParams.has('text')) u.searchParams.set('text', msg);
      a.href = u.toString();
    } catch {}
  });

  // ── Skip-to-main link (a11y) ──
  const main = document.querySelector('main, .section, section');
  if (main) {
    if (!main.id) main.id = 'main-content';
    const skip = document.createElement('a');
    skip.href = '#' + main.id;
    skip.className = 'skip-link';
    skip.textContent = 'Skip to main content';
    document.body.insertBefore(skip, document.body.firstChild);
  }

  // ── Mobile sticky CTA bar (reads data-mobile-cta on body) ──
  const ctaText = document.body.dataset.mobileCta;
  const ctaHref = document.body.dataset.mobileCtatarget || '#';
  const ctaIcon = document.body.dataset.mobileCtagicon || 'fa-regular fa-calendar';
  if (ctaText) {
    const bar = document.createElement('div');
    bar.className = 'mobile-cta-bar';
    bar.innerHTML = `<a href="${ctaHref}" class="mobile-cta-btn"><i class="${ctaIcon}"></i> ${ctaText}</a>`;
    document.body.appendChild(bar);
  }

  /* ── Personalised preview (?biz=) ─────────────────────────────────────────
     The hero on netloom.in asks for a business name and then sends the visitor
     here with ?biz=<name>. Wearing their own name for thirty seconds sells the
     template far harder than "Mallika Jewels" does, so swap the wordmark and
     carry the parameter across the demo's own pages.
     Everything here is presentation only — the name is never stored or sent. */
  (function netloomBizPreview(){
    var biz = '', embed = false;
    try {
      var qs = new URLSearchParams(location.search);
      biz   = (qs.get('biz') || '').trim().slice(0, 40);
      embed = qs.get('embed') === '1';
    } catch (e) { return; }

    // Embedded in the homepage preview modal: drop this page's own preview bar
    // and collapse the space it reserved, so the visitor sees only the site.
    if (embed) {
      document.documentElement.classList.add('is-embedded');
      document.documentElement.style.setProperty('--preview-h', '0px');
      var pb = document.querySelector('.preview-bar');
      if (pb) pb.remove();
    }

    if (!biz) return;

    // The name lands in the DOM as text only — never innerHTML — so a crafted
    // ?biz= cannot inject markup into the page.
    var logo = document.querySelector('.nav-logo');
    if (logo) {
      var em = logo.querySelector('em');
      logo.textContent = biz;
      if (em) logo.appendChild(em);
    }

    document.title = biz + ' — website preview by Netloom';

    // Tell them plainly that this is their name on someone else's demo.
    var bar = document.querySelector('.preview-bar .pb-tagline');
    if (bar && bar.parentNode) {
      var pill = document.createElement('span');
      pill.className = 'pb-biz';
      pill.textContent = 'Previewing as ' + biz;
      bar.parentNode.insertBefore(pill, bar.nextSibling);
    }

    // Keep the name while they click around inside the demo.
    var q = 'biz=' + encodeURIComponent(biz);
    document.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href || /^(https?:|mailto:|tel:|#)/i.test(href)) return;
      if (href.indexOf('biz=') > -1) return;
      a.setAttribute('href', href + (href.indexOf('?') > -1 ? '&' : '?') + q);
    });
  })();

  /* ── TRACK A · scroll progress ────────────────────────────────────────
     The bar is driven entirely by `animation-timeline: scroll(root)` in
     demo.css. All this does is supply the element, which is why no page
     markup had to change and why there is no scroll listener here. */
  if (cssDrivesReveals) {
    var prog = document.createElement('div');
    prog.className = 'ntl-progress';
    prog.setAttribute('aria-hidden', 'true');
    document.body.appendChild(prog);
  }

  /* ── TRACK A · cursor-reactive tilt ───────────────────────────────────
     Reads as 3D and costs no library. Gated on a fine pointer with motion
     allowed, so touch devices and reduced-motion users keep exactly the
     hover behaviour they had before.

     One delegated listener, not four per card — a listing page carries
     forty of these — and the rect is read inside rAF so a pointermove
     storm cannot force more than one layout per frame. */
  if (finePointer && !reducedMotion) {
    var TILT_SEL = '.card,.feature,.blog-card,.product-card,' +
                   '.property-card,.team-card,.pricing-card,.testimonial';
    document.documentElement.classList.add('tilt');

    var tiltEl = null, tiltX = 0, tiltY = 0, tiltRaf = 0;

    var clearTilt = function () {
      if (!tiltEl) return;
      // Dropping the class restores the long ease, so it settles back flat.
      tiltEl.classList.remove('ntl-tilting');
      ['--rx', '--ry', '--mx', '--my'].forEach(function (p) {
        tiltEl.style.removeProperty(p);
      });
      tiltEl = null;
    };

    var applyTilt = function () {
      tiltRaf = 0;
      if (!tiltEl || !tiltEl.isConnected) return;
      var r = tiltEl.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var px = (tiltX - r.left) / r.width;
      var py = (tiltY - r.top) / r.height;
      var st = tiltEl.style;
      st.setProperty('--ry', ((px - 0.5) * 7).toFixed(2) + 'deg');
      st.setProperty('--rx', ((0.5 - py) * 5).toFixed(2) + 'deg');
      st.setProperty('--mx', (px * 100).toFixed(1) + '%');
      st.setProperty('--my', (py * 100).toFixed(1) + '%');
    };

    document.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      var el = (e.target && e.target.closest) ? e.target.closest(TILT_SEL) : null;
      if (el !== tiltEl) {
        clearTilt();
        tiltEl = el;
        if (el) el.classList.add('ntl-tilting');
      }
      if (!tiltEl) return;
      tiltX = e.clientX; tiltY = e.clientY;
      if (!tiltRaf) tiltRaf = requestAnimationFrame(applyTilt);
    }, { passive: true });

    document.addEventListener('pointerleave', clearTilt);
    window.addEventListener('blur', clearTilt);
  }

  // ── Cookie consent banner ──
  if (!localStorage.getItem('cookie_consent') &&
      !document.documentElement.classList.contains('is-embedded')) {
    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.innerHTML = `
      <p>We use cookies to improve your experience. By continuing you agree to our <a href="/privacy.html">privacy policy</a>.</p>
      <div class="cookie-banner-actions">
        <button class="btn-cookie-decline">Decline</button>
        <button class="btn-cookie-accept">Accept</button>
      </div>`;
    document.body.appendChild(banner);
    requestAnimationFrame(() => banner.classList.add('visible'));
    banner.querySelector('.btn-cookie-accept').addEventListener('click', () => {
      localStorage.setItem('cookie_consent', 'accepted');
      banner.classList.remove('visible');
      setTimeout(() => banner.remove(), 300);
    });
    banner.querySelector('.btn-cookie-decline').addEventListener('click', () => {
      localStorage.setItem('cookie_consent', 'declined');
      banner.classList.remove('visible');
      setTimeout(() => banner.remove(), 300);
    });
  }

})();
