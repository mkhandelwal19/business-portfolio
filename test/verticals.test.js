/* The industry landing pages.
   ----------------------------------------------------------------------------
   Eight pages that differ by trade are one bad refactor away from being eight
   pages that differ by noun, which Google's spam policy names as doorway pages
   and penalises. The uniqueness assertions at the bottom are the real point of
   this suite: they fail the moment the pages stop saying different things.

   The rest guards the plumbing - that each page is in the sitemap, linked from
   the footer rather than orphaned, and carries valid schema. */
'use strict';
const fs   = require('fs');
const path = require('path');
const { loadPage, suite, ROOT } = require('./lib');
const { VERTICALS } = require('../build-verticals');
const { GUIDES }    = require('../build-guides');

/* Enough prose that the page says something. Tuned under what the thinnest
   page currently carries, so ordinary editing does not trip it, but well above
   what a swapped-noun template would produce. */
const MIN_WORDS = 450;

function visibleWords (html) {
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  return body.split(/\s+/).filter(Boolean).length;
}

module.exports = function run(){
  const s = suite('industry landing pages');
  const allErrors = [];

  const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  const home    = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

  s.check(VERTICALS.length === 8, 'eight industry pages defined');

  const titles = new Set(), h1s = new Set(), descs = new Set(), insights = new Set();

  VERTICALS.forEach(v => {
    const rel  = path.join(v.slug, 'index.html');
    const file = path.join(ROOT, rel);

    if (!fs.existsSync(file)) {
      s.check(false, v.slug + ': page generated');
      return;
    }

    const raw = fs.readFileSync(file, 'utf8');
    const { document: d, errors } = loadPage(rel, { url: 'https://netloom.in/' + v.slug + '/' });
    allErrors.push(...errors.map(e => v.slug + ': ' + e));

    // ── head ──
    const canon = d.querySelector('link[rel="canonical"]');
    s.check(canon && canon.getAttribute('href') === 'https://netloom.in/' + v.slug + '/',
      v.slug + ': canonical is its own URL');

    const desc = d.querySelector('meta[name="description"]');
    const descTxt = desc && desc.getAttribute('content');
    s.check(descTxt && descTxt.length >= 70 && descTxt.length <= 200,
      v.slug + ': description is a usable length');

    const robots = d.querySelector('meta[name="robots"]');
    const robotsTxt = robots && robots.getAttribute('content') || '';
    s.check(/index/.test(robotsTxt) && !/noindex/.test(robotsTxt),
      v.slug + ': indexable');

    // ── structure ──
    const hs = d.querySelectorAll('h1');
    s.check(hs.length === 1, v.slug + ': exactly one h1');

    s.check(visibleWords(raw) >= MIN_WORDS,
      v.slug + ': carries real content (>= ' + MIN_WORDS + ' words)');

    // ── schema ──
    const lds = [...d.querySelectorAll('script[type="application/ld+json"]')];
    let types = [];
    let parsed = true;
    lds.forEach(el => {
      try { types.push(JSON.parse(el.textContent)['@type']); }
      catch (e) { parsed = false; }
    });
    s.check(parsed, v.slug + ': all JSON-LD parses');
    s.check(types.includes('Service') && types.includes('FAQPage'),
      v.slug + ': carries Service and FAQPage schema');

    // ── discoverability ──
    s.check(sitemap.includes('https://netloom.in/' + v.slug + '/'),
      v.slug + ': listed in sitemap.xml');
    s.check(home.includes('href="/' + v.slug + '/"'),
      v.slug + ': linked from the footer, not orphaned');

    // ── links out ──
    s.check(d.querySelector('a[href="/contact/"]'), v.slug + ': links to contact');
    v.demos.forEach(dm => {
      s.check(d.querySelector('a[href="' + dm.href + '"]'),
        v.slug + ': links to ' + dm.href);
    });

    titles.add(d.title);
    h1s.add(hs[0] && hs[0].textContent.trim());
    descs.add(descTxt);
    insights.add(v.insight.h);
  });

  // ── the guides ──
  GUIDES.forEach(g => {
    const rel  = path.join(g.slug, 'index.html');
    const file = path.join(ROOT, rel);
    if (!fs.existsSync(file)) { s.check(false, g.slug + ': generated'); return; }

    const raw = fs.readFileSync(file, 'utf8');
    const { document: d, errors } = loadPage(rel, { url: 'https://netloom.in/' + g.slug + '/' });
    allErrors.push(...errors.map(e => g.slug + ': ' + e));

    const canon = d.querySelector('link[rel="canonical"]');
    s.check(canon && canon.getAttribute('href') === 'https://netloom.in/' + g.slug + '/',
      g.slug + ': canonical is its own URL');
    s.check(d.querySelectorAll('h1').length === 1, g.slug + ': exactly one h1');

    // A guide earns its ranking by being long enough to actually answer the
    // question. Thin "cost" pages are a dime a dozen and rank accordingly.
    s.check(visibleWords(raw) >= 900, g.slug + ': long enough to be useful (>= 900 words)');

    let types = [];
    [...d.querySelectorAll('script[type="application/ld+json"]')].forEach(el => {
      try { types.push(JSON.parse(el.textContent)['@type']); } catch (e) { types.push('BROKEN'); }
    });
    s.check(types.includes('Article') && types.includes('FAQPage'),
      g.slug + ': carries Article and FAQPage schema');

    s.check(sitemap.includes('https://netloom.in/' + g.slug + '/'), g.slug + ': in sitemap.xml');
    s.check(home.includes('href="/' + g.slug + '/"'), g.slug + ': linked from the footer');

    // Every price on the page must match the three published tiers, or the
    // site contradicts itself - which it has done before.
    ['14,999', '24,999', '44,999'].forEach(v => {
      s.check(raw.includes(v), g.slug + ': quotes the real tier price ' + v);
    });

    // A cell holding one character means a row shape was indexed as a string:
    // r[1][0] on '<rupee>800 ...' is '<rupee>', which is how a cost table once
    // rendered the currency symbol above the digit that followed it.
    const cells = [...d.querySelectorAll('td')];
    const stunted = cells.filter(td => td.textContent.trim().length === 1);
    s.check(stunted.length === 0,
      g.slug + ': no table cell collapsed to a single character'
      + (stunted.length ? ' (found ' + stunted.length + ')' : ''));

    // And every row must have as many cells as its own header declares -
    // counted per table, since the page carries more than one.
    const tables = [...d.querySelectorAll('table')];
    let ragged = 0;
    tables.forEach(tbl => {
      const headCount = tbl.querySelectorAll('thead th').length;
      tbl.querySelectorAll('tbody tr').forEach(tr => {
        if (tr.children.length !== headCount) ragged++;
      });
    });
    s.check(tables.length > 0 && ragged === 0,
      g.slug + ': every row matches its table header column count'
      + (ragged ? ' (' + ragged + ' ragged)' : ''));
  });

  // ── the stylesheet actually defines its tokens ──
  // A "star-slash" inside the opening comment (a glob like /website-design-for-
  // followed by star-slash) closes it early; CSS error recovery then eats the
  // whole :root block and every colour silently becomes undefined, while fonts
  // and layout keep working. It looked like a theme bug. It cost a build.
  {
    const css = fs.readFileSync(path.join(ROOT, 'vertical.css'), 'utf8');
    const afterFirstComment = css.slice(css.indexOf('*/') + 2);
    s.check(/:root\s*\{/.test(afterFirstComment),
      'vertical.css: :root survives the opening comment');
    s.check(/--bg\s*:/.test(afterFirstComment) && /--gold\s*:/.test(afterFirstComment),
      'vertical.css: colour tokens are defined, not swallowed');
  }

  // ── the doorway-page guard ──
  // Eight pages that share a headline are eight pages Google treats as one.
  s.check(titles.size === VERTICALS.length, 'every page has a distinct <title>');
  s.check(h1s.size === VERTICALS.length, 'every page has a distinct h1');
  s.check(descs.size === VERTICALS.length, 'every page has a distinct meta description');
  s.check(insights.size === VERTICALS.length, 'every page makes a distinct central claim');

  return s.report(allErrors);
};
