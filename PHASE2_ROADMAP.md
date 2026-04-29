# Phase 2 Roadmap — Admin & Client Customisation Portal

## Vision

Give each client a private login where they can preview, tweak, and approve their website — and give you (Mayank) a central admin panel to manage all leads and live sites. This removes the "WhatsApp back-and-forth" loop for edits and builds perceived value as a premium agency offering.

---

## Architecture Overview

```
Browser
  └── Portfolio site (static, GitHub Pages)
        └── /admin  →  Admin SPA (Vanilla JS or lightweight framework)
        └── /portal →  Client SPA (read + limited write)

Backend
  └── Supabase
        ├── Auth          (email/password + magic link)
        ├── Database      (leads, clients, projects, customisations)
        ├── Storage       (uploaded logos, images)
        └── Edge Functions (server-side form logic, email triggers)
```

---

## Phase 2A — Admin Panel (Internal)

**Goal:** Mayank has a single dashboard to view enquiry leads, manage projects, and make notes.

### Features

| Feature | Detail |
|---|---|
| Secure login | Supabase Auth — email + password. Single admin account. |
| Leads table | All contactForm submissions pulled from Supabase in real time. Name, city, package, business type, date. |
| Lead status | Tag leads: New / Contacted / In Progress / Closed / Lost. |
| WhatsApp quick-send | One-click to open prefilled WhatsApp message for each lead. |
| Project notes | Internal notes per lead (not visible to client). |
| Package filter | Filter table by Starter / Business / Premium. |
| Export CSV | Download leads as CSV for offline use. |

### DB Schema (minimal)

```sql
-- leads (auto-inserted by edge function on form submit)
create table leads (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  name        text,
  city        text,
  email       text,
  phone       text,
  package     text,  -- starter | business | premium
  biz_type    text,
  message     text,
  status      text default 'new'  -- new | contacted | in_progress | closed | lost
);

-- admin_notes
create table admin_notes (
  id       uuid primary key default gen_random_uuid(),
  lead_id  uuid references leads(id) on delete cascade,
  note     text,
  created_at timestamptz default now()
);
```

### Route
- `/admin` — protected by Supabase session check; redirect to `/admin/login` if unauthenticated.

---

## Phase 2B — Client Portal (External)

**Goal:** Each client gets a private link to preview their site and request simple changes — reducing WhatsApp back-and-forth.

### Features

| Feature | Detail |
|---|---|
| Magic-link login | Client receives a one-time login link via email. No password to forget. |
| Site preview | Embedded iframe of their staging subdomain. |
| Customisation panel | Change: brand colour, logo, tagline, phone/WhatsApp number, hero image, menu/price list. |
| Change request log | Client submits a text request; Mayank sees it in the admin panel. |
| Approval sign-off | Client can mark the site "Approved for Launch" — triggers a notification to Mayank. |
| Content uploads | Upload logo and hero image directly; stored in Supabase Storage. |

### DB Schema (additions)

```sql
-- clients (linked to a lead after project kicks off)
create table clients (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid references leads(id),
  user_id    uuid references auth.users(id),  -- Supabase auth
  project_name text,
  staging_url  text,
  live_url     text,
  status       text default 'in_progress'  -- in_progress | review | live
);

-- customisations (key-value store per client)
create table customisations (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid references clients(id) on delete cascade,
  key        text,   -- e.g. 'brand_color', 'tagline', 'phone'
  value      text,
  updated_at timestamptz default now()
);

-- change_requests
create table change_requests (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid references clients(id),
  message    text,
  status     text default 'open',  -- open | done
  created_at timestamptz default now()
);
```

---

## Phase 2C — Site Customisation Engine (Advanced)

**Goal:** Customisations made in the portal are reflected live on the client's site without a redeploy.

### Approach
- Each client site fetches a small JSON config from Supabase at page load.
- CSS custom properties and DOM content are applied from the config.
- Mayank (admin) can push a new config version; client previews it before approving.

```js
// In each client site's <script>
const config = await supabase
  .from('customisations')
  .select('key, value')
  .eq('client_id', CLIENT_ID);

config.data.forEach(({ key, value }) => {
  document.documentElement.style.setProperty(`--${key}`, value);
});
```

---

## Tech Choices & Rationale

| Decision | Choice | Why |
|---|---|---|
| Backend | Supabase | Free tier generous, Postgres, real-time, Auth + Storage built in. No server needed. |
| Auth | Supabase Auth | Magic link for clients (no password UX), email/password for admin. |
| Hosting | GitHub Pages (static) + Supabase Edge Functions | Keeps zero-cost infrastructure. |
| Admin UI | Vanilla JS + shared CSS | No build system, consistent with existing stack. |
| Client UI | Same | Keep it simple — client portal is a single HTML page. |

---

## Rollout Milestones

| Milestone | What ships | Estimate |
|---|---|---|
| 2A-1 | Supabase project + leads table + form auto-insert via edge function | 1 day |
| 2A-2 | `/admin` login page + leads table UI | 2 days |
| 2A-3 | Status tags, WhatsApp quick-send, notes | 1 day |
| 2B-1 | Client auth (magic link) + portal shell | 2 days |
| 2B-2 | Customisation panel (colour, logo, tagline, phone) | 2 days |
| 2B-3 | Change request log + approval sign-off | 1 day |
| 2C-1 | Config JSON fetch + live CSS injection in client sites | 2 days |

**Total Phase 2 estimate: ~11 development days** (can be spread over weekends)

---

## Security Notes

- Admin route must be protected with a Supabase session check server-side (Edge Function middleware) — do not rely on client-side JS alone.
- Client portal: use Row Level Security (RLS) in Supabase so each client can only read/write their own rows.
- Never expose the Supabase service role key in the browser — use the anon key with RLS only.
- File uploads: restrict MIME types to `image/jpeg`, `image/png`, `image/webp`. Set a 2 MB size limit.
- Rate-limit the magic-link endpoint to prevent abuse.

---

## Open Questions (resolve before 2A)

1. Will the admin panel live at `mayank.in/admin` (same repo) or a separate subdomain like `admin.mayank.in`?
2. Should form submissions continue to Formspree as a fallback, or fully migrate to Supabase?
3. Custom domains for client staging: GitHub Pages supports `CNAME` per repo — consider one repo per client site.
