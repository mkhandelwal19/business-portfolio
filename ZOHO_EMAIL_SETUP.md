# Business email on netloom.in — Zoho Mail

**Status: live since 5 September 2026.** Enquiries arrive at **hello@netloom.in**.
This file is now a record of what is deployed and the traps encountered on the
way, not a to-do list. Read it before touching DNS or setting the same thing up
on another domain.

---

## What is deployed

**Zoho Mail Forever Free Plan**, India data centre (`zoho.in`). 5 users, 5 GB
each, one domain. Registrar and DNS host: **GoDaddy**.

| Address | Role |
|---------|------|
| `hello@netloom.in`   | primary mailbox, default From, shown on the site |
| `mayank@netloom.in`  | alias — personal 1:1 threads |
| `info@netloom.in`    | alias |
| `contact@netloom.in` | alias |

All four deliver to one inbox. Display names are set per alias under
*Settings → Send Mail As*.

`window.SITE_CONFIG` in `index.html`:

```js
email        : 'imayank.khandelwal@gmail.com',  // fallback, never blank
workEmail    : 'hello@netloom.in',
workEmailLive: true,                            // flipped 5 Sep 2026
```

`workEmailLive: false` reverts the whole site to the Gmail address in one line.
After changing it, run `node build-routes.js` and push.

---

## Live DNS records

Verified at GoDaddy's authoritative nameservers and on Google + Cloudflare.

| Type | Host | Value |
|------|------|-------|
| MX   | `@` | `mx.zoho.in` (10), `mx2.zoho.in` (20), `mx3.zoho.in` (50) |
| TXT  | `@` | `v=spf1 include:zoho.in ~all` |
| TXT  | `@` | `zoho-verification=zb79680069.zmverify.zoho.in` |
| TXT  | `zmail._domainkey` | `v=DKIM1; k=rsa; p=MIGfMA0GCSq…` |
| TXT  | `_dmarc` | `v=DMARC1; p=none; rua=mailto:hello@netloom.in; adkim=r; aspf=r` |

Untouched, and must stay that way — these serve the website from GitHub Pages:

| Type | Host | Value |
|------|------|-------|
| A     | `@`   | `185.199.108.153`, `.109.153`, `.110.153`, `.111.153` |
| CNAME | `www` | `mkhandelwal19.github.io` |

Mail uses MX/TXT, the site uses A/CNAME. They coexist. Never delete the A
records while cleaning up mail records.

---

## Four traps, all of which bit

### 1. The free plan is hidden

Zoho's admin console (`mailadmin.zoho.in/hosting`) shows **only paid plans**.
There is no free option on that screen and no link to one. The free plan is
reached by URL:

```
https://workplace.zoho.in/signup?type=org&plan=free     (India DC)
https://workplace.zoho.com/signup?type=org&plan=free    (US DC)
```

Appending `?plan=free` to the hosting URL also works if an org already exists.
Zoho notes the free plan is "available only in select data centers" — India is
one of them as of September 2026.

**The free plan has no IMAP, POP or ActiveSync.** Webmail and Zoho's own apps
only; it cannot be added to the Gmail app or Outlook. Upgrading to Mail Lite
(₹75/user/month billed annually) restores IMAP and keeps the same org, domain,
mailbox and DNS — purely a billing change.

### 2. GoDaddy's SPF Merge silently corrupts SPF

This is the one that actually broke things. GoDaddy has an "SPF Merge" feature
that replaces a plain SPF record with a delegated wrapper:

```
@                              TXT  v=spf1 include:dc-XXXX._spfm.netloom.in ~all
dc-XXXX._spfm.netloom.in       TXT  v=spf1 include:zoho.in ~all
```

That much works. But running Zoho's **"Configure automatically"** a second time
made GoDaddy *append* rather than replace, producing:

```
@                         v=spf1 include:dc-XXXX._spfm… include:dc-XXXX._spfm… ~all
dc-XXXX._spfm             v=spf1 include:zoho.in include:dc-XXXX._spfm… ~all
dc-XXXX._spfm             v=spf1 include:zoho.in ~all
```

Two `v=spf1` records at one name, one of them **including itself**. RFC 7208 §4.5
requires a **PermError** when more than one SPF record exists at a name — so SPF
stopped evaluating entirely. Mail still delivered, but only because DKIM was
carrying DMARC alone.

**Fix, and the shape to keep:** delete every `_spfm` record, and set exactly one
record on `@`:

```
v=spf1 include:zoho.in ~all
```

That resolves `zoho.in` → `spf.zoho.in` → four IPv4 ranges. Two DNS lookups of
the ten allowed. After fixing, use Zoho's **Verify** button — never "Configure
automatically", which reintroduces the wrapper.

### 3. The DKIM selector is `zmail`, not `zoho`

GoDaddy Domain Connect creates the selector itself. The record lives at
`zmail._domainkey`. Do not hand-create a `zoho` selector; there is nothing at
that host.

DNS alone is not enough — the selector must also show **verified inside Zoho**
(*Mail Admin → Domains → netloom.in → Email Configuration → DKIM*) or Zoho will
not sign outbound mail even though the public key resolves.

### 4. GoDaddy pre-installs its own DMARC record

Before Zoho was involved, `_dmarc` already held:

```
v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;
```

Two problems: `p=quarantine` from day one on an unproven domain, and aggregate
reports going to **GoDaddy** rather than to you — no visibility into who is
failing authentication on your own domain. It was replaced with `p=none` and
`rua=mailto:hello@netloom.in`.

Tighten to `p=quarantine` once the reports show a few clean weeks. Only one
`_dmarc` record may exist; edit it, never add a second.

---

## Domain Connect vs. manual

GoDaddy Domain Connect handled both the verification TXT and, later, MX + SPF +
DKIM in one click. It did **not** touch the GitHub Pages A or CNAME records
either time — verified after each run.

It does **not** create DMARC. That is manual.

Given trap 2, the safe pattern is: let Domain Connect run **once**, then audit
the records and fix by hand. Do not re-run it.

---

## Where the enquiry form goes

The site is static on GitHub Pages and cannot send mail, so the contact form
posts to a **Cloudflare Worker** — `netloom-enquiry`, at
<https://netloom-enquiry.netloom.workers.dev>. Formspree was removed on
5 September 2026.

The Worker opens one authenticated SMTP session to Zoho and sends two messages:

1. the **enquiry** to `hello@netloom.in`, `Reply-To` set to the enquirer, subject
   `Netloom enquiry — Priya Sharma, Kolkata (business)`
2. an **acknowledgement** to the enquirer, genuinely `From: hello@netloom.in`

The second one is the reason for the whole exercise: no form backend sends the
thank-you from your own address below Formspree's $30/month Professional tier.
Zoho's free plan does permit SMTP — POP, IMAP and Forwards are paid-only, SMTP
is not — which is what makes it free.

Source, deploy steps and troubleshooting live in `worker/README.md`. The
endpoint URL is in `index.html` as `ENQUIRY_ENDPOINT`; the credentials are
Cloudflare secrets and appear nowhere in this repo.

## Verifying

```bash
nslookup -type=MX  netloom.in 8.8.8.8
nslookup -type=TXT netloom.in 8.8.8.8
nslookup -type=TXT zmail._domainkey.netloom.in 8.8.8.8
nslookup -type=TXT _dmarc.netloom.in 8.8.8.8
```

Query `ns69.domaincontrol.com` directly to bypass caching and see what GoDaddy
actually holds.

Then [mail-tester.com](https://www.mail-tester.com) — **10/10 on 5 Sep 2026**.

One gotcha there: send a *realistic* message. A blank test mail triggers
SpamAssassin's `EMPTY_MESSAGE` rule at **-2.344**, which alone drops a perfect
domain to 7.8/10 and looks like a DNS problem. It is not. Only the
"You're properly authenticated" panel reflects your DNS; check `SPF_PASS`,
`DKIM_VALID`, `DKIM_VALID_AU` and `DKIM_VALID_EF`.

Zoho's own dashboard status lags reality — it cached "Yet to point MX Records"
for a while after the MX records were live and correct worldwide. Trust `nslookup`
and a real test mail over the badge.

---

## Signature

The signature lives in `email-signature.html` at the repo root: logo, name,
title, `netloom.in`, `hello@netloom.in`, WhatsApp number, tagline. Same fonts,
colours and hosted logo as the enquiry mails in `worker/preview/`, so a reply
from the inbox and an automated mail look like one company.

Setting it up in Zoho Mail (web, `mail.zoho.in`):

1. Settings (gear, top right) → **Signatures** → **+**. Name it `Netloom`.
2. In the editor toolbar use **Insert HTML** (the `</>` icon; it may sit under
   the overflow menu at the right end of the toolbar). Paste everything from
   the `<table>` down — not the HTML comment above it. Insert, then Save.
3. Under **Associated From address(es) for new emails** pick
   `hello@netloom.in`. Repeat for `mayank@`, `info@` and `contact@` — each
   alias has to be linked separately or mails from it go out bare.
4. Back on the Signatures page, under **Signature for replies**, tick
   **Add signature to all my email replies** and choose the placement *above
   the quoted text*.
5. Send a test to the Gmail address and check it on Gmail web and the Gmail
   phone app. The first mail from a new sender may show a "display images"
   prompt — that is Gmail, not a broken link.

Traps:

- Paste the HTML, do not type it into the rich-text editor — Zoho rewrites
  typed formatting into its own markup and Outlook then breaks the layout.
- The logo is fetched from `https://netloom.in/assets/email-logo.png` on every
  open, so the file must never move. Regenerate it with
  `node build-email-logo.js`; never rename it.
- The Zoho mobile app keeps its own signature (app Settings → account →
  Signature). Set a plain-text version there; it does not read the web one.
- Do not let the signature grow. Four lines and a 56px mark is the ceiling;
  anything taller than a one-line reply reads as spam.

---

## Still outside this repo

- Google Business Profile, Instagram bio, and any outreach templates in
  `outreach/` still need the address updated by hand.
- `index.html` carries `imayank.khandelwal@gmail.com` in six places. Five are
  markup fallbacks that the runtime swaps via `[data-email-display]` and
  `a[href^="mailto:"]`; the sixth is `SITE_CONFIG.email`, the deliberate
  fallback. None need editing.
