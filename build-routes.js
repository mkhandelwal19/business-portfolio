#!/usr/bin/env node
/* build-routes.js — regenerate /work, /about, /services, /pricing, /contact
   from index.html.

   Every route is the same single-page app; the only differences are the head
   meta, which .view starts active, and root-relative asset paths (a page served
   from /about/ cannot resolve "projects/x.html"). Hand-syncing six copies of a
   180 KB file is how they drift, so they are generated instead.

   Run after every edit to index.html:  node build-routes.js
*/
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT  = __dirname;
const SRC   = path.join(ROOT, 'index.html');

const ROUTES = [
  {
    view: 'work',
    title: 'Work — Netloom',
    desc: 'Eight industry website templates you can open and test right now — restaurants, clinics, salons, boutiques, yoga, jewellery, online stores and real estate.'
  },
  {
    view: 'about',
    title: 'About — Netloom',
    desc: 'Netloom is Mayank Khandelwal’s studio in Kolkata, building websites for Indian local businesses. No payment until you have seen your homepage.'
  },
  {
    view: 'services',
    title: 'Services — Netloom',
    desc: 'Website design, e-commerce, Google Business Profile and ongoing care for Indian local businesses. See how I work and what it costs.'
  },
  {
    view: 'pricing',
    title: 'Pricing — Netloom',
    desc: 'Honest, fixed pricing: Starter ₹12,999, Business ₹24,999, Premium ₹44,999. No hidden charges, and a full refund if the design is not right.'
  },
  {
    view: 'contact',
    title: 'Contact — Netloom',
    desc: 'Tell me about your shop and I will reply within a few hours. WhatsApp is fastest.'
  }
];

const HOME_TITLE = 'Netloom — Websites for Indian Small Businesses';

/* Relative hrefs that resolve from / but break from /about/ etc.
   GitHub Pages 301-redirects /about to /about/, so a route page is genuinely
   served from a subdirectory and "restaurant/index.html" there would resolve to
   /about/restaurant/index.html. Every relative link the SPA markup carries has
   to be listed here. */
const RELATIVE_PREFIXES = [
  'projects/', 'jewellery-lux/',
  'restaurant/', 'healthcare/', 'salon/', 'boutique/',
  'yoga/', 'jewellery/', 'ecommerce/', 'realestate/'
];

function escapeAttr (s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function buildRoute (src, route) {
  let out = src;
  const title = escapeAttr(route.title);
  const desc  = escapeAttr(route.desc);
  const url   = 'https://netloom.in/' + route.view;

  // ── Head meta ──
  out = out.replace(
    /<title>[^<]*<\/title>/,
    `<title>${route.title}</title>`
  );
  out = out.replace(
    /<meta name="description" content="[^"]*" \/>/,
    `<meta name="description" content="${desc}" />`
  );
  out = out.replace(
    /<meta property="og:title" content="[^"]*" \/>/,
    `<meta property="og:title" content="${title}" />`
  );
  out = out.replace(
    /<meta name="twitter:title" content="[^"]*" \/>/,
    `<meta name="twitter:title" content="${title}" />`
  );
  out = out.replace(
    /<link rel="canonical" href="https:\/\/netloom\.in\/" \/>/,
    `<link rel="canonical" href="${url}" />`
  );
  out = out.replace(
    /<meta property="og:url" content="https:\/\/netloom\.in\/" \/>/,
    `<meta property="og:url" content="${url}" />`
  );

  // ── Which view starts active ──
  out = out.replace(
    '<div class="view is-active" id="view-home" data-view="home" role="region" aria-label="Home">',
    '<div class="view" id="view-home" data-view="home" role="region" aria-label="Home" hidden>'
  );
  const label = route.view.charAt(0).toUpperCase() + route.view.slice(1);
  const from  = `<div class="view" id="view-${route.view}" data-view="${route.view}" role="region" aria-label="${label}" hidden>`;
  const to    = `<div class="view is-active" id="view-${route.view}" data-view="${route.view}" role="region" aria-label="${label}">`;
  if (!out.includes(from)) {
    throw new Error(`Could not find the view wrapper for "${route.view}". Did the markup change?`);
  }
  out = out.replace(from, to);

  // ── Root-relative asset paths ──
  // Served from /about/, a bare "projects/x.html" would resolve to
  // /about/projects/x.html. Anchor those to the site root.
  // data-demo is the base the hero preview writes back into href, so it needs
  // the same anchoring or the personalised links break on the route pages.
  RELATIVE_PREFIXES.forEach(prefix => {
    ['href', 'src', 'data-demo'].forEach(attr => {
      out = out.split(`${attr}="${prefix}`).join(`${attr}="/${prefix}`);
    });
  });

  return out;
}

function main () {
  if (!fs.existsSync(SRC)) {
    console.error('index.html not found at ' + SRC);
    process.exit(1);
  }
  const src = fs.readFileSync(SRC, 'utf8');

  if (!src.includes(`<title>${HOME_TITLE}</title>`)) {
    console.error('index.html title has changed — update HOME_TITLE in build-routes.js.');
    process.exit(1);
  }

  let written = 0;
  ROUTES.forEach(route => {
    const dir  = path.join(ROOT, route.view);
    const file = path.join(dir, 'index.html');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, buildRoute(src, route), 'utf8');
    console.log(`  ✓ /${route.view}/index.html`);
    written++;
  });
  console.log(`\n${written} route pages regenerated from index.html.`);
}

main();
