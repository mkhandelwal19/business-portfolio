/* Track A — the modern-UI uplift in demo.css / demo.js.
   ----------------------------------------------------------------------------
   These two files are shared by all 80 demo pages, so the failure mode that
   matters is not "the animation looks wrong", it is "every page is blank and
   nothing throws". The suite therefore presents demo.js with several different
   sets of browser capabilities and checks it hands work to CSS exactly once,
   plus asserts the one CSS invariant the whole design rests on. */
'use strict';
const fs = require('fs');
const path = require('path');
const { ROOT, loadPage, suite } = require('./lib');

/* Load a demo page while pretending to be a particular browser. */
function demo({ timelines = false, reduced = false, fine = false } = {}) {
  const observed = [];
  const r = loadPage('salon/index.html', {
    url: 'https://netloom.in/salon/index.html',
    inline: { '<script src="../demo.js"></script>': 'demo.js' },
    stub(w) {
      w.CSS = Object.assign(w.CSS || {}, {
        supports: (q) => timelines && /animation-timeline/.test(q)
      });
      w.matchMedia = (q) => ({
        matches: /prefers-reduced-motion: reduce/.test(q) ? reduced
               : /pointer: fine/.test(q) ? fine
               : false,
        addEventListener() {}, removeEventListener() {},
        addListener() {}, removeListener() {}
      });
      w.IntersectionObserver = class {
        observe(el) { observed.push(el); }
        unobserve() {} disconnect() {}
      };
    }
  });
  return Object.assign(r, { observed });
}

module.exports = function run() {
  const s = suite('Track A — scroll timelines, progress bar, tilt');

  /* 1. Legacy browser: nothing changes. This is 100% of the behaviour that
        was shipping before Track A, and it has to be untouched. */
  let r = demo({ timelines: false });
  s.check(r.observed.length > 0, 'no timeline support: reveals still observed in JS');
  s.check(!r.document.querySelector('.ntl-progress'), 'no timeline support: no progress bar');
  s.check(r.errors.length === 0, 'no timeline support: page ran clean');

  /* 2. Modern browser: CSS takes the reveals, JS must let go of them. Both
        driving opacity on the same element is the way this breaks. */
  r = demo({ timelines: true });
  s.check(r.observed.length === 0, 'timelines: JS hands reveals to CSS (observer unused)');
  s.check(!!r.document.querySelector('.ntl-progress'), 'timelines: progress bar created');
  s.check(r.document.querySelector('.ntl-progress').getAttribute('aria-hidden') === 'true',
          'timelines: progress bar hidden from assistive tech');
  s.check(r.errors.length === 0, 'timelines: page ran clean');

  /* 3. Reduced motion outranks capability. */
  r = demo({ timelines: true, reduced: true, fine: true });
  s.check(r.observed.length > 0, 'reduced motion: JS keeps the plain reveal');
  s.check(!r.document.querySelector('.ntl-progress'), 'reduced motion: no progress bar');
  s.check(!r.document.documentElement.classList.contains('tilt'), 'reduced motion: no tilt');

  /* 4. Tilt needs a real pointer, and must not appear on touch. */
  r = demo({ fine: true });
  s.check(r.document.documentElement.classList.contains('tilt'), 'fine pointer: tilt enabled');
  r = demo({ fine: false });
  s.check(!r.document.documentElement.classList.contains('tilt'), 'coarse pointer: tilt not enabled');

  /* 5. The CSS invariant.
        Inside the @supports branch the base state of .reveal must be VISIBLE,
        with the animation driving 0 -> 1. Inverting this looks identical in
        every supporting browser and blanks 1,607 elements in any browser
        where the timeline fails to resolve. It is the one line in Track A
        that cannot be checked by looking at a working page. */
  const css = fs.readFileSync(path.join(ROOT, 'demo.css'), 'utf8');
  const branch = css.slice(css.indexOf('@supports (animation-timeline: view())'));
  const revealRule = branch.slice(branch.indexOf('.reveal {'), branch.indexOf('.reveal[data-d="1"]'));
  s.check(/opacity:\s*1/.test(revealRule), 'CSS: .reveal base state is visible, not hidden');
  s.check(/animation-timeline:\s*view\(\)/.test(revealRule), 'CSS: .reveal is on a view() timeline');
  s.check(/@keyframes ntlReveal[\s\S]*?from\s*{\s*opacity:\s*0/.test(css),
          'CSS: the animation is what hides it, from a visible base');

  /* 5b. Every .reveal range must both start AND end inside the entry phase.
        A range ending in the cover phase can be unreachable: a short element
        near the end of a document stops scrolling before the animation
        finishes, so it sits at partial opacity forever — on exactly the
        pages nobody scrolls to the bottom of while checking. Entry progress
        always reaches 100%. This asserts the rule, not the numbers, so the
        timings stay free to be tuned.
        Scoped to .reveal rules: the hero drift legitimately runs across the
        exit phase, because a stuck transform is harmless. */
  const revealRanges = (branch.match(/\.reveal[^{]*\{[^}]*\}/g) || [])
    .map(rule => (rule.match(/animation-range:\s*([^;}]+)/) || [])[1])
    .filter(Boolean)
    .map(v => v.trim());
  s.check(revealRanges.length >= 6, 'CSS: reveal ranges found (' + revealRanges.length + ')');
  const badPhase = revealRanges.filter(r => !/^entry [\d.]+% entry [\d.]+%$/.test(r));
  s.check(badPhase.length === 0,
          'CSS: every reveal range starts and ends in the entry phase' +
          (badPhase.length ? ' — offending: ' + badPhase.join(' | ') : ''));
  const over = revealRanges.filter(r => (r.match(/([\d.]+)%/g) || [])
                                          .some(v => parseFloat(v) > 100));
  s.check(over.length === 0, 'CSS: no reveal range ends beyond entry 100%');

  /* 6. Reduced motion has to be switched off by name. The global block up the
        file clamps animation-duration, which does nothing at all to a
        progress-based timeline — the easiest thing here to get wrong. */
  const reduceBlocks = css.slice(css.indexOf('TRACK A'));
  s.check(/@media \(prefers-reduced-motion: reduce\)[\s\S]*animation-timeline:\s*auto/.test(reduceBlocks),
          'CSS: reduced motion resets animation-timeline explicitly');


  /* 7. One page per category, run as a modern browser.
        demo.css and demo.js are shared by 80 pages, so the thing that has to
        be proved is not that Track A works somewhere — it is that it did not
        break any of the eight verticals, each of which has its own theme,
        its own hero variant and its own set of components. A page error here
        means every behaviour defined after it in demo.js is dead on that
        category, with no visible symptom beyond a control that does nothing. */
  const CATEGORIES = ['restaurant', 'healthcare', 'salon', 'boutique',
                      'yoga', 'jewellery', 'ecommerce', 'realestate'];
  CATEGORIES.forEach((cat) => {
    const observed = [];
    const r = loadPage(cat + '/index.html', {
      url: 'https://netloom.in/' + cat + '/index.html',
      inline: { '<script src="../demo.js"></script>': 'demo.js' },
      stub(w) {
        w.CSS = Object.assign(w.CSS || {}, { supports: () => true });
        w.matchMedia = (q) => ({
          matches: /pointer: fine/.test(q),
          addEventListener() {}, removeEventListener() {},
          addListener() {}, removeListener() {}
        });
        w.IntersectionObserver = class {
          observe(el) { observed.push(el); } unobserve() {} disconnect() {}
        };
      }
    });
    const ok = r.errors.length === 0
            && !!r.document.querySelector('.ntl-progress')
            && r.document.documentElement.classList.contains('tilt')
            && observed.length === 0
            && !!r.document.querySelector('.nav-logo');
    s.check(ok, cat + ': uplift applied, page ran clean' +
                (r.errors.length ? ' — ' + r.errors[0] : ''));
  });

  return Promise.resolve(s.report(r.errors));
};
