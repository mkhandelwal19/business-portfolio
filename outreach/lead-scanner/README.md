# Kolkata Lead Scanner

Finds Kolkata businesses that:
- Have **good Google reviews** (active, established)
- Have **no website or only a Facebook/JustDial page**
- Have **phone numbers** on Google Maps
- Have **emails** scraped from their website (when one exists)

Exports a sorted CSV + JSON you can open in Excel, filter, and start outreaching.

---

## Setup (one-time, 5 minutes)

### Step 1 — Get a Google Places API Key

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (e.g. "LeadScanner")
3. Go to **APIs & Services → Library**
4. Enable **"Places API"**
5. Go to **APIs & Services → Credentials → Create Credentials → API Key**
6. Copy the key

> **Cost:** Google gives $200 free credit/month. A full scan costs ~$20–35. You won't be charged.

### Step 2 — Set your API key

Open [config.js](config.js) and replace line 9:

```js
API_KEY: process.env.GOOGLE_PLACES_KEY || 'YOUR_GOOGLE_PLACES_API_KEY',
```

with your actual key, or set it as an environment variable:

```bash
# Windows (Command Prompt)
set GOOGLE_PLACES_KEY=AIza...yourkey...

# Windows (PowerShell)
$env:GOOGLE_PLACES_KEY = "AIza...yourkey..."
```

### Step 3 — Install dependencies

```bash
cd outreach/lead-scanner
npm install
```

---

## Usage

```bash
# Full scan (all 10 categories × 15 areas — takes ~25 min)
node scanner.js

# Quick test run (4 categories × 3 areas — takes ~3 min)
node scanner.js --quick

# Single category
node scanner.js --category "Restaurant"

# Single area
node scanner.js --area "Behala"

# Skip email extraction (2x faster, phone-only leads)
node scanner.js --no-email

# Combine flags
node scanner.js --category "Salon" --area "Salt Lake" --no-email
```

---

## Output

After the scan, two files appear in this folder:

| File | Description |
|---|---|
| `leads.csv` | Open in Excel — sort by Score, filter by website_type |
| `leads.json` | Full data for programmatic use |

### CSV Columns

| Column | Meaning |
|---|---|
| Score | Higher = better lead. 70+ = hot. 50–69 = warm. 40–49 = cold. |
| Name | Business name |
| Category | Business type |
| Area | Kolkata neighbourhood |
| Address | Full address from Google |
| Phone | Phone number (always public on Maps) |
| Email | Extracted from website (if found) |
| Email Source | Which page the email was found on |
| Website | Their current URL (or blank) |
| Website Type | `none` / `facebook` / `justdial` / `wix` / `own_site` / etc. |
| Rating | Google rating |
| Reviews | Total Google review count |
| Google Maps URL | Direct link to their Maps listing |
| Why Good Lead | Reasons for the score |

---

## Scoring Logic

| Signal | Points |
|---|---|
| No website at all | +50 |
| Facebook/JustDial/Sulekha only | +35 |
| Wix/Blogspot (poor template) | +15 |
| 300+ Google reviews | +30 |
| 100–299 reviews | +20 |
| 50–99 reviews | +10 |
| Rating 4.5+ | +15 |
| Rating 4.0+ | +10 |

**Score 70+** = Business is busy, well-reviewed, and has zero web presence. Ideal.  
**Score 50–69** = Solid lead. Facebook-only or JustDial presence — easy upgrade pitch.  
**Score 40–49** = Decent. Worth a cold email.

---

## Excel Workflow (Recommended)

1. Open `leads.csv` in Excel
2. **Freeze row 1** (View → Freeze Top Row)
3. **Auto-filter** (Ctrl+Shift+L)
4. Filter **Website Type = `none`** → cold-call list
5. Filter **Email ≠ blank** → ready-to-email list
6. Sort by **Score ↓** to see hottest leads first
7. Add a column: "Status" (Not Contacted / Emailed / Called / Meeting / Closed)

---

## Email Templates

See [../targeting-guide.md](../targeting-guide.md) for ready-to-use email templates for each category.

---

## Troubleshooting

**`API key rejected`** — Make sure Places API is enabled in Google Cloud Console, and billing is set up (even if you won't be charged on free tier).

**`ZERO_RESULTS`** — Normal for some query + area combinations. The scanner handles this gracefully.

**Emails not found** — Many Indian business websites don't publish emails (only WhatsApp). In that case, use the phone number to send a WhatsApp message (template in targeting-guide.md).

**Rate limit errors** — Increase `API_DELAY_MS` in config.js from 250 to 500.
