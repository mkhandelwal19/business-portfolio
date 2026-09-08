/* Light / dark on the demo sites.
   ----------------------------------------------------------------------------
   Two failure modes are worth a test here and neither is visual.

   The first is the one this whole suite exists for: the control is injected by
   demo.js, so "the CSS is present and the file parses" is entirely compatible
   with "there is no button". __netloomSetTheme is asserted for the same reason
   __netloomOpenPreview is on the main site.

   The second is slower and worse. demo.css is shared by 36 pages, and the
   light palette only holds while accent-as-text goes through --accent-ink and
   accent-fill foregrounds go through --on-accent. One `color:var(--accent)`
   added by a later edit is invisible in dark and unreadable on paper, and
   nobody would find it without opening every page in light. The CSS
   assertions below are the guard for that. */
'use strict';
const fs   = require('fs');
const path = require('path');
const { ROOT, loadPage, suite } = require('./lib');

const CATEGORIES = ['restaurant', 'healthcare', 'salon', 'yoga'];

function demo(query, opts = {}) {
  return loadPage((opts.page || 'salon/index.html'), {
    url: 'https://netloom.in/' + (opts.page || 'salon/index.html') + (query || ''),
    inline: { '<script src="../demo.js"></script>': 'demo.js' }
  });
}

module.exports = function run() {
  const s = suite('Theme — light / dark across the demo sites');

  /* ---- 1. The pre-paint script is in every page's head ---- */
  let pages = 0, missing = [], afterStyles = [];
  for (const c of CATEGORIES) {
    for (const f of fs.readdirSync(path.join(ROOT, c)).filter(n => n.endsWith('.html'))) {
      pages++;
      const html = fs.readFileSync(path.join(ROOT, c, f), 'utf8');
      const head = html.slice(0, html.indexOf('</head>'));
      if (!head.includes('ntl-demo-theme')) missing.push(c + '/' + f);
      // It has to run before the body renders, which is the only reason it is
      // in the markup at all rather than in demo.js.
      if (html.indexOf('ntl-demo-theme') > html.indexOf('<body')) afterStyles.push(c + '/' + f);
    }
  }
  s.check(pages === 36, 'found all 36 demo pages (found ' + pages + ')');
  s.check(missing.length === 0, 'every demo page has the pre-paint theme script' +
          (missing.length ? ' — missing: ' + missing.join(', ') : ''));
  s.check(afterStyles.length === 0, 'pre-paint script runs before <body>' +
          (afterStyles.length ? ' — late in: ' + afterStyles.join(', ') : ''));

  /* ---- 2. Default is dark, and the control exists ---- */
  let r = demo();
  s.check(r.document.documentElement.getAttribute('data-theme') === 'dark',
          'no stored choice: page defaults to dark');
  const ctrl = r.document.querySelector('.preview-bar .pb-theme');
  s.check(!!ctrl, 'theme control injected into the preview bar');
  const btns = ctrl ? ctrl.querySelectorAll('.pb-theme-btn') : [];
  s.check(btns.length === 2, 'control offers both registers, not a single toggle');
  s.check(!!(ctrl && ctrl.getAttribute('aria-label')), 'control group is labelled');
  s.check(typeof r.window.__netloomSetTheme === 'function',
          '__netloomSetTheme defined (the module did not die silently)');
  s.check(r.errors.length === 0, 'default load ran clean');

  /* The control sits before the industry switcher, not after the CTA, so the
     bar keeps its reading order. */
  const bar = r.document.querySelector('.preview-bar');
  if (bar) {
    const kids = [...bar.children];
    s.check(kids.indexOf(r.document.getElementById('pbSwitch')) > kids.indexOf(ctrl),
            'control is placed left of the industry switcher');
  }

  /* ---- 3. Clicking light applies and remembers it ---- */
  const lightBtn = [...btns].find(b => b.getAttribute('data-set-theme') === 'light');
  s.check(!!lightBtn, 'a light button exists');
  if (lightBtn) {
    lightBtn.dispatchEvent(new r.window.MouseEvent('click', { bubbles: true }));
    s.check(r.document.documentElement.getAttribute('data-theme') === 'light',
            'clicking light sets data-theme="light"');
    s.check(r.window.localStorage.getItem('ntl-demo-theme') === 'light',
            'the choice is remembered for the next page');
    s.check(lightBtn.getAttribute('aria-pressed') === 'true',
            'the pressed state follows the choice');
    const darkBtn = [...btns].find(b => b.getAttribute('data-set-theme') === 'dark');
    s.check(darkBtn && darkBtn.getAttribute('aria-pressed') === 'false',
            'the other button un-presses');
  }

  /* ---- 4. ?theme=light is a shareable link, and it sticks ---- */
  r = demo('?theme=light');
  s.check(r.document.documentElement.getAttribute('data-theme') === 'light',
          '?theme=light opens in light');
  s.check(r.window.localStorage.getItem('ntl-demo-theme') === 'light',
          '?theme=light survives the first click through to page two');
  s.check(r.errors.length === 0, '?theme=light ran clean');

  r = demo('?theme=banana');
  s.check(r.document.documentElement.getAttribute('data-theme') === 'dark',
          'an unknown ?theme= falls back to dark rather than an empty palette');

  /* ---- 5. The homepage preview iframe keeps its own counsel ---- */
  r = demo('?embed=1&theme=light');
  s.check(r.document.documentElement.getAttribute('data-theme') === 'light',
          'embed honours an explicit ?theme=');
  s.check(r.window.localStorage.getItem('ntl-demo-theme') === null,
          'embed does not write its choice into the visitor stored preference');
  s.check(!r.document.querySelector('.pb-theme'),
          'embed shows no control (the preview bar is removed)');
  s.check(r.errors.length === 0, 'embed ran clean');

  /* ---- 6. The CSS contract ---- */
  const css = fs.readFileSync(path.join(ROOT, 'demo.css'), 'utf8');
  s.check(/:root\[data-theme="light"\]\s*\{/.test(css), 'a light palette block exists');
  s.check(/--accent-ink:/.test(css) && /--on-accent:/.test(css),
          '--accent-ink and --on-accent are defined');

  const themes = ['ember', 'mint', 'plum', 'pearl', 'sage', 'gold', 'saffron', 'cocoa'];
  const noInk = themes.filter(t =>
    !new RegExp(':root\\[data-theme="light"\\] \\.theme-' + t + '\\b').test(css));
  s.check(noInk.length === 0,
          'every category has a light-mode ink' + (noInk.length ? ' — missing: ' + noInk.join(', ') : ''));

  /* The two regressions that are invisible until someone opens a demo in
     light. `border-color` and `accent-color` both end in "color" and are
     legitimate, hence the boundary. */
  const rawAccentText = (css.match(/(^|[^-\w])color:\s*var\(--accent\)/g) || []);
  s.check(rawAccentText.length === 0,
          'no accent-as-text left un-tokenised (found ' + rawAccentText.length + ')');
  const rawBgText = (css.match(/(^|[^-\w])color:\s*var\(--bg\)/g) || []);
  s.check(rawBgText.length === 0,
          'no --bg used as a foreground (found ' + rawBgText.length + ')');

  s.check(/html\.ntl-theming/.test(css),
          'transitions are suppressed while the palette swaps');
  s.check(/color-scheme:\s*dark/.test(css) && /color-scheme:\s*light/.test(css),
          'color-scheme is declared for both, so native controls follow');

  return s.report();
};
