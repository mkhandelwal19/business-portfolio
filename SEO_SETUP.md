# Search visibility setup — netloom.in

**Status: started 15 September 2026.** Four of the five steps below happen
inside accounts, not in this repo — the code side is already done and waiting
for tokens. Work top to bottom; step 5 is blocked on a decision, not on effort.

---

## Already in the code

Shipped this session, `npm test` green, regenerated through `build-routes.js`:

| Change | Where |
|--------|-------|
| `FAQPage` schema over the eight existing FAQs | `index.html` head |
| `ProfessionalService` enriched — phone, email, currency, offer catalogue with the three real tier prices | `index.html` head |
| Canonicals and sitemap point at the URL actually served (`/work/`, not `/work`) | `index.html`, `build-routes.js`, `sitemap.xml` |
| Verification slots + analytics loader, inert until a token is pasted | `index.html` head |
| `[city]` placeholder that was live on the production FAQ | `index.html` |

No ratings, review counts or client numbers were invented — see the copy rules.

---

## 1. Cloudflare Web Analytics

**Why this and not GA4.** Cookieless, so no consent banner is needed under the
**DPDP Act 2023** — a banner would sit badly on a site whose pitch is honesty.
It is a single deferred beacon, so the 95+ performance standard survives. GA4
is heavier, needs consent, and its value here is conversion tracking you do not
need yet.

You do **not** need Cloudflare DNS for this. The JS beacon works on any host,
including GitHub Pages.

1. Cloudflare dashboard → **Analytics & Logs → Web Analytics → Add a site**
2. Hostname: `netloom.in`
3. Copy the token out of the snippet it shows
4. Paste it into `index.html`, in the `SEARCH & ANALYTICS` block:

   ```js
   var TOKEN = 'paste-it-here';
   ```

5. `node build-routes.js` — the five route pages carry the head, so they need
   regenerating or only the home page reports
6. `npm test`, then commit

**Careful:** the token is not a secret, but the loader is a no-op while the
string is empty. If the dashboard shows nothing after a day, check that you
rebuilt the routes.

---

## 2. Google Search Console

**Use DNS TXT verification.** It covers `preview.netloom.in` in the same stroke
and survives a move off GitHub Pages. The HTML-tag alternative is in the head
block, commented out, if you would rather.

**DNS is at GoDaddy, not Cloudflare.** The Worker runs on Cloudflare; the
domain's records do not. Records live in GoDaddy → *My Products → Domains →
netloom.in → DNS*.

1. <https://search.google.com/search-console> → **Add property → Domain**
2. Enter `netloom.in` (no `https://`, no `www`)
3. Google shows a TXT record: `google-site-verification=...`
4. In GoDaddy DNS → **Add → TXT**, Name `@`, Value = the whole string
5. Wait 10–30 minutes, then hit **Verify**

Add the existing Zoho records to the same mental list — do not delete anything
while you are in there. There is already a TXT for Zoho verification and SPF.

---

## 3. Sitemap and first indexing

Only possible once step 2 verifies.

1. Search Console → **Sitemaps** → submit `https://netloom.in/sitemap.xml`
2. **URL Inspection** on each of the six routes, then *Request Indexing*:

   ```
   https://netloom.in/
   https://netloom.in/work/
   https://netloom.in/services/
   https://netloom.in/pricing/
   https://netloom.in/about/
   https://netloom.in/contact/
   ```

3. Also inspect the eight `/projects/*.html` template pages — they are in the
   sitemap and they are the pages that can rank for vertical searches

Give it two weeks, then read **Performance → Queries**. That report is the only
honest source for which terms you already surface for; everything before it is
an estimate.

---

## 4. Bing Webmaster Tools

1. <https://www.bing.com/webmasters> → sign in
2. **Import from Google Search Console** — it carries the property and the
   sitemap across, about a minute of work
3. If the import refuses, the manual fallback is the `msvalidate.01` meta tag
   already commented into the head block

Worth more than its traffic share suggests: Bing's index feeds ChatGPT search,
and that share grows every month.

---

## 5. Bing Places — blocked, and it needs a decision

Bing Places imports wholesale from a **Google Business Profile**. There is no
GBP yet, so there is nothing to import.

And the GBP itself now conflicts with the positioning you asked for:

- A Business Profile requires a **real, verifiable address**. Verification is
  by postcard, video call or phone against a physical location.
- A service-area business may **hide** the street address and list service
  areas — but it is still verified against one location, and the Maps pack it
  appears in is the one around that location.
- Listing Mumbai as a service area does **not** put you in Mumbai's Maps pack.

So the choice is real:

| Option | What you get | What you give up |
|--------|--------------|------------------|
| Create the GBP | The Maps pack for "web designer near me" where you actually are — the fastest, cheapest lead source on the whole plan | The profile names a city |
| Skip the GBP | Nothing tying the studio to one city | The single highest-return item on the plan, and Bing Places with it |

There is a middle path: keep the GBP with the address **hidden**, so it is a
service-area business serving all India, while the public site stays
city-neutral. You get the local pack without the website positioning you as a
one-city studio. This is the standard arrangement for remote studios and it is
not a trick — it is what the service-area option exists for.

Decide this before step 5; nothing else on the plan depends on it.

---

## What does not work, so nobody tries it later

- **Ranking for "website developer" unqualified.** Page one is Clutch,
  GoodFirms, DesignRush, Upwork and the platforms. Six-figure backlink counts
  against a months-old domain. Being *listed on* them is the route to that
  traffic.
- **City pages that only swap the city name.** Google's spam policy names
  doorway pages explicitly. A city page has to carry something real or it is a
  liability.
- **Schema `areaServed` as a ranking lever.** Listing twelve cities in JSON-LD
  does not make you rank in twelve cities. It describes; it does not rank.
