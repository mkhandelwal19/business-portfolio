# Business email on netloom.in — Zoho Mail setup

Goal: enquiries arrive at **hello@netloom.in** instead of a Gmail address, without
ever showing visitors an inbox that bounces.

The site is already built for this. `window.SITE_CONFIG` near the top of
`index.html` holds:

```js
email        : 'imayank.khandelwal@gmail.com',  // the inbox that works today
workEmail    : 'hello@netloom.in',              // the Zoho address
workEmailLive: false,                           // flip to true at the very end
```

While `workEmailLive` is `false` the whole site keeps showing the Gmail address.
Nothing below changes what visitors see until the last step.

---

## On `info@` vs `hello@`

You asked whether `info@` would be better. My honest read: **`hello@` is the
better fit, and it is what the config is set to** — but the difference is small
and this is a matter of taste, so overrule me freely.

- `hello@` matches the voice already on your site ("your Digital Sathi", "just a
  reply from me"). `info@` is the address of a company that does not want to talk
  to you.
- `info@` is the single most scraped local-part on the web. Spam bots guess it
  first, so it collects noise from day one.
- `info@` reads as a form-letter destination. For a studio whose pitch is
  personal service, that works against you.

You do not have to choose, though. **Zoho's free plan gives each mailbox up to 30
aliases.** Create `hello@netloom.in` as the real mailbox and add `info@` and
`contact@` as aliases on it. All three deliver to the same place, mail sent to
any of them is answered, and the site shows only `hello@`. That is the setup I
would run.

---

## Step 1 — Create the Zoho account

1. Go to **zoho.com/mail** → *Sign Up Now* → **Business Email** (not Personal).
2. Choose the **Forever Free Plan** (5 users, 5 GB each, one domain). It is on
   the pricing page but not always the first option shown — look for the "Free
   Plan" tab at the bottom.
3. Enter **netloom.in** as your existing domain.
4. Pick the data centre when asked. Signing up from India through **zoho.in**
   puts you in the India DC; **zoho.com** puts you in the US DC. **Write down
   which one you got** — every hostname below differs between them, and you
   cannot move a domain between data centres later without recreating it.

---

## Step 2 — Verify the domain

Zoho will show you a verification record. It is one of:

| Type  | Host / Name          | Value                              |
|-------|----------------------|------------------------------------|
| TXT   | `@`                  | `zoho-verification=zb……zmverify.zoho.in` |
| CNAME | the code Zoho shows  | `zmverify.zoho.in`                 |

Add it at whoever hosts DNS for netloom.in (your registrar, unless you moved
nameservers to Cloudflare). Then press **Verify** in Zoho.

> Use the exact string from your own Zoho console. The value is unique per
> domain, and the `.zoho.in` / `.zoho.com` suffix depends on your data centre.

**This does not affect the website.** GitHub Pages serves netloom.in from `A` /
`CNAME` records; mail uses `MX` and `TXT`. They coexist without touching each
other. Do not delete or edit the existing GitHub Pages records.

---

## Step 3 — Create the mailbox and aliases

1. In Zoho, create the first user as **hello@netloom.in**.
2. Then *Mail Settings → Mail Accounts → hello@netloom.in → Email Aliases*, and
   add `info@netloom.in` and `contact@netloom.in`.

---

## Step 4 — MX records (this is what actually routes mail)

Delete any existing MX records for netloom.in first — leftovers from a registrar
default will silently steal mail.

**India DC (zoho.in):**

| Type | Host | Priority | Value          |
|------|------|----------|----------------|
| MX   | `@`  | 10       | `mx.zoho.in`   |
| MX   | `@`  | 20       | `mx2.zoho.in`  |
| MX   | `@`  | 50       | `mx3.zoho.in`  |

**US DC (zoho.com):** identical, but `mx.zoho.com`, `mx2.zoho.com`,
`mx3.zoho.com`.

Zoho's setup wizard prints the correct set for your account — if it disagrees
with the table above, trust the wizard.

---

## Step 5 — SPF, DKIM, DMARC (so you land in inboxes, not spam)

Skipping these is the single most common reason a new business address goes
straight to Gmail's spam folder. Do all three.

**SPF** — TXT record on `@`:

```
v=spf1 include:zoho.in ~all
```

(`include:zoho.com` on the US DC.) If netloom.in already has an SPF record,
**merge** — a domain may only have one. Add `include:zoho.in` to the existing
one rather than creating a second TXT.

**DKIM** — Zoho generates this for you: *Mail Admin → Domains → netloom.in →
Email Configuration → DKIM → Add Selector*. Use selector `zoho`. It gives you a
long public key. Add:

| Type | Host                        | Value                    |
|------|-----------------------------|--------------------------|
| TXT  | `zoho._domainkey`           | `v=DKIM1; k=rsa; p=…`    |

Then press **Verify** in Zoho. The key is long; paste it whole, and if your
registrar's field has a length limit, split it into quoted chunks.

**DMARC** — TXT record on `_dmarc`, start permissive:

```
v=DMARC1; p=none; rua=mailto:hello@netloom.in
```

Once mail has flowed cleanly for a few weeks, tighten `p=none` to
`p=quarantine`.

---

## Step 6 — Point the enquiry form at the new inbox

The website cannot send mail itself — GitHub Pages serves static files only.
The contact form posts to **Formspree**, which then emails you. So the form's
destination lives in Formspree, not in the code.

1. Log in to **formspree.io** → the form with ID `meevwvvd` (it is in
   `index.html`, in the contact form script).
2. **Settings → Notification emails** → change to `hello@netloom.in`.
3. Formspree will send a confirmation link to that address. **You must click it**
   — until you do, the form keeps delivering to the old address.

The form already sets `_replyto` to the enquirer's address and builds a subject
line like `Netloom enquiry — Priya Sharma, Kolkata (business)`, so replying from
Zoho goes straight back to the customer.

---

## Step 7 — Test before you switch the site over

1. From your phone's personal Gmail, send a mail to **hello@netloom.in**. It must
   arrive in Zoho.
2. Reply from Zoho. It must arrive at the Gmail, **not** in its spam folder.
3. Submit the live contact form on netloom.in. The enquiry must reach Zoho.
4. Run the address through **mail-tester.com** — send a mail from Zoho to the
   address it gives you. Aim for 9/10 or better. Anything lower usually means
   SPF or DKIM is not verified yet.

Do not skip step 4. A domain that fails SPF/DKIM will deliver fine to your own
test Gmail and still land in spam for a stranger.

---

## Step 8 — Flip the site over

Only after all four tests pass, in `index.html`:

```js
workEmailLive: true,
```

Then regenerate the route pages so /about, /work, /services, /pricing and
/contact carry the change too:

```bash
node build-routes.js
```

Commit and push. Every mailto link, the address shown on the contact page, and
the footer switch to `hello@netloom.in` in one move. If anything goes wrong, set
it back to `false` and push — that is a one-line rollback.

---

## What still points at Gmail after this

- `index.html` line ~48, the `ProfessionalService` JSON-LD block, has a
  hardcoded `"email"`. Update it by hand when you flip the switch — search for
  `imayank.khandelwal@gmail.com`.
- Your Google Business Profile, Instagram bio, and any outreach templates in
  `outreach/` are outside this repo's control.

## Timing

DNS changes are not instant. Verification usually works within 15–30 minutes;
MX and DKIM can take up to 24 hours to propagate fully, occasionally 48. If Zoho
says "not verified" straight after you add a record, wait an hour before
assuming you typed it wrong. `dig netloom.in MX` (or mxtoolbox.com) shows you
what the world currently sees.
