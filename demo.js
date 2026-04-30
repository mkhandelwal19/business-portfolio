/* demo.js — shared JS for all category demo sites */

(function () {
  // ── Nav scroll state ──
  const nav = document.querySelector('.nav');
  if (nav) {
    window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 40), { passive: true });
  }

  // ── Mobile nav toggle ──
  const toggle = document.getElementById('navToggle');
  const links  = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
      const open = links.classList.contains('open');
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
    });
    document.addEventListener('click', e => {
      if (!nav.contains(e.target)) {
        links.classList.remove('open');
        toggle.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      }
    });
  }

  // ── Active nav link ──
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  // ── Scroll reveal ──
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    reveals.forEach(el => io.observe(el));
  }

  // ── FAQ accordion ──
  document.querySelectorAll('.faq-question').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq-item');
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  // ── Calendar demo (decorative) ──
  document.querySelectorAll('.cal-date:not(.off)').forEach(d => {
    d.addEventListener('click', () => {
      d.closest('.cal-grid').querySelectorAll('.cal-date').forEach(x => x.classList.remove('sel'));
      d.classList.add('sel');
    });
  });
  document.querySelectorAll('.time-slot:not(.full)').forEach(s => {
    s.addEventListener('click', () => {
      s.closest('.time-slots').querySelectorAll('.time-slot').forEach(x => x.classList.remove('sel'));
      s.classList.add('sel');
    });
  });

  // ── Filter tabs ──
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      tab.closest('.filter-tabs').querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  // ── EMI calculator ──
  function updateCalc() {
    const loan   = document.getElementById('loanAmt');
    const rate   = document.getElementById('intRate');
    const tenure = document.getElementById('tenureYr');
    const result = document.getElementById('emiResult');
    if (!loan || !result) return;
    const p = parseFloat(loan.value)  || 5000000;
    const r = (parseFloat(rate ? rate.value : 8.5)) / 12 / 100;
    const n = (parseFloat(tenure ? tenure.value : 20)) * 12;
    const emi = p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    result.textContent = '₹ ' + Math.round(emi).toLocaleString('en-IN');
    ['loanVal','rateVal','tenureVal'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (id === 'loanVal')   el.textContent = '₹ ' + p.toLocaleString('en-IN');
        if (id === 'rateVal')   el.textContent = (rate ? rate.value : 8.5) + '%';
        if (id === 'tenureVal') el.textContent = (tenure ? tenure.value : 20) + ' yrs';
      }
    });
  }
  ['loanAmt','intRate','tenureYr'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateCalc);
  });
  updateCalc();

  // ── Add preview bar body class ──
  if (document.querySelector('.preview-bar')) {
    document.body.classList.add('has-preview-bar');
  }
})();
