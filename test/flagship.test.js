/* flagship/3d-core.js, and the three flagships built on it.
   ----------------------------------------------------------------------------
   The 3D used to live inline in jewellery-lux. It was lifted out so a second
   and third flagship cannot quietly drift from it — but an extraction is
   exactly the kind of change that looks right and runs wrong: the page still
   parses, the markup is untouched, and the only symptom is a canvas that never
   fills.

   jsdom has no WebGL, so none of this renders. What it can prove is that the
   wiring holds — the core loads before the pages that need it, no page carries
   its own copy of what moved, every page's script runs to completion, and a
   gated visitor is left looking at the SVG rather than a hole. */
'use strict';
const fs = require('fs');
const path = require('path');
const { ROOT, loadPage, suite } = require('./lib');

const FLAGSHIPS = [
  { dir: 'jewellery-lux',  canvases: ['gemCanvas'],                  fallbacks: ['heroFallback'] },
  { dir: 'realestate-lux', canvases: ['towerCanvas', 'planCanvas'],  fallbacks: ['towerFallback', 'planFallback'] },
  { dir: 'boutique-lux',   canvases: ['drapeCanvas', 'loomCanvas'],  fallbacks: ['drapeFallback', 'loomFallback'] }
];

/* Anything that moved into the core must not be redefined in a page. */
const MOVED = ['function studioEnv(', 'function makeStage(', 'function frame(',
               'function mergeGeoms(', 'function clearGroup('];

module.exports = function run() {
  const s = suite('flagship 3d-core + the three flagships');

  /* ── the core ── */
  const corePath = path.join(ROOT, 'flagship', '3d-core.js');
  s.check(fs.existsSync(corePath), 'flagship/3d-core.js exists');
  const core = fs.readFileSync(corePath, 'utf8');

  let api = null;
  try {
    const win = {};
    new Function('window', 'navigator', 'document', 'console', core)
      (win, {}, { createElement: () => ({ getContext: () => null }) }, console);
    api = win.Netloom3D;
    s.check(!!api, 'core evaluates with no DOM and defines window.Netloom3D');
  } catch (e) {
    s.check(false, 'core evaluates without throwing — ' + e.message);
  }

  const EXPECTED = ['boot', 'shouldLoad', 'webglOK', 'reducedMotion', 'studioEnv',
                    'makeStage', 'frame', 'clearGroup', 'mergeGeoms', 'brilliant',
                    'metalMaterial'];
  if (api) {
    const missing = EXPECTED.filter(k => typeof api[k] !== 'function');
    s.check(missing.length === 0,
      'core exposes the whole API' + (missing.length ? ' — missing ' + missing.join(', ') : ''));
    s.check(api.shouldLoad() === false, 'gate declines where there is no WebGL');
    let outcome = null;
    api.boot(() => { outcome = 'READY'; }, (why) => { outcome = why; });
    s.check(outcome === 'gated', 'boot() calls onSkip("gated") and never onReady when gated');
  }

  /* three.js pinning is a lesson already paid for: 0.147.0 is the last clean
     UMD build on cdnjs. r150+ warns and r160 dropped UMD entirely, so an
     unpinned URL breaks all three flagships at once, in production, with no
     local symptom. */
  s.check(/three\.js\/0\.147\.0\/three\.min\.js/.test(core),
    'three.js is pinned to the 0.147.0 UMD build');
  const pinnedInPages = FLAGSHIPS.filter(f =>
    /three\.js\/0\.147\.0/.test(fs.readFileSync(path.join(ROOT, f.dir, 'index.html'), 'utf8')));
  s.check(pinnedInPages.length === 0,
    'no flagship hard-codes the three.js URL itself' +
    (pinnedInPages.length ? ' — ' + pinnedInPages.map(f => f.dir).join(', ') : ''));

  /* ── each flagship ── */
  FLAGSHIPS.forEach(f => {
    const rel = f.dir + '/index.html';
    const full = path.join(ROOT, rel);
    s.check(fs.existsSync(full), f.dir + ': page exists');
    if (!fs.existsSync(full)) return;

    const html = fs.readFileSync(full, 'utf8');
    const coreTag = html.indexOf('flagship/3d-core.js');
    const firstInline = html.indexOf('<script>');
    s.check(coreTag !== -1 && coreTag < firstInline,
      f.dir + ': loads the core before the inline script that calls it');
    s.check(html.includes('Netloom3D.boot('), f.dir + ': delegates the load gate to the core');

    const dupes = MOVED.filter(sig => html.includes(sig));
    s.check(dupes.length === 0,
      f.dir + ': carries no private copy of the core' + (dupes.length ? ' — ' + dupes.join(', ') : ''));

    /* Run it. A single top-level throw silently kills every IIFE after it, and
       the only symptom is a control that does nothing — this repo has shipped
       exactly that twice. */
    const r = loadPage(rel, {
      url: 'https://netloom.in/' + rel,
      inline: { '<script src="../flagship/3d-core.js"></script>': 'flagship/3d-core.js' }
    });
    s.check(r.errors.length === 0,
      f.dir + ': page ran clean' + (r.errors.length ? ' — ' + r.errors[0] : ''));
    s.check(!!r.window.Netloom3D, f.dir + ': core is live on the page');

    /* The fallback contract. makeStage() is what un-hides a canvas, so a
       canvas that lost its `hidden` attribute in a headless run would mean the
       renderer started somewhere it cannot draw. */
    f.canvases.forEach(id => {
      const c = r.document.getElementById(id);
      s.check(c && c.hasAttribute('hidden'),
        `${f.dir}: #${id} stays hidden when gated`);
    });
    f.fallbacks.forEach(id => {
      const el = r.document.getElementById(id);
      s.check(el && el.style.display !== 'none',
        `${f.dir}: #${id} is what a gated visitor is left looking at`);
    });

    // Same preview-bar contract as every other demo on the site.
    s.check(!!r.document.querySelector('.preview-bar'), f.dir + ': carries the Netloom preview bar');
    s.check(/noindex/.test(html), f.dir + ': is noindex — it depicts a fictional business');
  });

  /* ── the interactive parts of the two new flagships ── */
  const re = loadPage('realestate-lux/index.html', {
    url: 'https://netloom.in/realestate-lux/index.html',
    inline: { '<script src="../flagship/3d-core.js"></script>': 'flagship/3d-core.js' }
  });
  const rd = re.document;
  s.check(rd.querySelectorAll('.unit').length === 3, 'realestate-lux: three layouts offered');
  s.check(rd.querySelectorAll('.floor-pip').length === 14, 'realestate-lux: fourteen floors offered');
  s.check(rd.querySelectorAll('.floor-pip.sold').length > 0, 'realestate-lux: some floors are marked sold');
  const svgBefore = rd.querySelectorAll('#planSvg rect').length;
  rd.querySelectorAll('.unit')[2].click();
  s.check(rd.getElementById('sArea').textContent === '2,450',
    'realestate-lux: picking the penthouse updates the spec row');
  s.check(rd.querySelectorAll('#planSvg rect').length !== svgBefore,
    'realestate-lux: the SVG fallback plan is redrawn per layout, from the same room data as the 3D');

  const bo = loadPage('boutique-lux/index.html', {
    url: 'https://netloom.in/boutique-lux/index.html',
    inline: { '<script src="../flagship/3d-core.js"></script>': 'flagship/3d-core.js' }
  });
  const bd = bo.document;
  s.check(bd.querySelectorAll('.swatch').length === 5, 'boutique-lux: five weaves offered');
  s.check(bd.querySelectorAll('#bWeave option').length === 5,
    'boutique-lux: the enquiry dropdown is built from the same weave list');
  s.check(bd.querySelectorAll('#loomSvg rect').length === 5,
    'boutique-lux: the fallback swatch board covers every weave');
  bd.querySelectorAll('.swatch')[2].click();
  s.check(bd.getElementById('loomBadge').textContent === 'Baluchari',
    'boutique-lux: picking a weave updates the badge');
  s.check(bd.getElementById('bWeave').selectedIndex === 2,
    'boutique-lux: the enquiry dropdown follows the chosen weave');

  return Promise.resolve(s.report());
};
