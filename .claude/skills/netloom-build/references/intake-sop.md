# Client intake — the question SOP

**This is a call script, not a form.** Read it out loud with the client on
WhatsApp voice or a phone call. Emailing a 60-question form to a sweet-shop
owner gets you a 4-question answer three weeks later.

Budget 35–45 minutes for Part A + one vertical branch. Take the notes
directly into a copy of this file — the filled copy is the build brief.

---

## Part 0 — Before you dial

Five minutes of homework changes the whole call.

- [ ] Search the business name. Note what already exists: a Google Business
      listing, an Instagram, a Zomato/Practo/JustDial page, an old website.
- [ ] Open their Instagram. **This is usually where all their photos are.**
      Count the usable ones.
- [ ] Check whether the domain they'd want is available.
- [ ] Have a demo open in the right vertical, in the theme you'd pitch.

Open the call with what you found, not with a question list. *"I had a look —
you've got 200 followers on Instagram and some genuinely good food photos,
but if I search 'thali Ballygunge' you're on page three."* That is worth
twenty questions.

---

## Part A — Every business, every tier

### A1 · Identity

| # | Ask | Why | If they don't have it |
|---|---|---|---|
| 1 | What is the exact business name, spelled as you want it printed? | Goes in the logo, the title tag, the JSON-LD and the invoice. Getting it wrong once means fixing it in 40 places. | Stop. This one cannot be a blank. |
| 2 | Is there a tagline or a line you already use? | Hero sub-headline. | We draft three, they pick one. Never invent a claim — a tagline can be evocative, not factual. |
| 3 | What year did you start? | Trust signal, and it's in the JSON-LD. | Leave it out entirely. **Do not estimate.** |
| 4 | Who is the owner and how do you want to be named on the site? | About page, and the "who am I talking to" line. | Use the business name alone. |
| 5 | How would you describe what you do to someone who's never heard of you, in one sentence? | This becomes the meta description and it is the single hardest question to answer well. Let them ramble, then read it back tightened. | Draft from what they said elsewhere in the call. |

### A2 · The commercial goal

Ask these before you talk about pages. The answers decide the tier and
the primary CTA on every page.

| # | Ask | Why |
|---|---|---|
| 6 | If this website works perfectly, what happens? A phone call? A booking? An order? Someone walking in? | This is the **primary conversion**, and the whole site points at it. There is exactly one. Write it down. |
| 7 | What do you lose business to today? | Usually "people can't find our timings" or "they message on Instagram and we miss it". Tells you what the site has to fix. |
| 8 | Who is the customer — age, area, do they read English or Bengali/Hindi? | Decides tone, and whether we need a second language. |
| 9 | Who are two competitors you'd like to look better than? | Look at their sites during the build. Cheap and effective. |
| 10 | How do customers reach you now? | WhatsApp is almost always the honest answer. Then WhatsApp is the primary CTA, not a contact form. |

### A3 · Contact and location

| # | Ask | Needed for |
|---|---|---|
| 11 | Full postal address as it should appear, with pin code | Footer, contact page, JSON-LD, Google Maps embed |
| 12 | Is this a place customers visit, or do you go to them, or is it online only? | Decides whether we show a map at all. A home-run business should **not** publish a home address — ask directly. |
| 13 | Phone number for the website (may differ from personal) | `tel:` links |
| 14 | WhatsApp number — same or different? | Every CTA. Get the country code. |
| 15 | Email for enquiries | Contact form destination |
| 16 | Instagram / Facebook / YouTube handles | Footer, and the photo source |
| 17 | Do you have a Google Business Profile? | If yes we link reviews. If no, **set one up for them** — it is the highest-return 20 minutes in the whole project and it costs us nothing. |

### A4 · Hours

| # | Ask | Notes |
|---|---|---|
| 18 | Opening hours, day by day | The templates show a live "open now / closed" state. Get every day, including the closed one. |
| 19 | Any seasonal or festival changes? | Puja, Eid, Diwali. Note it; the care plan covers updating it. |
| 20 | Last order / last appointment time, if different from closing | Restaurants and clinics always have one and never volunteer it. |

### A5 · Brand and look

| # | Ask | Notes |
|---|---|---|
| 21 | Do you have a logo? Can you send the original file? | Ask for AI/SVG/PDF. A logo pulled off a Facebook cover at 400px will look broken on a phone. If that is all there is, say so now and quote redrawing it. |
| 22 | Are there brand colours you must keep? | Maps onto the template's accent. See the vertical skill for which theme class. |
| 23 | **Show them the demo in dark, then in light. Which feels like you?** | Both ship. Toggle it live on the call — the switch is in the grey Netloom bar at the top. Or send them `<demo-url>?theme=light`. |
| 24 | Anything you've seen and liked? Any site, any industry. | One good reference beats an hour of adjectives. |
| 25 | Anything you definitely do not want? | Cheaper than finding out in round two. |

> **On the theme question:** dark reads premium, evening, considered — it
> suits restaurants, salons, jewellers, bars. Light reads clean, clinical,
> trustworthy, open — it suits clinics, labs, coaching, anything selling
> reassurance. If they cannot decide, ship dark and tell them the switch
> stays in the delivered site.

### A6 · Content

| # | Ask | If they don't have it |
|---|---|---|
| 26 | Your story — how did this start? Two minutes, just talk. | **Record the call** (with permission). This unedited two minutes is the About page. It is always better than anything they will write down. |
| 27 | What do you sell / offer? Full list, with prices. | This is the biggest single content block. If they can only give categories, ship categories and add prices in the care plan. Never invent a price. |
| 28 | Do you have written reviews or testimonials? | **Only real ones, with a real first name.** If none: leave the section out. Do not write fake reviews, and do not use "5.0 ★ from 200 customers" unless the Google profile actually says that. |
| 29 | What do customers ask you over and over? | This is the FAQ page, and it writes itself in five minutes. |
| 30 | Any certifications, licences or registrations to show? | FSSAI, medical council registration, BIS hallmark, GST. Get the actual number. Real credentials are the strongest thing on the page. |
| 31 | Who writes the words — you or us? | If us, price it in. If them, set a date and expect to chase. |

### A7 · Photos

Read `assets.md` before this section.

| # | Ask | Notes |
|---|---|---|
| 32 | How many photos do you have, and where are they? | Instagram, a phone camera roll, a WhatsApp group. Ask them to share the whole folder, not a selection — their selection will be their worst instincts. |
| 33 | Can I have the originals rather than WhatsApp versions? | WhatsApp recompresses to ~100KB. Originals from the camera roll or Google Photos. |
| 34 | Are there people in them, and are those people staff or customers? | A customer's face needs their permission. Ask now. |
| 35 | Do you want to invest in a photographer? | For jewellery, boutique and restaurant this is the difference between a good site and a great one. A half-day local shoot in Kolkata is ₹5,000–₹12,000. Offer it as an option; do not push it. |
| 36 | *(if they have nothing)* Are you happy for us to use licensed stock, clearly of the same category but not of your actual premises? | Get an explicit yes. Some clients hate it, and they are not wrong. |

### A8 · Domain and email

| # | Ask | Notes |
|---|---|---|
| 37 | Do you own a domain? | If yes → Q38. If no → Q40. |
| 38 | Which registrar, and do **you** have the login? | The common disaster: a previous "web guy" holds the domain. If so, start the transfer today — it can take a week and it will block go-live. |
| 39 | Is anything live on it now? | Decides whether go-live is a cutover with downtime risk or a fresh point. |
| 40 | *(no domain)* What would you like it to be? | Check availability live on the call. `.in` for local, `.com` if they'll ever ship outside India. Buy it **in their name, on their card, in their account**. We never own a client's domain. |
| 41 | Do you want email on the domain? | `hello@theirdomain.in`. Zoho Mail is free for one mailbox; we set it up. This alone sells the package to a lot of people. |

### A9 · Legal and compliance

| # | Ask | Applies to |
|---|---|---|
| 42 | Do you have a GST number? | Any store, and our own invoice |
| 43 | *(store only)* What is your return and refund policy, in your words? | A launch blocker — Razorpay will not activate an account without it. See `netloom-store`. |
| 44 | *(store only)* Who ships, how long does it take, and what does it cost? | Shipping policy page |
| 45 | *(clinic)* Registration number and council, for each practitioner | Legally required to display in most Indian states |
| 46 | *(food)* FSSAI licence number | Legally required to display |
| 47 | Do you collect any customer data beyond a name and phone? | Decides whether the privacy page is boilerplate or real |

### A10 · Money and timeline

| # | Ask | Notes |
|---|---|---|
| 48 | Confirm the tier and the price back to them, out loud. | *"So that's the Business pack, ₹24,999 one time, and the ₹1,999 a month care plan is optional — you can start it any time."* No surprises later. |
| 49 | Any deadline? A festival, an opening, a season? | Puja and wedding season are real deadlines in this market. Say yes or no honestly; do not agree to a date you will miss. |
| 50 | Who signs off? Is there a spouse/partner/business partner who will have opinions? | **Get them on the review call.** A silent second decision-maker appearing in round three is how two-round projects become five-round projects. |
| 51 | How do you want to pay? | UPI or bank transfer. 50% to start, 50% before go-live. Invoice with GST. |

---

## Part B — The vertical branch

Run **one** of these after Part A. The full detail is in the vertical skill;
these are the questions to ask on the call.

### B1 · Restaurant / cafe / sweets → `netloom-restaurant`
- The full menu, with prices and section headings. Ask for a photo of the
  physical menu card — it is faster than dictation and it is authoritative.
- Veg / non-veg / Jain markers. Non-negotiable in this market.
- Do you take table bookings? Phone, WhatsApp, or a form?
- Do you deliver? Own delivery, Swiggy, Zomato? Get the links.
- Covers (seats), and do you do private parties or catering?
- One dish you are known for. It becomes the hero.

### B2 · Clinic / healthcare → `netloom-clinic`
- Every practitioner: name, qualification, registration number, specialisation.
- Services, and whether you publish consultation fees. (Many won't. Fine.)
- Appointment method: walk-in, phone, WhatsApp, a form?
- Insurance / TPA accepted?
- Emergency contact behaviour — what should the site say out of hours?
- **Never write medical claims.** Nothing about curing, guaranteeing, or
  outcomes. Describe services, not results.

### B3 · Salon / spa → `netloom-salon`
- Full service menu with starting prices and durations. Ask for the price card.
- Which services need a consultation first?
- Do you do bridal? It is a separate, higher-value page if so.
- Stylists — how many, and do you want them named?
- Walk-ins accepted, or appointment only?
- Product brands you use. Clients recognise them, and it signals tier.

### B4 · Yoga / fitness / coaching → `netloom-yoga`
- The class or batch schedule, by day and time.
- Levels offered, and what a first-timer should book.
- Pricing: drop-in, monthly, quarterly, annual.
- Teachers — names, training lineage, years teaching.
- Trial class? What does it cost? This is usually the primary CTA.
- Capacity per class — decides whether booking needs to cap.

### B5 · Online store → `netloom-store`
- Product count, now and in a year. Under ~50 is fine as a static catalogue.
- Per product: name, price, GST rate, HSN code, stock, variants, one paragraph
  of description, photos.
- **Prices are inclusive of GST** in Indian retail. Confirm this explicitly.
- Razorpay account: do they have one? It is opened in **their** name.
- Shipping: courier, zones, cost, timelines, free-shipping threshold.
- Returns: window, condition, who pays return shipping.
- Who packs and ships? A store is an ongoing operation, not a delivery.

### B6 · Jewellery → `netloom-jewellery`
- Which four pieces should the 3D viewer show?
- Metal purity and hallmarking — BIS, and the actual karat per piece.
- Certification: IGI, GIA, in-house?
- Making charges — how are they quoted, and do you publish them?
- Do you do custom / bridal commissions? Lead time?
- Buy-back or exchange policy.
- **Do not publish live gold rates** unless they will maintain them daily.

### B7 · Boutique / label → `netloom-boutique`
- The weaves or fabrics you work in. This drives the 3D material study.
- Size range, and do you do made-to-measure?
- Do you sell online, or is the site a lookbook that drives to the store?
  (If they sell online, this is `netloom-store` with a boutique skin instead.)
- Collections — how many a year, and are they named?
- Artisan or weaver story, if there is one. This is the whole value.

### B8 · Real estate → `netloom-realestate`
- The project: name, location, RERA registration number, possession date.
- Unit types with carpet area, price and facing.
- Floor plans — do you have them as PDF or CAD?
- Amenities list.
- **RERA number must appear on every page** where a price is shown. This is a
  legal requirement, not a nicety.
- Who takes the enquiry, and how fast do they call back?

---

## Part C — Closing the call

Say all four of these out loud before you hang up.

1. **"Here's what I need from you, and by when."** Name the date. Photos and
   the price list are the two things that always slip.
2. **"You'll see it on a private link before it's live."** Removes the fear
   that they are buying something unseen.
3. **"Two rounds of changes are included."** Say it now, in the call, and put
   it in the WhatsApp summary. Not after round three.
4. **"Nothing is in my name. The domain, the email, the site — all yours,
   and you can walk away with it."** This is the differentiator in a market
   where the last web guy is holding their domain hostage.

Then send a WhatsApp summary within the hour: tier, price, what you need,
the date. Written record, no ambiguity.

---

## Part D — When the answer is "I don't have that"

The default is **leave it out**, not make it up. Specifics:

| Missing | Do this | Never do this |
|---|---|---|
| Logo | Set the name in the template's serif wordmark. It looks deliberate. | Trace a low-res JPEG into something "close enough" |
| Founding year | Omit the stat entirely, drop that column from the stat row | Estimate, or write "est. 20XX" |
| Reviews | Remove the testimonials section and its nav link | Write plausible reviews. This is fabrication and it is the one thing that destroys the pitch. |
| Prices | "On request", with WhatsApp as the CTA | Guess a price |
| Photos of their premises | Licensed stock, of the right category, with the client's explicit consent | Take a competitor's photos. Take anything off Google Images. |
| Staff photos | Skip the team page entirely | Put a stock face under a real person's name |
| A story | Interview them for two minutes and transcribe it | Write a heritage narrative they never told you |
| Hours | Show "Call to confirm" | Invent hours |
| Certifications | Omit | Imply |

> The rule underneath all of these: **the site may be sparse, but every word
> on it must be true.** A thin honest site can be filled in next month. A
> site with an invented claim on it is a problem that arrives later, with a
> customer attached.
