# netloom-enquiry — Worker deploy runbook

Replaces Formspree. Receives the contact form POST from netloom.in and sends two
mails over one authenticated Zoho SMTP session:

- the **enquiry** to `hello@netloom.in`, `Reply-To` set to the enquirer
- an **acknowledgement** to the enquirer, genuinely `From: hello@netloom.in`

Cost: ₹0. Cloudflare's free tier allows 100,000 Worker requests a day.

---

## One-time setup

### 1. Zoho app-specific password

Do **not** use your account password. In Zoho Mail:

*Profile icon → My Account → Security → App Passwords → Generate New Password*

Name it `netloom-worker`. Copy the generated password — Zoho shows it once.

> If two-factor auth is off, the account password would technically work. Use an
> app password anyway: it is scoped, revocable on its own, and does not change
> when you rotate your login.

### 2. Cloudflare account

Sign up free at [dash.cloudflare.com](https://dash.cloudflare.com). You do **not**
need to move netloom.in's DNS to Cloudflare — the Worker is reachable on its own
`workers.dev` subdomain, and DNS stays at GoDaddy.

### 3. Deploy

From this directory:

```bash
npm install               # once
npm run login
npm run secret -- SMTP_USER     # hello@netloom.in
npm run secret -- SMTP_PASS     # the app password from step 1
npm run deploy
```

`deploy` prints the live URL, e.g.
`https://netloom-enquiry.<your-subdomain>.workers.dev`.

> **Why `npm run` and not `npx`.** A stale global npx from an old npm 6 sits in
> `%APPDATA%\npm` and shadows the one bundled with Node, failing with
> `npm ERR! cb.apply is not a function`. `npm run` puts `node_modules/.bin` on
> PATH and never invokes npx, so it sidesteps the problem entirely. Deleting
> `%APPDATA%\npm\npx*` would also fix it, but that is a global change; the
> scripts keep the fix local to this project.
>
> Note the `--` in the secret commands — it passes the argument through to
> wrangler rather than to npm.

### 4. Point the form at it

Set `ENQUIRY_ENDPOINT` in `index.html` to that URL, then:

```bash
node build-routes.js
```

Commit and push.

---

## Verifying

```bash
npm run tail          # live logs, in another terminal
```

Then submit the real form at <https://netloom.in/contact/>. Two mails should
arrive: the enquiry in Zoho, the acknowledgement at whatever address you typed.

A direct curl should be **rejected**, because the Origin header is missing:

```bash
curl -i -X POST https://netloom-enquiry.<subdomain>.workers.dev \
  -H 'Content-Type: application/json' -d '{"name":"x"}'
# expect 403 forbidden
```

---

## Notes

- **Origin allowlist.** Only `https://netloom.in` and `https://www.netloom.in`
  may POST. Change `ALLOWED_ORIGINS` in `wrangler.toml` and redeploy if the site
  ever moves.
- **Honeypot.** The form carries a hidden `_gotcha` field. If it arrives filled,
  the Worker returns `200` without sending anything — a bot that gets an error
  retries and adapts, one that gets a success moves on.
- **Partial failure is deliberate.** If the acknowledgement fails but the
  enquiry sends, the visitor still sees success. The lead is what matters; a
  missing thank-you note is not worth showing an error and losing the
  submission.
- **Header injection** is blocked by stripping CR/LF from every field that
  reaches a header.
- **Rotating the password:** `npm run secret -- SMTP_PASS` then
  `npm run deploy`. Revoke the old one in Zoho.
- **Zoho sending limits** apply to the free plan. Ordinary enquiry volume is
  nowhere near them, but a burst of spam getting past the honeypot could be. If
  that ever happens, add a Cloudflare Rate Limiting rule on the Worker route.

## If mail stops arriving

1. `npm run tail` and submit the form — the failing SMTP command is logged.
2. `AUTH` failing means the app password was revoked or regenerated.
3. Everything succeeding but nothing arriving means the problem is DNS, not this
   Worker — see `../ZOHO_EMAIL_SETUP.md` for the record set and how to verify it.
