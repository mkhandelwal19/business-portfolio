---
name: netloom-clinic
description: Build a Netloom client site on the healthcare template — clinics, doctors, dentists, physiotherapists, diagnostics labs, pathology and vets. Covers the page map, theme class, content slots, the medical-council registration and advertising rules that apply in India, the appointment flow and the photography constraints. Use after netloom-build has run intake and picked this vertical.
---

# Clinic and healthcare

**Template:** `healthcare/` · **Theme class:** `theme-mint` (`#4DA99A`) ·
**Reference build:** Basu Family Clinic, Salt Lake

Run `netloom-build` first. This file is only what is specific to healthcare.

---

## Pages

| # | File | Tier |
|---|---|---|
| 1 | `index.html` | Starter |
| 2 | `services.html` | Starter |
| 3 | `about.html` | Starter |
| 4 | `contact.html` | Starter |
| 5 | `gallery.html` | Business — facilities, not patients |
| 6 | `testimonials.html` | Business |
| 7 | `faq.html` | Business |
| 8 | `appointments.html` | Premium |
| 9 | `health-tips.html` | Premium |

`assets/photos/healthcare-*.webp` — 27 reference images.

**Consider shipping this one in light mode.** Mint on warm paper reads
clinical, open and trustworthy in a way the dark palette does not. Show the
client both on the call (`?theme=light`) and let them choose, but recommend
light here.

---

## What is different about healthcare

Two things, and both are hard constraints rather than preferences.

**1. What you may say is regulated.** Indian medical advertising rules and
the various state and council codes restrict claims about outcomes,
comparisons between practitioners, and guarantees. This is not a style
question.

- **Never** write about curing, guaranteeing, "100% success", "painless",
  "best doctor in <city>", or before-and-after outcomes.
- **Do** describe services, qualifications, registration numbers, facilities,
  timings and fees.
- If the client insists on a claim you are uneasy about, put it in writing
  that it is their claim, and offer a rewrite. `tiers.md` has the sentence.

**2. Every practitioner's registration must be displayed.** Name,
qualification, and the medical council registration number. Get the actual
number for each one. This is required, and it is also the strongest trust
signal available.

---

## Ask the client

1. **Every practitioner:** full name, qualification as they want it written
   (MBBS, MD, BDS, MPT…), specialisation, **council registration number**,
   years in practice, days and times they are available.
2. Services offered, grouped. Consultation fees — do they publish them?
   Many do not, and that is fine; say "consultation fee on enquiry".
3. **Appointment flow:** walk-in only, phone, WhatsApp, or a form? Is there a
   queue number system?
4. Insurance and TPA — which ones, and is cashless available?
5. **What should the site say out of hours?** A clinic site gets visited at
   2am by someone worried. Give them a clear instruction — nearest emergency
   room, or an on-call number, or plainly "we open at 9am, for emergencies
   call 108".
6. Diagnostics on site? Pharmacy? Home collection?
7. Wheelchair access, parking, lift. Ask specifically — it matters enormously
   to the people it matters to, and nobody thinks to mention it.
8. Languages the staff speak.
9. Do you offer teleconsultation? How is it booked and paid?

---

## Content slots

### Home

| Slot | Guidance | Example |
|---|---|---|
| Eyebrow | Locality + year | `Salt Lake City · Est. 1999` |
| `h1` | Reassurance, not a boast | `Your family's health, in <em>trusted</em> hands.` |
| Sub | Facts that reduce anxiety | `25 years of family medicine. Four specialist doctors. Same-day appointments. WhatsApp consultations for follow-ups.` |
| Stats | Established · Specialists · Patients · Rating | Only real numbers |
| Primary CTA | `Book Appointment` | |
| Features ×6 | What a patient gets | Same-day slots · WhatsApp follow-up · On-site diagnostics · Insurance accepted · Wheelchair access · Evening hours |
| CTA banner | Calm, direct | `Need to see a doctor today?` |

### `services.html`

Group by department or type. Per service: name, one plain-language sentence
of what it involves, duration, and fee or "on enquiry".

Write in the patient's words, not the clinical ones. "Root canal" not
"endodontic therapy" — or both, with the plain one first.

### `about.html`

The practitioner bios live here, since there is no team page. Each one:
photograph (a **real** photograph — see below), name, qualification,
registration number, specialisation, and two sentences about their approach.

### `appointments.html`

The slot grid is a demonstration and does not reserve anything. It must
submit to WhatsApp or email, and the page must say *"we'll confirm your slot
by phone"*. Never imply a confirmed booking.

Add a visible line about what to bring: previous prescriptions, reports,
insurance card, referral.

---

## Photography — the hard constraint

**No patients. Ever.** Not identifiable, not from behind, not "they said it
was fine". Medical confidentiality is not something a WhatsApp permission
covers, and a photograph of someone in a clinic reveals that they were in a
clinic.

**Practitioner photographs must be the actual practitioners.** A stock
portrait under "Dr. A. Sen, Senior Consultant" asserts a professional
identity that does not exist. Five pages were deleted from this repo for
exactly this — see `LICENCES.md` §2. If a doctor will not be photographed,
run the bio without a photo. It looks fine.

What to shoot:
1. Reception and waiting area, empty, in daylight
2. Consultation room, empty and tidy
3. Equipment and diagnostics
4. Exterior with signage
5. Practitioners, individually, if they agree

Stock is acceptable for equipment and generic facility shots. It is not
acceptable for anything a patient would read as "this is your clinic".

---

## Traps

- **Never write a testimonial about a medical outcome**, even a real one.
  "Dr Sen cured my back pain" is an outcome claim on your page. Reviews about
  the experience — waiting time, being listened to, cleanliness — are fine.
- Registration numbers must be right. Check the spelling and the digits twice.
- Emergency behaviour must be on the contact page, above the fold.
- Do not build an online payment for consultations without asking about
  refunds for missed appointments. It is a fight waiting to happen.
- Fee transparency is a competitive advantage in this market. Encourage it.
- Accessibility of the *website* matters more here than anywhere else —
  older patients, larger text, high contrast. Check at 200% zoom.

---

## JSON-LD

```json
{
  "@context": "https://schema.org",
  "@type": "MedicalClinic",
  "name": "<exact name>",
  "medicalSpecialty": ["FamilyPractice"],
  "telephone": "+91-XXXXX-XXXXX",
  "address": { "@type": "PostalAddress", "…": "…" },
  "geo": { "@type": "GeoCoordinates", "latitude": 0, "longitude": 0 },
  "openingHoursSpecification": [],
  "isAcceptingNewPatients": true
}
```

`Dentist`, `Physician`, `DiagnosticLab`, `VeterinaryCare` where they fit.
Do **not** add `aggregateRating` unless it comes from a real review source.
