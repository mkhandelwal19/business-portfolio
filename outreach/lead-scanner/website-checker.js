// ─────────────────────────────────────────────
//  Website Checker
//  Fetches a URL, extracts emails via regex,
//  falls back to /contact and /about pages.
// ─────────────────────────────────────────────

const axios = require('axios');
const { WEBSITE_TIMEOUT_MS } = require('./config');

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

const NOISE_EMAILS = [
  /noreply|no-reply|donotreply/i,
  /example\.|test\.|demo\./i,
  /privacy@|legal@|abuse@|dmca@|admin@wordpress|support@wix/i,
  /\.png$|\.jpg$|\.gif$/i,
  /sentry\.io|w3\.org|schema\.org|googleapis\.com/i,
];

const FETCH_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml',
};

function filterEmails(raw) {
  return [...new Set(raw || [])].filter(
    e => !NOISE_EMAILS.some(re => re.test(e))
  );
}

async function fetchHtml(url) {
  const res = await axios.get(url, {
    timeout: WEBSITE_TIMEOUT_MS,
    headers: FETCH_HEADERS,
    maxRedirects: 4,
    validateStatus: s => s < 400,
  });
  return typeof res.data === 'string' ? res.data : '';
}

async function extractEmailFromUrl(url) {
  try {
    const html = await fetchHtml(url);
    const found = filterEmails(html.match(EMAIL_RE));
    if (found.length) return { email: found[0], source: url };
  } catch {}
  return null;
}

async function checkWebsite(rawUrl) {
  if (!rawUrl) return { email: '', source: '' };

  // Normalise URL
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  const base = url.replace(/\/$/, '');

  // 1. Homepage
  const fromHome = await extractEmailFromUrl(base);
  if (fromHome) return fromHome;

  // 2. /contact
  const fromContact = await extractEmailFromUrl(base + '/contact');
  if (fromContact) return fromContact;

  // 3. /contact-us
  const fromContactUs = await extractEmailFromUrl(base + '/contact-us');
  if (fromContactUs) return fromContactUs;

  // 4. /about
  const fromAbout = await extractEmailFromUrl(base + '/about');
  if (fromAbout) return fromAbout;

  return { email: '', source: '' };
}

module.exports = { checkWebsite };
