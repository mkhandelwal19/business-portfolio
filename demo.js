/* demo.js — shared JS for all category demo sites
   v2 · 2026-05-21
   Adds: real filter behaviour, listing count + sort, jump-nav scroll-spy,
   open-now state, FAQ accordion, calendar/time-slot, EMI calc, mobile nav.
*/

(function () {
  'use strict';

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
  const reveals = document.querySelectorAll('.reveal');
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

  // ── Cookie consent banner ──
  if (!localStorage.getItem('cookie_consent')) {
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
