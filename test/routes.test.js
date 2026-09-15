/* Route pages carry only their own view.
   ----------------------------------------------------------------------------
   Before this, every route was the same 208 KB document with the other views
   marked `hidden`, so Google saw five near-identical pages and none of them
   read as being about one thing. Stripping the other views is only safe while
   nothing in the single inline script assumes a view it can no longer find —
   one top-level throw takes every IIFE below it down, silently. That is what
   these assertions are really guarding. */
'use strict';
const { loadPage, suite } = require('./lib');

const ROUTES = ['work', 'services', 'pricing', 'about', 'contact'];

module.exports = function run(){
  const s = suite('route pages: one view each, script still runs');
  const allErrors = [];

  // The home page is the source and keeps every view — it is the one page that
  // legitimately covers the whole site.
  {
    const { document: d, errors } = loadPage('index.html', { url: 'https://netloom.in/' });
    allErrors.push(...errors);
    s.check(d.querySelectorAll('.view').length === ROUTES.length + 1,
      'home keeps all ' + (ROUTES.length + 1) + ' views');
    const home = d.getElementById('view-home');
    s.check(home && home.classList.contains('is-active'), 'home view is the active one');
  }

  ROUTES.forEach(view => {
    const { window: w, document: d, errors } =
      loadPage(view + '/index.html', { url: 'https://netloom.in/' + view + '/' });
    allErrors.push(...errors.map(e => view + ': ' + e));

    // The canary. Both globals are defined near the very end of the inline
    // script, after the contact-form listener that used to be unguarded — so if
    // a stripped view caused a throw anywhere above, these are undefined.
    s.check(typeof w.__netloomNavigate === 'function',
      view + ': script ran to completion (__netloomNavigate defined)');
    s.check(typeof w.__netloomOpenPreview === 'function',
      view + ': script ran past the contact form (__netloomOpenPreview defined)');

    const views = d.querySelectorAll('.view');
    s.check(views.length === 1, view + ': exactly one view in the document');
    s.check(views[0] && views[0].id === 'view-' + view,
      view + ': the view present is its own');
    s.check(views[0] && views[0].classList.contains('is-active') && views[0].hidden === false,
      view + ': that view is active and visible');

    // Other routes must be gone from the DOM, not merely hidden.
    const strays = ROUTES.concat('home').filter(v => v !== view && d.getElementById('view-' + v));
    s.check(strays.length === 0,
      view + ': no other view left in the DOM' + (strays.length ? ' (found ' + strays.join(', ') + ')' : ''));

    // Canonical must name the URL GitHub Pages actually serves: /work 301s.
    const canon = d.querySelector('link[rel="canonical"]');
    s.check(canon && canon.getAttribute('href') === 'https://netloom.in/' + view + '/',
      view + ': canonical is https://netloom.in/' + view + '/');

    // Stripping views must not strip the navigation between them.
    const navLinks = d.querySelectorAll('.nav-links a[data-route]');
    s.check(navLinks.length >= ROUTES.length,
      view + ': nav still links out to the other routes');

    // The contact form only exists where the contact view does.
    const form = d.getElementById('contactForm');
    s.check(view === 'contact' ? !!form : !form,
      view + ': contact form present only on /contact/');
  });

  return s.report(allErrors);
};
