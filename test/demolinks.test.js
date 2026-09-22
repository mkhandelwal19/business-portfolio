/* Every demo link opens a demo that exists, from every page that carries it.
   ----------------------------------------------------------------------------
   Two separate failures, both invisible to every other suite and to the build:

   1. The work grid spent months pointing at projects/*.html — the April-era
      one-page explainers — instead of the templates it advertised. The links
      resolved, the pages rendered, nothing was broken; the site simply showed
      a prospect the wrong product.

   2. A folder missing from RELATIVE_PREFIXES in build-routes.js is a 404 from
      every route page but the home page. /work/ is exactly where these links
      are clicked, and "commerce/index.html" there resolves to
      /work/commerce/index.html. The build prints a tick either way.

   So: resolve every data-demo href against the URL its page is really served
   at, and require the file to be on disk. */
'use strict';
const fs   = require('fs');
const path = require('path');
const { loadPage, suite } = require('./lib');

const ROOT = path.resolve(__dirname, '..');
const PAGES = [
  ['index.html',        'https://netloom.in/'],
  ['work/index.html',   'https://netloom.in/work/'],
  ['about/index.html',  'https://netloom.in/about/'],
  ['services/index.html', 'https://netloom.in/services/'],
  ['pricing/index.html',  'https://netloom.in/pricing/'],
  ['contact/index.html',  'https://netloom.in/contact/'],
];

/* The explainer pages are legitimate content — the vertical pages link to them
   as "How it is built" — but they are not the product, so the grid that says
   "Preview Template" must not open one. */
const NOT_A_TEMPLATE = /^\/?projects\//;

module.exports = function run(){
  const s = suite('demo links: every data-demo resolves to a file that exists');
  const allErrors = [];

  PAGES.forEach(([rel, url]) => {
    if (!fs.existsSync(path.join(ROOT, rel))) return;
    const { document: d, errors } = loadPage(rel, { url });
    allErrors.push(...errors.map(e => rel + ': ' + e));

    const links = [...d.querySelectorAll('a[data-demo]')];
    s.check(links.length > 0, rel + ': carries demo links at all');

    const missing = [];
    links.forEach(a => {
      const href = a.getAttribute('data-demo').split('?')[0];
      // Resolve exactly as the browser would from this page's real URL.
      const resolved = new URL(href, url).pathname.replace(/^\//, '');
      if (!fs.existsSync(path.join(ROOT, resolved))) missing.push(href + ' -> /' + resolved);
    });
    s.check(missing.length === 0,
      rel + ': all ' + links.length + ' demo links resolve to a real file' +
      (missing.length ? ' (broken: ' + missing.join(', ') + ')' : ''));

    const grid = [...d.querySelectorAll('#workGrid a[data-demo]')];
    if (grid.length){
      const explainers = grid
        .map(a => a.getAttribute('data-demo'))
        .filter(h => NOT_A_TEMPLATE.test(h));
      s.check(explainers.length === 0,
        rel + ': the work grid opens templates, not explainer pages' +
        (explainers.length ? ' (found ' + explainers.join(', ') + ')' : ''));
      s.check(grid.length === 8, rel + ': all 8 categories are in the grid');
    }
  });

  return s.report(allErrors);
};
