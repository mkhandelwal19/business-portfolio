#!/usr/bin/env node
// ─────────────────────────────────────────────
//  Kolkata Lead Scanner
//  Finds businesses: good reviews, no/weak web presence
//  Exports CSV + JSON with contact details + emails
//
//  Usage:
//    node scanner.js                    (full scan)
//    node scanner.js --quick            (3 areas × 4 categories, for testing)
//    node scanner.js --category "Salon" (single category)
//    node scanner.js --area "Behala"    (single area)
//    node scanner.js --no-email         (skip email extraction, faster)
// ─────────────────────────────────────────────

// Load .env file if present (keeps API key out of version control)
const fs = require('fs'), path = require('path');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  });
}

const axios = require('axios');
const cfg   = require('./config');
const { checkWebsite } = require('./website-checker');
const { exportCSV, exportJSON } = require('./export');
const path  = require('path');

// ── CLI flags ─────────────────────────────────
const args        = process.argv.slice(2);
const QUICK       = args.includes('--quick');
const NO_EMAIL    = args.includes('--no-email');
const CAT_FILTER  = argValue(args, '--category');
const AREA_FILTER = argValue(args, '--area');

function argValue(arr, flag) {
  const i = arr.indexOf(flag);
  return i !== -1 ? arr[i + 1] : null;
}

// ── Google Places API (New / v1) helpers ──────
const PLACES_V1   = 'https://places.googleapis.com/v1/places';
const API_HEADERS = () => ({
  'Content-Type':   'application/json',
  'X-Goog-Api-Key': cfg.API_KEY,
});

// All fields in ONE search call — no separate details request needed.
// Cost: ~$0.049/search (Basic $0.032 + Contact SKU $0.017).
// Saves a second API call per business = ~50% cost reduction.
const SEARCH_FIELDS = [
  'places.id',
  'places.displayName',
  'places.rating',
  'places.userRatingCount',
  'places.businessStatus',
  'places.formattedAddress',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.googleMapsUri',
].join(',');

// ── Budget guard ──────────────────────────────
// $0.049 per search request (Basic + Contact SKU, conservative estimate)
const COST_PER_CALL   = 0.049;
const MAX_BUDGET_USD  = cfg.BUDGET_LIMIT_USD || 15;  // hard stop — never exceeds free tier
let   totalApiCalls   = 0;
let   estimatedCostUSD = 0;

function trackCall() {
  totalApiCalls++;
  estimatedCostUSD = +(totalApiCalls * COST_PER_CALL).toFixed(3);
}

function budgetExceeded() {
  if (estimatedCostUSD >= MAX_BUDGET_USD) {
    process.stdout.write('\n');
    console.log(`\n  🛑  Budget limit reached ($${MAX_BUDGET_USD} / $200 free tier).`);
    console.log(`      Scan stopped at ${totalApiCalls} calls (~$${estimatedCostUSD} used).`);
    console.log(`      Increase BUDGET_LIMIT_USD in config.js to scan more.\n`);
    return true;
  }
  return false;
}

async function textSearch(query) {
  if (budgetExceeded()) return [];
  const { data } = await axios.post(
    `${PLACES_V1}:searchText`,
    { textQuery: query, maxResultCount: cfg.MAX_RESULTS_PER_QUERY, languageCode: 'en' },
    { headers: { ...API_HEADERS(), 'X-Goog-FieldMask': SEARCH_FIELDS }, timeout: 10000 }
  );
  trackCall();
  if (data.error) throw new Error(`API error: ${data.error.message}`);
  // Each result already has all fields — no separate details call needed
  return (data.places || []).map(p => ({
    place_id:           p.id,
    name:               p.displayName?.text || '',
    rating:             p.rating,
    user_ratings_total: p.userRatingCount,
    business_status:    p.businessStatus,
    // Detail fields already present
    formatted_address:  p.formattedAddress || '',
    phone:              p.nationalPhoneNumber || p.internationalPhoneNumber || '',
    website:            p.websiteUri || '',
    maps_url:           p.googleMapsUri || '',
  }));
}

// placeDetails no longer needed — kept as no-op for compatibility
async function placeDetails(r) { return r; }

// ── Website type classifier ───────────────────
function classifyWebsite(url) {
  if (!url) return 'none';
  const u = url.toLowerCase();
  if (/facebook\.com|fb\.com/.test(u))          return 'facebook';
  if (/instagram\.com/.test(u))                  return 'instagram';
  if (/justdial\.com/.test(u))                   return 'justdial';
  if (/indiamart\.com/.test(u))                  return 'indiamart';
  if (/sulekha\.com/.test(u))                    return 'sulekha';
  if (/zomato\.com|swiggy\.com/.test(u))         return 'zomato_swiggy';
  if (/wixsite\.com|wix\.com/.test(u))           return 'wix';
  if (/blogspot\.com|blogger\.com/.test(u))      return 'blogspot';
  if (/weebly\.com|wordpress\.com/.test(u))      return 'template_free';
  if (/linktr\.ee|linktree/.test(u))             return 'linktree';
  if (/magicbricks|99acres|housing\.com/.test(u))return 'property_portal';
  return 'own_site';
}

// ── Lead scorer ───────────────────────────────
function scoreLead(details, websiteType) {
  const s  = cfg.scoring;
  const reasons = [];
  let score = 0;

  // Website presence
  if (websiteType === 'none') {
    score += s.NO_WEBSITE;
    reasons.push('No website at all');
  } else if (['facebook','instagram','justdial','indiamart','sulekha','linktree','zomato_swiggy'].includes(websiteType)) {
    score += s.WEAK_WEBSITE;
    reasons.push(`Presence = ${websiteType} only`);
  } else if (['wix','blogspot','template_free'].includes(websiteType)) {
    score += s.TEMPLATE_WEBSITE;
    reasons.push('Weak template website (Wix/Blogspot)');
  } else {
    // has own site — still include but lower score
    reasons.push('Has own website');
  }

  // Review volume = established, busy business
  const reviews = details.user_ratings_total || 0;
  if (reviews >= 300) {
    score += s.REVIEWS_300_PLUS;
    reasons.push(`${reviews} reviews — high footfall`);
  } else if (reviews >= 100) {
    score += s.REVIEWS_100_TO_299;
    reasons.push(`${reviews} reviews`);
  } else if (reviews >= 50) {
    score += s.REVIEWS_50_TO_99;
    reasons.push(`${reviews} reviews`);
  } else if (reviews >= 25) {
    score += s.REVIEWS_25_TO_49;
    reasons.push(`${reviews} reviews`);
  }

  // Rating
  const rating = details.rating || 0;
  if (rating >= 4.5) {
    score += s.RATING_4_5_PLUS;
    reasons.push(`Rating ${rating} ⭐`);
  } else if (rating >= 4.0) {
    score += s.RATING_4_0_PLUS;
    reasons.push(`Rating ${rating} ⭐`);
  }

  return { score, reasons: reasons.join(' · ') };
}

// ── Utilities ─────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

function pad(s, n) {
  const str = String(s ?? '');
  return str.length >= n ? str.slice(0, n) : str + ' '.repeat(n - str.length);
}

// ── Progress bar ──────────────────────────────
let totalJobs = 0;
let doneJobs  = 0;
function progress(label) {
  doneJobs++;
  const pct  = Math.round((doneJobs / totalJobs) * 100);
  const bar  = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));
  process.stdout.write(`\r  [${bar}] ${pct}%  ${label.slice(0, 55).padEnd(55)}`);
}

// ── Main ──────────────────────────────────────
async function scan() {
  // ── Validate API key
  if (cfg.API_KEY === 'YOUR_GOOGLE_PLACES_API_KEY') {
    console.error('\n❌  No API key set. Edit config.js or run:\n');
    console.error('   set GOOGLE_PLACES_KEY=your_key_here && node scanner.js\n');
    process.exit(1);
  }

  // ── Build job list
  let cats = cfg.categories;
  if (CAT_FILTER) cats = cats.filter(c => c.name.toLowerCase().includes(CAT_FILTER.toLowerCase()));
  if (QUICK) cats = cats.slice(0, 4);

  // Build city → areas map
  const cityMap = cfg.cities;
  let activeCities = cfg.SCAN_CITIES || Object.keys(cityMap);
  if (AREA_FILTER) {
    // Filter areas across all cities
    activeCities = activeCities.filter(city =>
      cityMap[city].some(a => a.toLowerCase().includes(AREA_FILTER.toLowerCase()))
    );
  }

  let allAreas = []; // [{city, area}]
  for (const city of activeCities) {
    let areas = cityMap[city] || [];
    if (AREA_FILTER) areas = areas.filter(a => a.toLowerCase().includes(AREA_FILTER.toLowerCase()));
    if (QUICK)       areas = areas.slice(0, 2);
    for (const area of areas) allAreas.push({ city, area });
  }

  if (!cats.length || !allAreas.length) {
    console.error('❌  No categories or areas matched your filter.');
    process.exit(1);
  }

  const jobs = [];
  for (const cat of cats)
    for (const { city, area } of allAreas)
      for (const q of cat.queries.slice(0, 2))
        jobs.push({ cat, city, area, query: `${q} in ${area}` });

  totalJobs = jobs.length;

  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║     Kolkata Lead Scanner — Mayank K.         ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`\n  Mode      : ${QUICK ? 'QUICK (test)' : 'FULL'}`);
  console.log(`  Cities    : ${activeCities.join(', ')}`);
  console.log(`  Categories: ${cats.length}`);
  console.log(`  Area slots: ${allAreas.length}`);
  console.log(`  Queries   : ${jobs.length}`);
  console.log(`  Email scan: ${NO_EMAIL ? 'OFF' : 'ON'}\n`);

  // ── Cost estimate upfront
  const estCost = (jobs.length * COST_PER_CALL).toFixed(2);
  console.log(`  💰  Estimated cost: ~$${estCost} of $200 free tier  (hard stop at $${MAX_BUDGET_USD})\n`);

  // ── Scan
  const seen    = new Set();
  const leads   = [];
  let   skipped = 0;

  for (const job of jobs) {
    if (budgetExceeded()) break;
    progress(job.query);
    try {
      const results = await textSearch(job.query);   // one call — includes website + phone
      await sleep(cfg.API_DELAY_MS);

      for (const r of results.slice(0, cfg.MAX_RESULTS_PER_QUERY)) {
        if (seen.has(r.place_id)) continue;
        if ((r.user_ratings_total || 0) < cfg.MIN_REVIEWS) { skipped++; continue; }
        if (r.business_status !== 'OPERATIONAL') continue;

        seen.add(r.place_id);

        const websiteType = classifyWebsite(r.website);
        const { score, reasons } = scoreLead(r, websiteType);
        if (score < cfg.MIN_SCORE) continue;

        leads.push({
          score,
          name:         r.name,
          category:     job.cat.name,
          city:         job.city,
          area:         job.area.replace(new RegExp(` ${job.city}`, 'i'), ''),
          address:      r.formatted_address,
          phone:        r.phone,
          email:        '',
          email_source: '',
          website:      r.website,
          website_type: websiteType,
          rating:       r.rating || 0,
          reviews:      r.user_ratings_total || 0,
          maps_url:     r.maps_url,
          reasons,
        });
      }
    } catch (err) {
      process.stdout.write(`\n  ⚠  ${job.query}: ${err.message}\n`);
      totalJobs--;
    }
  }

  // ── Sort by score
  leads.sort((a, b) => b.score - a.score);

  process.stdout.write('\n');
  console.log(`\n  ✅  Scan done — ${leads.length} leads found`);
  console.log(`      API calls: ${totalApiCalls}  |  Estimated cost: ~$${estimatedCostUSD}  |  Skipped (low reviews): ${skipped}\n`);

  // ── Email extraction
  if (!NO_EMAIL) {
    console.log('  📧  Extracting emails from websites...\n');
    let emailFound = 0;
    for (let i = 0; i < leads.length; i++) {
      const l = leads[i];
      if (l.website && l.website_type !== 'none') {
        process.stdout.write(`\r  Checking (${i + 1}/${leads.length}) ${l.name.slice(0, 40).padEnd(40)}`);
        const { email, source } = await checkWebsite(l.website);
        if (email) {
          l.email        = email;
          l.email_source = source;
          emailFound++;
        }
        await sleep(400);
      }
    }
    process.stdout.write('\n');
    console.log(`\n  📬  Emails found: ${emailFound} of ${leads.length} leads\n`);
  }

  // ── Print top 20 table
  const top = leads.slice(0, 20);
  const LINE = '─'.repeat(150);

  console.log('\n  🏆  TOP LEADS\n');
  console.log('  ' + LINE);
  console.log(
    '  ' +
    pad('SCR', 5)  + pad('NAME', 34) + pad('CATEGORY', 24) +
    pad('AREA', 18) + pad('PHONE', 17) + pad('WEB TYPE', 16) + 'EMAIL / WHY'
  );
  console.log('  ' + LINE);

  for (const l of top) {
    const emailOrReason = l.email || l.reasons.split(' · ')[0];
    console.log(
      '  ' +
      pad(l.score, 5)          +
      pad(l.name, 34)          +
      pad(l.category, 24)      +
      pad(l.area, 18)          +
      pad(l.phone || '—', 17)  +
      pad(l.website_type, 16)  +
      emailOrReason.slice(0, 50)
    );
  }
  console.log('  ' + LINE);

  // ── Export
  const outDir  = __dirname;
  const csvPath  = path.join(outDir, 'leads.csv');
  const jsonPath = path.join(outDir, 'leads.json');

  console.log();
  exportCSV(leads, csvPath);
  exportJSON(leads, jsonPath);

  // ── Summary by category
  console.log('\n  📊  Leads by category:\n');
  const byCat = {};
  for (const l of leads) {
    byCat[l.category] = (byCat[l.category] || 0) + 1;
  }
  const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  for (const [cat, count] of sorted) {
    const bar = '▓'.repeat(Math.min(count, 40));
    console.log(`  ${pad(cat, 28)} ${bar} ${count}`);
  }

  // ── Leads with emails summary
  const withEmail = leads.filter(l => l.email);
  console.log(`\n  ✉️   Ready-to-email leads : ${withEmail.length}`);
  console.log(`  📞  Phone-only (manual outreach): ${leads.length - withEmail.length}`);
  console.log(`  💰  Total API cost this run : ~$${estimatedCostUSD} of $200 free monthly credit`);
  console.log('\n  Tip: run  node server.js  to open the dashboard and send emails directly.\n');
}

scan().catch(err => {
  console.error('\n❌  Fatal error:', err.message);
  process.exit(1);
});
