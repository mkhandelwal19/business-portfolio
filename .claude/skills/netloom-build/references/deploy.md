# Deploy — private preview, then live

Two hops. A client site is **never** built directly on their domain.

```
   client folder            preview.netloom.in/<slug>/        their-domain.in
   (local, in progress) ──► private review link          ──►  live, their repo
                            noindex, unguessable slug         their DNS
```

---

## Part 1 — One-time setup (do this once, ever)

This has **not been done yet** as of 8 September 2026. Whoever does it first,
tick the boxes here and commit.

- [ ] **Create the repo.** New public GitHub repo `netloom-preview` under
      `mkhandelwal19`. Public is required for GitHub Pages on a free account;
      the protection is the unguessable slug plus `noindex`, not secrecy of
      the repo. If previews must be genuinely private, that needs GitHub Pro —
      note it and decide, do not assume.
- [ ] **Claim the hostname.** In the repo root, a file called `CNAME`
      containing exactly one line:
      ```
      preview.netloom.in
      ```
- [ ] **Add `.nojekyll`** (empty file) in the repo root, so GitHub Pages
      serves directories beginning with an underscore and does not try to
      build the site with Jekyll.
- [ ] **Add a root `index.html`** that says nothing useful — "Netloom staging.
      Nothing to see here." — with `<meta name="robots" content="noindex,
      nofollow">`. Someone will eventually visit the bare hostname.
- [ ] **Add `robots.txt`** in the repo root:
      ```
      User-agent: *
      Disallow: /
      ```
- [ ] **Turn on Pages.** Repo → Settings → Pages → Source: `main`, folder `/`.
- [ ] **Add the DNS record at GoDaddy** (netloom.in lives there):

      | Type | Name | Value | TTL |
      |---|---|---|---|
      | CNAME | `preview` | `mkhandelwal19.github.io` | 1 hour |

- [ ] **Wait, then enforce HTTPS.** DNS takes 10 minutes to a few hours.
      Once GitHub stops showing a DNS-check error, tick "Enforce HTTPS" in
      Settings → Pages. The certificate can take another hour. **Do not send a
      client a link before the padlock works** — a browser warning on the
      first thing they ever see from us is not recoverable.
- [ ] Verify: `https://preview.netloom.in/` loads the placeholder over HTTPS.

---

## Part 2 — Publishing a preview (per client, ~10 minutes)

### Slug

```
<business-slug>-<4 random lowercase letters/digits>
```

e.g. `aangan-thali-k4x9`, `basu-clinic-7m2p`.

The random suffix is the access control. Rules:

- Never reuse a slug, even for the same client on a second project.
- Never use a guessable slug (`test`, `demo`, `client1`).
- Never link to a preview from any public page.

Generate one:

```bash
python -c "import random,string; print(''.join(random.choices(string.ascii_lowercase+string.digits, k=4)))"
```

### Steps

```bash
# 1. clone the preview repo once, then reuse it
git clone https://github.com/mkhandelwal19/netloom-preview.git
cd netloom-preview

# 2. drop the client build in under its slug
cp -r ../aangan-thali-build ./aangan-thali-k4x9

# 3. every page must carry noindex before it goes up — see the checker below
python check-noindex.py aangan-thali-k4x9

# 4. ship it
git add aangan-thali-k4x9
git commit -m "Preview: Aangan Thali House"
git push
```

Live at `https://preview.netloom.in/aangan-thali-k4x9/` within a minute or two.

### `check-noindex.py`

Keep this in the `netloom-preview` repo root. A preview that gets indexed is a
duplicate-content problem for the client's real site later, and it lets
anyone find every client we are talking to.

```python
#!/usr/bin/env python3
"""Refuse to publish a preview folder whose pages are not noindexed."""
import io, os, sys

TAG = 'name="robots"'
folder = sys.argv[1]
bad = []
for root, _, files in os.walk(folder):
    for f in files:
        if not f.endswith('.html'):
            continue
        p = os.path.join(root, f)
        head = io.open(p, encoding='utf-8').read().split('</head>')[0]
        if TAG not in head or 'noindex' not in head:
            bad.append(p)

if bad:
    print('MISSING noindex in %d file(s):' % len(bad))
    for p in bad:
        print('  !', p)
    sys.exit(1)
print('OK — every page is noindexed')
```

Add to every page's `<head>` if it is missing:

```html
<meta name="robots" content="noindex, nofollow">
```

### Sending the link

WhatsApp, not email. Something close to this:

> Hi <name> — your site is ready to look at:
> https://preview.netloom.in/aangan-thali-k4x9/
>
> It's a private link, not live and not on Google yet. Open it on your phone
> — that's how most of your customers will see it.
>
> There's a light and a dark version — the switch is at the top right of the
> grey bar. Have a look at both and tell me which one you want to go live
> with.
>
> Two rounds of changes are included. Send me everything you want changed in
> one message rather than as you spot it — it's faster for both of us.

Note the theme instruction. It gives them something concrete to have an
opinion about, which channels the vague "I'm not sure about it" feedback that
otherwise arrives on day three.

To send one specific theme directly: append `?theme=light` or `?theme=dark`
to the URL. The choice sticks as they click through the site.

### After go-live

Delete the preview folder from `netloom-preview` and push. It has served its
purpose and it is now a stale duplicate of a live site.

---

## Part 3 — Going live on the client's domain

### Before you start, you need

- [ ] Client has signed off in writing (a WhatsApp "yes go ahead" is fine —
      screenshot it)
- [ ] Final payment received, or explicitly agreed to follow
- [ ] The domain is registered **in the client's own account**
- [ ] You have registrar access, or the client is on a call with you
- [ ] `LICENCES.md` is complete
- [ ] `qa.md` fully ticked

### The repo

Each client gets their own GitHub repo, `client-<slug>`. Not a folder in a
shared repo, because at handover the whole repo is transferred to them.

```bash
# from the client build folder
git init
git add .
git commit -m "Initial site"
gh repo create client-aangan-thali --public --source=. --push
```

Then in the repo root, a `CNAME` file containing their hostname:

```
aanganthali.in
```

Repo → Settings → Pages → Source `main`, folder `/`.

### DNS

At **their** registrar. Apex domain plus `www`:

| Type | Name | Value |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `mkhandelwal19.github.io` |

Those four IPs are GitHub Pages' apex addresses. Set all four — they are
redundant, not alternatives. Verify them against GitHub's current
documentation on the day; they have changed before.

If the client wants `www.theirdomain.in` as the primary, put that in `CNAME`
instead and GitHub will redirect the apex to it.

### The wait

| Step | Typical | Worst case |
|---|---|---|
| DNS propagation | 10–30 min | 48 h |
| GitHub DNS check passes | minutes after that | — |
| HTTPS certificate issued | 15 min–1 h | 24 h |

Check with `dig aanganthali.in +short` or `nslookup`. **Tick "Enforce HTTPS"
only after GitHub stops showing the DNS error**, then wait for the padlock
before telling the client it is live.

Tell the client up front that this step involves waiting and that it is
normal. A client refreshing a half-propagated domain and seeing a certificate
warning will phone you in a panic.

### Cutover, if something is already live there

If the domain currently serves an old site:

1. Agree a time. Early morning on a weekday is lowest traffic for most of
   these businesses.
2. Screenshot the old site first — sometimes there is content on it nobody
   remembers, and they will ask for it back.
3. Note the old site's URLs. If any are indexed and getting traffic, either
   keep the same paths or set up redirects. A 404 on a page Google is
   currently sending customers to is a real loss.
4. Change DNS. Expect a window where some visitors get the old site and some
   get the new one. That is normal and it resolves itself.

### Same-day-of-launch checklist

- [ ] `https://theirdomain.in` and `https://www.theirdomain.in` both load
- [ ] Padlock, no mixed-content warning
- [ ] Open it on a real phone on mobile data, not just on wifi
- [ ] Every nav link and every footer link resolves
- [ ] Phone number dials, WhatsApp button opens with the right prefilled text
- [ ] The contact form actually delivers — send one and check the inbox
- [ ] Map shows the right place
- [ ] Google Business Profile updated with the new URL
- [ ] `robots.txt` allows indexing, and there is **no leftover `noindex`**
      from the preview — this is the single most common launch-day mistake
- [ ] Submit the sitemap in Google Search Console
- [ ] Both themes still correct on the live domain

> **The `noindex` trap.** Every preview page carries `noindex, nofollow`. If it
> survives to the live site, the site will never appear on Google and the
> client will conclude, reasonably, that they paid for nothing. Sweep for it:
> `grep -rl noindex .` should return nothing on a live build.

---

## Part 4 — Handover

Follow `handover.md`. The short version: transfer the GitHub repo to their
account, confirm the domain and Zoho are in their name, send the credential
list and `LICENCES.md`, and start the care plan if they took one.
