/* Photography across the eight demos.
   ----------------------------------------------------------------------------
   These exist because the failure that mattered here was invisible to every
   check that was running: a masala dosa on the hero of a Bengali thali house,
   and a Rajasthani namkeen stall captioned "Shorshe Ilish". Nothing was broken,
   nothing threw, every page scored fine - the pictures were simply of the wrong
   thing, and only a person looking at them caught it.

   A test cannot tell you a photo shows the wrong dish. It can hold the line on
   everything around that: no slot silently falling back to hand-drawn SVG, no
   src pointing at a file that does not exist, and no page quietly serving the
   1200px originals into thumbnails. */
'use strict';
const fs = require('fs');
const path = require('path');
const { ROOT, suite } = require('./lib');
const { JSDOM } = require('jsdom');

/* Four verticals. The other four — jewellery, real estate, boutique and
   online store — were retired in favour of their premium replacements
   (jewellery-lux, realestate-lux, boutique-lux and commerce), which are
   covered by flagship.test.js and commerce.test.js instead. */
const CATS = ['restaurant', 'healthcare', 'salon', 'yoga'];

/* The one deliberate exception: jewellery/custom.html numbers its four
   process steps 01-04 in .feature-icon. Those are a sequence, not icons
   standing in for pictures, and a photo would destroy the ordering. */
const NUMBERED_STEPS = 'jewellery/custom.html';

module.exports = function run() {
  const s = suite('photography across the demos');

  const pages = [];
  for (const c of CATS) {
    for (const f of fs.readdirSync(path.join(ROOT, c)).filter(x => x.endsWith('.html'))) {
      pages.push(c + '/' + f);
    }
  }
  s.check(pages.length === 36, `all 36 demo pages found (${pages.length})`);

  const broken = [], svgSlots = [], noAlt = [], fullSize = [], multiEager = [];

  for (const rel of pages) {
    const doc = new JSDOM(fs.readFileSync(path.join(ROOT, rel), 'utf8')).window.document;
    const dir = path.dirname(path.join(ROOT, rel));

    // every media slot carries a photograph, not hand-drawn vector art
    for (const sel of ['.card-thumb', '.hero-art', '.hero-visual', '.feature-icon']) {
      for (const el of doc.querySelectorAll(sel)) {
        if (el.querySelector('img')) continue;
        if (rel === NUMBERED_STEPS && sel === '.feature-icon') continue;
        svgSlots.push(`${rel} ${sel}`);
      }
    }

    let eager = 0;
    for (const im of doc.querySelectorAll('img')) {
      const src = im.getAttribute('src') || '';
      if (!fs.existsSync(path.normalize(path.join(dir, src)))) broken.push(`${rel} -> ${src}`);
      if (im.getAttribute('alt') === null) noAlt.push(`${rel} -> ${src}`);

      if (im.getAttribute('loading') === 'eager') eager++;
      // Anything lazy must come from a derivative set. Serving a 1200px
      // original into a 380px card is how a demo page reaches 750 KB.
      else if (/\.\.\/assets\/photos\/[a-z0-9-]+\.webp$/.test(src)) fullSize.push(`${rel} -> ${src}`);
    }
    if (eager > 1) multiEager.push(`${rel} has ${eager}`);
  }

  s.check(svgSlots.length === 0,
    'no media slot left as hand-drawn SVG' + (svgSlots.length ? ` — ${svgSlots.slice(0, 4).join(', ')}` : ''));
  s.check(broken.length === 0,
    'every img src resolves to a real file' + (broken.length ? ` — ${broken.slice(0, 4).join(', ')}` : ''));
  s.check(noAlt.length === 0,
    'every img carries an alt attribute' + (noAlt.length ? ` — ${noAlt.slice(0, 4).join(', ')}` : ''));
  s.check(fullSize.length === 0,
    'lazy images use a size derivative, not the original' + (fullSize.length ? ` — ${fullSize.slice(0, 4).join(', ')}` : ''));
  s.check(multiEager.length === 0,
    'at most one eager image per page (the LCP hero)' + (multiEager.length ? ` — ${multiEager.join(', ')}` : ''));

  // The derivative sets must actually exist for every source photo.
  const src = fs.readdirSync(path.join(ROOT, 'assets/photos')).filter(f => f.endsWith('.webp'));
  for (const tier of ['sm', 'md', 'xs']) {
    const have = fs.readdirSync(path.join(ROOT, 'assets/photos', tier)).filter(f => f.endsWith('.webp'));
    s.check(have.length === src.length, `${tier}/ covers all ${src.length} source photos (${have.length})`);
  }

  // The dosa and both banana-leaf sadyas are South Indian, on a Bengali
  // restaurant. They were retired; keep them retired.
  const retired = ['restaurant-11', 'restaurant-06', 'restaurant-20', 'restaurant-05'];
  const restaurantHtml = fs.readdirSync(path.join(ROOT, 'restaurant'))
    .filter(f => f.endsWith('.html'))
    .map(f => fs.readFileSync(path.join(ROOT, 'restaurant', f), 'utf8')).join('');
  const back = retired.filter(r => restaurantHtml.includes(r + '.webp'));
  s.check(back.length === 0,
    'retired mismatched restaurant photos stay out' + (back.length ? ` — ${back.join(', ')}` : ''));


  /* The five staff pages are gone and must stay gone.
     Each one presented a stock portrait as a specific named employee - a
     glamour shot captioned "Ratan Ghosh, Head Chef & Owner", a man in a
     waistcoat captioned "Priya Banerjee, Sous Chef". Attaching a real
     person's likeness to an invented named role is the sharpest legal edge
     on the site, quite apart from the genders being inverted. */
  const GONE = ['restaurant/team.html', 'salon/team.html', 'realestate/team.html',
                'healthcare/doctors.html', 'yoga/teachers.html'];
  const revived = GONE.filter(g => fs.existsSync(path.join(ROOT, g)));
  s.check(revived.length === 0, 'staff pages stay deleted' + (revived.length ? ' — ' + revived.join(', ') : ''));

  const linked = [];
  for (const rel of pages) {
    const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    for (const t of ['team.html', 'doctors.html', 'teachers.html']) {
      if (html.includes('href="' + t + '"')) linked.push(`${rel} -> ${t}`);
    }
  }
  s.check(linked.length === 0,
    'nothing links to a deleted staff page' + (linked.length ? ' — ' + linked.slice(0, 4).join(', ') : ''));

  // No portraits of identifiable people remain anywhere in the library.
  const anyPortrait = ['', 'xs', 'sm', 'md'].some(d =>
    fs.readdirSync(path.join(ROOT, 'assets/photos', d)).some(f => f.startsWith('portrait-')));
  s.check(!anyPortrait, 'the named-person portrait set is deleted');

  /* Contact pages carry a real map, and the Google frame is not filtered -
     their terms require the logo and Terms link stay unaltered, so an
     invert() to make it match the dark theme would break them. */
  const MAPPED = ['restaurant', 'healthcare', 'salon', 'yoga'];
  const noMap = [], filtered = [];
  for (const c of MAPPED) {
    const rel = c + '/contact.html';
    const doc = new JSDOM(fs.readFileSync(path.join(ROOT, rel), 'utf8')).window.document;
    const embed = doc.querySelector('.map-embed');
    if (!embed || !embed.querySelector('iframe') || !embed.querySelector('.map-open')) noMap.push(rel);
    else if (embed.querySelector('iframe').getAttribute('loading') !== 'lazy') noMap.push(rel + ' (not lazy)');
  }
  const css = fs.readFileSync(path.join(ROOT, 'demo.css'), 'utf8');
  const mapBlock = css.slice(css.indexOf('.map-embed'), css.indexOf('.map-embed') + 900);
  if (/filter:\s*(?!brightness)/.test(mapBlock.split('.map-open')[0])) filtered.push('map iframe is filtered');
  s.check(noMap.length === 0,
    'every contact page has a lazy map + directions link' + (noMap.length ? ' — ' + noMap.join(', ') : ''));
  s.check(filtered.length === 0, 'the Google map frame is left unfiltered (attribution intact)');

  return Promise.resolve(s.report());
};
