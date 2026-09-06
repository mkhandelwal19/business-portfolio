/* Shared harness for the DOM tests.
   ----------------------------------------------------------------------------
   These exist because "the markup is present and the script parses" turned out
   to be compatible with "the button does nothing" — the hero Preview button
   shipped dead twice before this suite caught it. Everything here drives the
   real index.html the way a visitor would, rather than inspecting source. */
'use strict';

const fs   = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = path.resolve(__dirname, '..');

/* Load a page from the repo and run its scripts.
   `inline` substitutes a <script src> for its file contents, because jsdom is
   deliberately not given network or file access. */
function loadPage(relPath, { url, inline, stub } = {}) {
  let html = fs.readFileSync(path.join(ROOT, relPath), 'utf8');

  if (inline) {
    for (const [tag, file] of Object.entries(inline)) {
      const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
      if (!html.includes(tag)) throw new Error('inline target not found: ' + tag);
      html = html.replace(tag, '<script>' + src + '<\/script>');
    }
  }

  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => errors.push('jsdomError: ' + (e.message || e)));
  vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')));

  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: url || 'https://netloom.in/',
    virtualConsole: vc,
    beforeParse(w) {
      // jsdom has no layout or WebGL; stub what the page reaches for so a
      // missing API does not masquerade as a real failure.
      w.IntersectionObserver = class {
        observe() {} unobserve() {} disconnect() {}
      };
      w.matchMedia = () => ({
        matches: false,
        addEventListener() {}, removeEventListener() {},
        addListener() {}, removeListener() {}
      });
      w.scrollTo = () => {};
      w.HTMLCanvasElement.prototype.getContext = () => null;
      // Per-suite override, so a test can present the page with a different
      // set of browser capabilities than the defaults above.
      if (stub) stub(w);
    }
  });

  return { dom, window: dom.window, document: dom.window.document, errors };
}

/* A suite collects assertions and reports once, so one failure does not hide
   the rest. */
function suite(name) {
  const lines = [];
  let failed = 0;

  return {
    name,
    check(cond, msg) {
      if (!cond) failed++;
      lines.push((cond ? '    pass  ' : '    FAIL  ') + msg);
      return !!cond;
    },
    report(extraErrors = []) {
      extraErrors.forEach(e => { failed++; lines.push('    FAIL  page error: ' + e); });
      console.log('  ' + name);
      console.log(lines.join('\n'));
      return failed === 0;
    }
  };
}

module.exports = { ROOT, loadPage, suite };
