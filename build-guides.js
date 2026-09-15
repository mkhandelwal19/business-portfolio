#!/usr/bin/env node
/* build-guides.js — long-form guides that answer a question people search.
 *
 * Separate from build-verticals.js because the shape is different: a vertical
 * page sells a trade, a guide answers a question and earns the right to sell
 * afterwards. Both share vertical.css and the same chrome.
 *
 * The cost guide is deliberately useful to someone who never hires us. That is
 * the whole mechanism: a page that only says "our prices are fair" ranks for
 * nothing, and a page that publishes the numbers other studios will not is the
 * one that gets linked to.
 *
 * Run:  node build-guides.js
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = __dirname;
const ORIGIN = 'https://netloom.in';

const GUIDES = [
  {
    slug: 'website-cost-in-india',
    nav: 'Website cost',
    title: 'What Does a Website Cost in India? (2026)',
    desc: 'An honest breakdown of website costs in India: real price bands, the running costs nobody quotes, and the five ways small businesses get overcharged. Updated 2026.',
    h1: 'What does a website cost <em>in India?</em>',
    lede: 'Most studios will not put a number in writing until they have you on a call. Here are the numbers, including the ones that are inconvenient for us.',

    answer: {
      big: '₹15,000 to ₹50,000',
      p: 'is what a properly built website costs for the overwhelming majority of Indian small businesses — a shop, a clinic, a restaurant, a studio. Below that band you are usually buying a template. Above it you are usually paying for an agency’s overheads, or for functionality you genuinely need. Both happen; only one of them is a problem.'
    },

    bands: {
      h: 'What you actually get at each price',
      sub: 'Typical bands in the Indian market. They are ranges, not quotes — a five-page site in Mumbai and the same site in Indore are not priced identically.',
      amtCol: 0,
      caption: 'Build cost only. Running costs are separate and are covered below.',
      cols: ['Price', 'What you are actually buying', 'Who it suits'],
      rows: [
        ['Under ₹10,000', ['A template with your logo dropped in', 'Often one page, built on a page builder, frequently somebody’s side income. It will look fine for a year.'], 'Almost nobody. See the traps below.'],
        ['₹15,000 – ₹25,000', ['A real four-to-eight page site', 'Custom design, mobile-first, working enquiry form, your own photographs, set up on Google.'], 'Most local businesses. This is the honest middle.'],
        ['₹25,000 – ₹50,000', ['The same, with the parts that convert', 'Booking or appointment flow, galleries, a service or menu structure that is actually maintained, written copy.'], 'Businesses where the website is the main way people find them.'],
        ['₹50,000 – ₹1,50,000', ['Agency work', 'More pages, a CMS, custom functionality, and a team with overheads to cover. Sometimes worth it.'], 'Multi-location businesses, large catalogues, funded companies.'],
        ['₹1,50,000 +', ['Software, not a website', 'Custom applications, integrations, e-commerce at scale.'], 'Established businesses with a technical requirement.']
      ]
    },

    running: {
      h: 'The running costs nobody quotes you',
      sub: 'These are ongoing and they are yours regardless of who builds the site. A studio that does not mention them at quoting time is not being straight with you.',
      amtCol: 1,
      caption: 'Typical Indian market rates, 2026. Static sites of the kind we build often host for far less than the shared-hosting figure.',
      cols: ['What', 'Typical cost', 'Worth knowing'],
      rows: [
        [['Domain name (.in)'], '₹800 – ₹1,200 / year', 'A .com is usually ₹1,000 – ₹1,500. Renew it yourself, in your own account.'],
        [['Hosting'], '₹350 – ₹700 / month', 'For shared hosting. A static site can run on infrastructure that costs nothing at this scale.'],
        [['Business email'], '₹0 – ₹150 / user / month', 'Zoho has a genuinely free tier for a small team. You do not need Google Workspace to look professional.'],
        [['SSL certificate'], '₹0', 'Let’s Encrypt is free and universally trusted. Anyone charging you for basic SSL is charging for air.'],
        [['Payment gateway'], '~2% per transaction', 'Only if you sell online. Plus GST on the fee. There is no way around this one.'],
        [['Maintenance'], '₹1,000 – ₹5,000 / month', 'Optional for a brochure site. Not optional for a store, where an unwatched checkout quietly stops working.']
      ]
    },

    traps: {
      h: 'Five ways small businesses get overcharged',
      sub: 'Every one of these is common, and every one of them is avoidable if you know to ask.',
      items: [
        ['The domain is registered in the agency’s name', 'This is the big one. If the domain is not in your account, you cannot leave — and the renewal price becomes whatever they say it is. Ask to be shown the registrar account with your name on it, before you pay anything.'],
        ['The ₹5,000 website', 'It is a template, and the real cost arrives in a year when it needs replacing rather than updating. Cheap is fine. Cheap and disposable is not the same as cheap.'],
        ['"Free website" bundled with hosting', 'You are renting, not buying. The site usually cannot be moved, so the hosting price is whatever they decide next year. Work out the three-year cost before agreeing.'],
        ['Per-page pricing', 'It quietly rewards padding your site with pages nobody reads. A four-page site that converts beats a twelve-page site that exists to justify an invoice.'],
        ['Being charged for SSL, or for "SEO setup" that is three meta tags', 'SSL is free. Basic on-page SEO — titles, descriptions, schema, alt text — should be included in any competent build, not sold as an upgrade.']
      ]
    },

    ours: {
      h: 'What we charge, and where that sits',
      sub: 'We are in the honest middle of that table, and we would rather say so than pretend to be a bargain. You see your homepage before you pay anything.'
    },

    faqs: [
      { q: 'Why is the range so wide?', a: 'Because "a website" describes a one-page template and a twelve-page store with the same word. The number of pages matters less than whether anything on the site has to work — a booking flow, a catalogue, payments. A brochure site is a week. A store is a month and carries ongoing responsibility.' },
      { q: 'Is a cheap website actually worse?', a: 'Not automatically. A well-built simple site beats an expensive bad one. What makes cheap dangerous is the things that get skipped to hit the price: the domain in your name, mobile testing, real photographs, and anyone answering the phone in six months. Ask what is excluded, not what is included.' },
      { q: 'Should I pay monthly or once?', a: 'Pay once for the build, and separately for maintenance only if you need it. Be careful with arrangements where the site stops working if you stop paying — that is renting. A brochure site you own can sit there for years costing you only the domain and hosting.' },
      { q: 'What should I never pay extra for?', a: 'SSL, basic on-page SEO, mobile responsiveness, and "submitting your site to Google". Those are either free or table stakes. In 2026 a site that is not mobile-first is not finished, so it is not an upgrade.' },
      { q: 'How much does an e-commerce site cost?', a: 'More, and the difference is mostly not design. Taking money brings GST-correct invoicing, four legally required policy pages and a payment gateway in your name, plus a real maintenance obligation. Our store tier is ₹44,999 and it carries a monthly plan, because a store nobody is watching is the one that stops taking orders.' }
    ],

    related: [
      ['/website-design-for-restaurants/', 'Restaurants & cafes'],
      ['/website-design-for-clinics/', 'Clinics & dentists'],
      ['/website-design-for-salons/', 'Salons & spas'],
      ['/website-design-for-yoga-studios/', 'Yoga & fitness'],
      ['/website-design-for-boutiques/', 'Boutiques & labels'],
      ['/website-design-for-jewellers/', 'Jewellers'],
      ['/website-design-for-real-estate/', 'Real estate'],
      ['/ecommerce-website-development/', 'Online stores']
    ]
  }
];

const TIERS = [
  { name: 'Starter',  price: '₹14,999', note: 'A presence that works: home, services or menu, about, contact.' },
  { name: 'Business', price: '₹24,999', note: 'Adds gallery, testimonials, FAQ and the booking or enquiry flow.', mid: true },
  { name: 'Premium',  price: '₹44,999', note: 'The full build, or a store that takes money on the site.' }
];

function esc (s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function plain (s) {
  return String(s).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

const LOGO = '<svg viewBox="0 0 100 100" fill="none" aria-hidden="true">'
  + '<path d="M31 24 L69 76" stroke="#C9A84C" stroke-width="15"/>'
  + '<rect x="17" y="18" width="15" height="64" fill="#F4EFE6"/>'
  + '<rect x="68" y="18" width="15" height="64" fill="#F4EFE6"/>'
  + '<path d="M31 24 L45 43" stroke="#C9A84C" stroke-width="15"/></svg>';

const FAVICON = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>"
  + "<rect width='100' height='100' rx='22' fill='%230A0F1E'/>"
  + "<path d='M31 24 L69 76' stroke='%23E0A94A' stroke-width='15'/>"
  + "<rect x='17' y='18' width='15' height='64' fill='%23F5F2EC'/>"
  + "<rect x='68' y='18' width='15' height='64' fill='%23F5F2EC'/>"
  + "<path d='M31 24 L45 43' stroke='%23E0A94A' stroke-width='15'/></svg>";

/* Rows are arrays of cells. A cell is either a plain string, or [heading, note]
   for the two-line treatment. `amtCol` says which column holds the money, so it
   gets tabular figures and no wrapping.

   Indexing a cell without checking its type is how the running-costs table
   once rendered "₹" above "8": r[1][0] on a string is its first character, and
   the two tables here do not share a row shape. */
function table (t) {
  const amtCol = t.amtCol == null ? 0 : t.amtCol;

  const cell = (c, i) => {
    if (i === amtCol) {
      if (Array.isArray(c)) throw new Error('The amount column must be a plain string.');
      return `<td class="amt">${esc(c)}</td>`;
    }
    if (Array.isArray(c)) {
      return `<td><strong>${esc(c[0])}</strong>`
        + (c[1] ? `<span class="note">${esc(c[1])}</span>` : '')
        + `</td>`;
    }
    return `<td><span class="note">${esc(c)}</span></td>`;
  };

  t.rows.forEach(r => {
    if (r.length !== t.cols.length) {
      throw new Error(`Row has ${r.length} cells but the table declares ${t.cols.length} columns.`);
    }
  });

  return `    <div class="scroller">
      <table>
        <caption>${esc(t.caption)}</caption>
        <thead><tr>${t.cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead>
        <tbody>
${t.rows.map(r => `          <tr>${r.map(cell).join('')}</tr>`).join('\n')}
        </tbody>
      </table>
    </div>`;
}

function build (g) {
  const url = `${ORIGIN}/${g.slug}/`;

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: g.faqs.map(f => ({
      '@type': 'Question',
      name: plain(f.q),
      acceptedAnswer: { '@type': 'Answer', text: plain(f.a) }
    }))
  };

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: plain(g.title),
    description: g.desc,
    mainEntityOfPage: url,
    inLanguage: 'en-IN',
    author:    { '@type': 'Organization', name: 'Netloom', url: ORIGIN + '/' },
    publisher: { '@type': 'Organization', name: 'Netloom', url: ORIGIN + '/' }
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(g.title)} — Netloom</title>
<meta name="description" content="${esc(g.desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow">
<meta name="theme-color" content="#0A0F1E">

<meta property="og:type" content="article">
<meta property="og:locale" content="en_IN">
<meta property="og:site_name" content="Netloom">
<meta property="og:title" content="${esc(g.title)} — Netloom">
<meta property="og:description" content="${esc(g.desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ORIGIN}/og-cover.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(g.title)} — Netloom">
<meta name="twitter:description" content="${esc(g.desc)}">
<meta name="twitter:image" content="${ORIGIN}/og-cover.png">

<link rel="icon" type="image/svg+xml" href="${FAVICON}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;1,500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@400..500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/vertical.css">

<script type="application/ld+json">
${JSON.stringify(articleLd, null, 2)}
</script>
<script type="application/ld+json">
${JSON.stringify(faqLd, null, 2)}
</script>
<script>
(function () {
  var TOKEN = '21490c8441f148d092cc15ebe8d7c48e';
  if (!TOKEN) return;
  var s = document.createElement('script');
  s.type = 'module';
  s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  s.setAttribute('data-cf-beacon', JSON.stringify({ token: TOKEN }));
  document.head.appendChild(s);
})();
</script>
</head>
<body>

<nav class="nav">
  <a href="/" class="logo" aria-label="Netloom home">${LOGO}<span>Netloom<em>.</em></span></a>
  <ul>
    <li><a href="/work/">Work</a></li>
    <li><a href="/services/">Services</a></li>
    <li><a href="/pricing/">Pricing</a></li>
    <li><a href="/contact/">Contact</a></li>
  </ul>
</nav>

<div class="wrap">

  <section class="hero">
    <p class="crumb"><a href="/">Netloom</a> · ${esc(g.nav)}</p>
    <h1>${g.h1}</h1>
    <p class="lede">${esc(g.lede)}</p>
  </section>

  <section>
    <div class="answer">
      <div class="big">${esc(g.answer.big)}</div>
      <p>${esc(g.answer.p)}</p>
    </div>
  </section>

  <section>
    <h2>${esc(g.bands.h)}</h2>
    <p class="sub">${esc(g.bands.sub)}</p>
${table(g.bands)}
  </section>

  <section>
    <h2>${esc(g.running.h)}</h2>
    <p class="sub">${esc(g.running.sub)}</p>
${table(g.running)}
  </section>

  <section>
    <h2>${esc(g.traps.h)}</h2>
    <p class="sub">${esc(g.traps.sub)}</p>
    <ul class="traps">
${g.traps.items.map(t => `      <li class="trap"><h3>${esc(t[0])}</h3><p>${esc(t[1])}</p></li>`).join('\n')}
    </ul>
  </section>

  <section>
    <h2>${esc(g.ours.h)}</h2>
    <p class="sub">${esc(g.ours.sub)}</p>
    <div class="tiers">
${TIERS.map(t => `      <div class="tier${t.mid ? ' mid' : ''}">
        <div class="name">${esc(t.name)}</div>
        <div class="price">${t.price}</div>
        <p>${esc(t.note)}</p>
      </div>`).join('\n')}
    </div>
  </section>

  <section>
    <h2>Questions people ask about price</h2>
    <div class="faq">
${g.faqs.map(f => `      <details>
        <summary>${esc(f.q)}</summary>
        <div class="a">${esc(f.a)}</div>
      </details>`).join('\n')}
    </div>
  </section>

  <section>
    <div class="cta">
      <h2>Want a number for your business?</h2>
      <p>Tell us what you do and we will quote you a fixed price, in writing, before any work starts.</p>
      <div class="btns">
        <a class="btn btn-primary" href="/contact/">Get a free demo</a>
        <a class="btn btn-ghost" href="https://wa.me/918249992869" target="_blank" rel="noopener">WhatsApp us</a>
      </div>
    </div>
  </section>

  <section>
    <h2>Costs for a specific trade</h2>
    <div class="related">
${g.related.map(r => `      <a href="${r[0]}">${esc(r[1])}</a>`).join('\n')}
    </div>
  </section>

</div>

<footer>
  <div class="foot-nav">
    <a href="/">Home</a><a href="/work/">Work</a><a href="/services/">Services</a><a href="/pricing/">Pricing</a><a href="/contact/">Contact</a>
  </div>
  © <span id="y">2026</span> Netloom · Websites for local businesses across India
  <script>document.getElementById('y').textContent = new Date().getFullYear();</script>
</footer>

</body>
</html>
`;
}

function main () {
  GUIDES.forEach(g => {
    const dir = path.join(ROOT, g.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), build(g), 'utf8');
    console.log(`  ✓ /${g.slug}/`);
  });
  console.log(`\n${GUIDES.length} guide generated.`);
}

module.exports = { GUIDES, ORIGIN };

if (require.main === module) main();
