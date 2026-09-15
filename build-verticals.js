#!/usr/bin/env node
/* build-verticals.js — generate the industry landing pages.

   These exist because the marketing site targets no phrase anyone types. The
   five SPA routes are about Netloom; these are about the thing a restaurant
   owner actually searches for at 11pm.

   Each page is a real document at its own URL, NOT another SPA view — the
   whole point is that /website-design-for-restaurants/ is about restaurants
   and nothing else.

   The content is lifted from the per-vertical SKILL.md files under
   .claude/skills/, which is what keeps these from being doorway pages: a page
   that only swaps the noun is a
   named Google spam violation, and rightly so. Every one of these carries the
   compliance rule and the conversion insight for its trade, which is knowledge
   a generic web shop does not have.

   Run:  node build-verticals.js
*/
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = __dirname;
const ORIGIN = 'https://netloom.in';

/* Prices live in one place. index.html carries the same three; if they diverge
   the site contradicts itself, which it has done before. */
const TIERS = [
  { name: 'Starter',  price: '₹14,999', note: 'A presence that works: home, menu or services, about, contact.' },
  { name: 'Business', price: '₹24,999', note: 'Adds gallery, testimonials, FAQ and the booking or enquiry flow.', mid: true },
  { name: 'Premium',  price: '₹44,999', note: 'The full build, or a store that takes money on the site.' }
];

const VERTICALS = [
  {
    slug: 'website-design-for-restaurants',
    nav: 'Restaurants',
    title: 'Website Design for Restaurants & Cafes in India',
    desc: 'Websites for Indian restaurants, cafes, thali houses, bakeries and cloud kitchens. Menu-first, WhatsApp-ready, FSSAI-compliant. Fixed pricing from ₹14,999.',
    h1: 'Websites for restaurants, cafes and <em>cloud kitchens</em>',
    lede: 'A restaurant website has one job before it has any other. Most of them get it wrong, and it is not a design problem.',
    insight: {
      h: 'People come to read the menu and find out if you are open',
      p: `That is it. That is the whole visit, for the overwhelming majority of people who land on a restaurant site. They are hungry, they are deciding between you and two others, and they are on a phone.<br><br>So the menu is <strong>one tap from anywhere</strong> on the site, and the opening hours are exact — not "open daily", but the actual times, including the afternoon break. A beautiful site where the menu is a downloadable PDF has failed. We have seen that PDF cost more bookings than a bad logo ever did.`
    },
    truths: [
      { h: 'Veg, non-veg, Jain and egg markers are not optional', p: 'In this market they decide whether someone orders at all. If the physical menu card does not mark them, that is a conversation to have before the site goes live, not after.' },
      { h: 'The dish people order twice becomes the hero', p: 'Not the most expensive one, and not "everything". One photograph of the thing regulars come back for does more than a gallery of twelve.' },
      { h: 'Real photos beat stock, every time', p: 'Customers are checking whether the place looks like somewhere they want to sit. Stock food photography reads as a chain, and reads as hiding something.' },
      { h: 'Swiggy and Zomato links belong on the site', p: 'Sending someone to an aggregator looks like a loss, but the alternative is them searching for you there anyway and finding a competitor first.' }
    ],
    compliance: {
      h: 'FSSAI licence number',
      p: 'Your FSSAI licence number has to be on display, and the website counts. We put it in the footer of every page as standard. It costs nothing, it is legally required, and a customer who looks for it and finds it trusts the rest of the page more.'
    },
    includes: [
      ['Menu that works on a phone', 'Sectioned, priced, marked, and readable without pinching.'],
      ['Exact opening hours', 'Including the break between lunch and dinner, which most sites omit.'],
      ['Table booking or WhatsApp', 'Whichever you actually answer. One of them, done properly.'],
      ['Google Business Profile', 'Set up and connected, so you appear on Maps when someone searches nearby.']
    ],
    demos: [
      { k: 'Live demo', href: '/restaurant/', t: 'Aangan Thali House', d: 'Nine pages, fully working. Open the menu on your phone.' },
      { k: 'How it is built', href: '/projects/restaurant.html', t: 'Restaurant template', d: 'The page map, and what sits in each tier.' }
    ],
    faqs: [
      { q: 'Our menu changes every day. Can the website keep up?', a: 'Yes. A daily board is a normal thing to build for — a section you send us on WhatsApp each morning, or that you edit yourself. Seasonal and festival menus work the same way. What does not work is a PDF that gets replaced once a year.' },
      { q: 'Do we need a booking system?', a: 'Usually not. Most restaurants of this size take bookings by phone or WhatsApp and answer them faster than any form. We build the booking flow you will actually use. If you genuinely hold tables and need a form with times, that is the Premium tier.' },
      { q: 'We are only on Swiggy and Zomato. Do we need a website at all?', a: 'The aggregators own your customer relationship and take a cut of every order. A website does not replace them — it means someone searching your name finds you, sees your full menu at your prices, and can order directly. The two work together.' }
    ]
  },

  {
    slug: 'website-design-for-clinics',
    nav: 'Clinics',
    title: 'Website Design for Clinics, Dentists & Doctors in India',
    desc: 'Websites for Indian clinics, dental practices, physiotherapists and diagnostic labs. Registration numbers displayed, appointment-ready, compliant with medical advertising rules.',
    h1: 'Websites for clinics, dentists and <em>diagnostic labs</em>',
    lede: 'A patient looking at your website is asking one question, and it is not about your equipment.',
    insight: {
      h: 'They are checking whether you are real, and whether you are qualified',
      p: `Someone choosing a clinic is making a decision with more at stake than choosing a restaurant, and they are doing it from a search result with no idea who you are.<br><br>The single strongest thing you can put on the page is <strong>each practitioner's name, qualification and medical council registration number</strong>. It is required anyway. It is also the most convincing sentence on the whole site, and most clinic websites leave it off.`
    },
    truths: [
      { h: 'Registration numbers are a trust signal, not red tape', p: 'Name, qualification as they want it written, council registration number, years in practice. A patient who can verify you will choose you over a clinic that only shows a stock photo of a stethoscope.' },
      { h: 'Hours and directions matter more than the about page', p: 'Someone is deciding whether they can get to you today. Exact timings per practitioner, a working map link, and parking if there is any.' },
      { h: 'No outcome claims, no before-and-afters where they are restricted', p: 'Medical advertising rules in India are stricter than most web shops know. We write around them rather than build something that has to come down.' },
      { h: 'The appointment flow should match how you actually work', p: 'Most clinics run on a phone and a register. A form that promises a slot you cannot honour is worse than a clearly displayed number.' }
    ],
    compliance: {
      h: 'Medical council registration and advertising rules',
      p: 'Every practitioner listed carries their council registration number. We also keep the copy inside what the advertising codes permit — no guaranteed outcomes, no comparative claims about other practitioners, and care with testimonials and imagery. This is the part of a clinic site that gets studios in trouble, and it is easier to write correctly the first time than to strip out later.'
    },
    includes: [
      ['Practitioner profiles', 'Name, qualification, registration number, specialisation, availability.'],
      ['Services and conditions', 'What you treat, written so a patient recognises their own problem.'],
      ['Appointment flow', 'Phone, WhatsApp or form — whichever you answer reliably.'],
      ['Maps and exact hours', 'Per practitioner where they differ, which they usually do.']
    ],
    demos: [
      { k: 'Live demo', href: '/healthcare/', t: 'Basu Clinic', d: 'Nine pages, with practitioner profiles and an appointment flow.' },
      { k: 'How it is built', href: '/projects/healthcare.html', t: 'Healthcare template', d: 'The page map, and what sits in each tier.' }
    ],
    faqs: [
      { q: 'Can we show patient testimonials?', a: 'Carefully, and sometimes not at all depending on your speciality. Indian medical advertising codes restrict testimonials and outcome claims more than most people expect. We will tell you plainly what is safe for your practice rather than build something that has to be removed.' },
      { q: 'We have four doctors with different timings. Can the site handle that?', a: 'Yes, and it should — it is one of the most common reasons a patient calls. Each practitioner gets their own availability, and the site shows who is in on a given day rather than one blanket set of hours.' },
      { q: 'Do we need online appointment booking?', a: 'Only if you will honour it. Most clinics run on a phone and a register, and a form that issues slots nobody is watching creates angry patients. We build the flow that matches how your front desk actually works.' }
    ]
  },

  {
    slug: 'website-design-for-salons',
    nav: 'Salons',
    title: 'Website Design for Salons, Spas & Beauty Parlours in India',
    desc: 'Websites for Indian salons, spas, barbers and makeup artists. Full price list, bridal packages, booking-ready. Fixed pricing from ₹14,999.',
    h1: 'Websites for salons, spas and <em>beauty parlours</em>',
    lede: 'There is one reason people open a salon website, and most salon websites refuse to answer it.',
    insight: {
      h: 'They came to find out what it costs',
      p: `Not to admire the design. Someone is deciding between three salons at eleven at night, and they are not going to ring any of them to ask the price of a haircut.<br><br>A salon that <strong>publishes its price list beats one that says "call for pricing"</strong>, every time, and it is not close. The service menu is the page that carries the whole site: every service, a starting price, and how long it takes.`
    },
    truths: [
      { h: 'Starting prices are enough — you do not need exact ones', p: '"Haircut from ₹400" answers the question without committing you on a client whose hair takes two hours. "Call for pricing" answers nothing and loses the booking.' },
      { h: 'Duration matters as much as price', p: 'People are fitting you into a day. A service list that says how long each thing takes gets booked more than one that does not.' },
      { h: 'Bridal is a different business on the same site', p: 'Bridal packages carry a different price bracket, a different decision timeline and usually a different decision-maker. It deserves its own page, not a line in the price list.' },
      { h: 'Your own work, not stock models', p: 'Prospective clients are judging whether your work looks like what they want. Stock photography of a model in a studio tells them nothing about you.' }
    ],
    compliance: {
      h: 'What you can and cannot claim',
      p: 'Treatment claims — permanent results, guaranteed fairness, medical-sounding outcomes — are a genuine risk in this trade, and the ones that sound most persuasive are usually the ones you cannot make. We write the service list so it sells on specificity and price rather than on promises nobody can keep.'
    },
    includes: [
      ['The full service menu', 'Every service, starting price, duration. The page that does the work.'],
      ['Bridal and packages', 'Its own page, because it is its own decision.'],
      ['Booking or WhatsApp', 'Whichever you answer. Most salons are faster on WhatsApp.'],
      ['Your real work', 'A gallery of what you have actually done, shot on a phone if need be.']
    ],
    demos: [
      { k: 'Live demo', href: '/salon/', t: 'Studio Indu', d: 'Nine pages, with a full priced service menu.' },
      { k: 'How it is built', href: '/projects/salon.html', t: 'Salon template', d: 'The page map, and what sits in each tier.' }
    ],
    faqs: [
      { q: 'We do not want to publish prices. Competitors will see them.', a: 'They already know. Competitors can walk in, or ring and ask, and they do. The person your hidden price list actually stops is the customer deciding at eleven at night — and she picks the salon that told her.' },
      { q: 'Our prices change. Will the site be wrong?', a: 'Starting prices change slowly. Send us the new list on WhatsApp and it is updated the same day during your support period. That is far less work than the phone calls a missing price list generates.' },
      { q: 'Can clients book and pay online?', a: 'Booking, yes. Taking payment upfront is possible but rarely worth it for a salon — no-shows are better handled by a confirmation message than by holding someone money. If you do want payments, that is the store build.' }
    ]
  },

  {
    slug: 'website-design-for-yoga-studios',
    nav: 'Yoga & fitness',
    title: 'Website Design for Yoga Studios, Gyms & Fitness in India',
    desc: 'Websites for Indian yoga studios, pilates, gyms, dance schools and coaching centres. Class schedule, trial-class booking, teacher credentials.',
    h1: 'Websites for yoga studios, gyms and <em>fitness classes</em>',
    lede: 'Nobody commits to a year of anything from a website. Knowing that changes what the site should be.',
    insight: {
      h: 'The conversion is the trial class, not the membership',
      p: `Someone on your site is not deciding whether to join. They are deciding whether to <strong>turn up once</strong>. Those are completely different questions, and a site built to sell annual memberships answers neither.<br><br>So the trial is the primary action on every page, and the schedule has to answer two things in the first screen: <strong>when are the classes, and which one should a beginner book?</strong>`
    },
    truths: [
      { h: 'A beginner does not know which class to pick', p: 'A schedule listing Ashtanga, Vinyasa and Iyengar means nothing to someone who has never been. Say which one to start with, in words, and the trial booking doubles.' },
      { h: 'The timetable is the most-visited page', p: 'Existing members check it constantly. If it is a photograph of a printed sheet, they will ask you on WhatsApp instead, forever.' },
      { h: 'Teacher credentials carry more weight than the room', p: 'Where they trained, how long they have taught, what they specialise in. People are choosing a person, not a floor.' },
      { h: 'Health claims are a trap', p: 'Curing conditions, guaranteed weight loss, therapeutic promises — all of it is risk, and none of it is needed. Specific beats miraculous.' }
    ],
    compliance: {
      h: 'Health and outcome claims',
      p: 'Claims about curing conditions or guaranteed results are both a legal risk and, in practice, less persuasive than a clear schedule and an honest description of a beginner class. We keep the copy on the side of what you actually do.'
    },
    includes: [
      ['Class schedule', 'By day and time, with the level named in plain words.'],
      ['Trial-class booking', 'The primary action on every page of the site.'],
      ['Teacher profiles', 'Training, years teaching, what they are known for.'],
      ['Pricing and passes', 'Drop-in, monthly, annual — stated, not hidden behind an enquiry.']
    ],
    demos: [
      { k: 'Live demo', href: '/yoga/', t: 'Ananta Yoga', d: 'Nine pages, built around the schedule and the trial class.' },
      { k: 'How it is built', href: '/projects/yoga.html', t: 'Yoga template', d: 'The page map, and what sits in each tier.' }
    ],
    faqs: [
      { q: 'Our schedule changes every month. Is that a problem?', a: 'No, it is the normal case. The schedule is built to be edited — send the new timetable and it is updated, or we can put you on a simple CMS if you would rather do it yourself. What does not work is a photo of a printed sheet.' },
      { q: 'Can people pay for memberships on the site?', a: 'Yes, but consider whether you want to. Most studios convert better by getting someone into a free or cheap trial and selling the membership in person. If you do want online payments, that is the store build with a payment gateway in your name.' },
      { q: 'We run a gym, not a yoga studio. Does this still apply?', a: 'Almost entirely. Gyms, pilates, dance schools, martial arts and coaching centres all sell the same thing: a schedule, a first session, and the person teaching it. The template is the same and the copy changes.' }
    ]
  },

  {
    slug: 'website-design-for-boutiques',
    nav: 'Boutiques',
    title: 'Website Design for Boutiques, Labels & Saree Houses in India',
    desc: 'Websites for Indian boutiques, designer labels, saree houses and handloom studios. Lookbook-first, made-to-measure enquiries, the weave story told properly.',
    h1: 'Websites for boutiques, labels and <em>saree houses</em>',
    lede: 'There is a question to settle before a single page is designed, and it decides the entire build.',
    insight: {
      h: 'Do you sell online, or does the site get people into the shop?',
      p: `These are two different websites and it is worth being honest about which one you want.<br><br>If the site <strong>sells</strong>, you need a cart, checkout, GST invoicing, returns and a payment gateway in your name — that is the store build. If the site is a <strong>lookbook</strong>, its job is to make the cloth desirable and move someone into the shop or a WhatsApp conversation. Most boutiques want the second and get sold the first.`
    },
    truths: [
      { h: 'The weaver and the craft carry the value', p: 'Where the cloth comes from, who wove it, how long it took, what the motif means. This is what separates a boutique from a rack, and it is what almost no boutique website says.' },
      { h: 'Made-to-measure needs a real enquiry flow', p: 'If you alter or make to order, the site has to capture measurements and timelines properly, or every enquiry becomes six WhatsApp messages.' },
      { h: 'Fabric photographs badly on a phone in a shop', p: 'Drape, weight and true colour need daylight and a plain wall. This is worth one afternoon of doing properly, and it is the single biggest lever on a boutique site.' },
      { h: 'Sizing honesty prevents returns', p: 'Actual measurements, not just S/M/L. It reads as confidence and it saves the conversation later.' }
    ],
    compliance: {
      h: 'If you take money, four legal pages become mandatory',
      p: 'The moment a site transacts, Indian rules require terms and conditions, a privacy policy, a refund and cancellation policy and a shipping policy — and your payment gateway will check for them before approving the account. If you only want a lookbook, none of this applies, which is one more reason to settle the question first.'
    },
    includes: [
      ['A lookbook that does the cloth justice', 'Large imagery, proper drape, true colour.'],
      ['The weave and the maker', 'The story that justifies the price.'],
      ['Made-to-measure enquiry', 'Measurements and timeline captured once, properly.'],
      ['WhatsApp as the counter', 'Where the actual conversation happens.']
    ],
    demos: [
      { k: 'Live demo', href: '/boutique-lux/', t: 'Boutique flagship', d: 'A single page built around fabric and drape, with 3D.' },
      { k: 'How it is built', href: '/projects/boutique.html', t: 'Boutique template', d: 'What is swappable, and what needs real work.' }
    ],
    faqs: [
      { q: 'Should we sell online or not?', a: 'Ask what you want to happen after someone finds you. If the answer is "they come to the shop and we show them things", a lookbook converts better and costs less to run. If you are genuinely shipping orders and have the stock discipline for it, the store build is the right one. We will say which we think fits after seeing your stock.' },
      { q: 'We have hundreds of pieces. Do they all go on the site?', a: 'No. A lookbook works by editing. Twenty pieces photographed well will sell more than three hundred shot badly, and a catalogue you cannot keep current does more harm than a small one you can.' },
      { q: 'Can you photograph the clothes?', a: 'We are a web studio, not a photography one, so we do not shoot for you — but we will give you the exact shot list, the lighting conditions and the framing that works, and most owners get usable results on a phone in an afternoon.' }
    ]
  },

  {
    slug: 'website-design-for-jewellers',
    nav: 'Jewellers',
    title: 'Website Design for Jewellers & Goldsmiths in India',
    desc: 'Websites for Indian jewellers, goldsmiths, bridal jewellery and diamond houses. BIS hallmarking shown properly, purity per piece, no gold-rate trap.',
    h1: 'Websites for jewellers and <em>goldsmiths</em>',
    lede: 'In this trade the website is not selling jewellery. It is selling the reason to walk into your shop rather than a chain store.',
    insight: {
      h: 'Trust is the product, and hallmarking is how you prove it',
      p: `A customer choosing a jeweller is weighing one risk above all others: am I getting the purity I am paying for? The chains have spent enormous sums answering that question. An independent jeweller answers it with <strong>BIS hallmarking and purity stated per piece</strong> — and then, usually, forgets to put it on the website.<br><br>Metal purity on every piece, hallmarking shown plainly, certification for stones. That is the site.`
    },
    truths: [
      { h: 'Never publish a live gold rate you cannot maintain', p: 'It is the most requested feature and the most dangerous one. A stale rate on your website is a customer arguing at your counter. Link to a source or leave it off — do not hand-maintain a number that moves daily.' },
      { h: 'Purity belongs on the piece, not in a footnote', p: '18K, 22K, 24K, per item. A catalogue where purity is a general statement reads as evasive, whether or not it is.' },
      { h: 'Making charges are the question nobody publishes', p: 'You do not have to give a number. Saying how they are calculated — per gram, percentage, flat — removes the fear that stops people enquiring.' },
      { h: 'Bridal runs on a different timeline', p: 'Months, not minutes, and usually several people deciding. Lead times per piece matter more than a buy button.' }
    ],
    compliance: {
      h: 'BIS hallmarking',
      p: 'Hallmarking is mandatory for gold jewellery in the categories it covers, and customers increasingly know to look for it. We show the HUID and purity alongside the piece rather than burying it in a general trust statement, because a specific mark on a specific item is the thing that actually reassures.'
    },
    includes: [
      ['Pieces with purity and certification', 'Per item, stated, not generalised.'],
      ['Hallmarking shown properly', 'Where a customer will actually look for it.'],
      ['Lead times for made-to-order', 'Especially bridal, where it is the real question.'],
      ['Enquiry, not checkout', 'High-value pieces sell in person. The site books the visit.']
    ],
    demos: [
      { k: 'Live demo', href: '/jewellery-lux/', t: 'Jewellery flagship', d: 'A single page with 3D pieces, purity and certification.' },
      { k: 'How it is built', href: '/projects/jewellery.html', t: 'Jewellery template', d: 'The data shape, and what needs real 3D work.' }
    ],
    faqs: [
      { q: 'Can we show the live gold rate?', a: 'We would advise against hand-maintaining one. A rate that is a day old is worse than no rate, because a customer arrives expecting it. If you want one, it should pull from a source automatically or link out to one — never be a number someone has to remember to update.' },
      { q: 'Should customers be able to buy online?', a: 'Rarely worth it at this value. People buying gold want to see and weigh it. The site earns its money by getting a qualified person into the shop with a specific piece in mind, which is a much easier thing to build and to trust.' },
      { q: 'We make to order. How does that work on a website?', a: 'Each piece carries an indicative lead time, and the enquiry captures what they want, for when. Bridal especially — someone planning a wedding needs to know if eight weeks is realistic, and that answer on the page saves a dozen calls.' }
    ]
  },

  {
    slug: 'website-design-for-real-estate',
    nav: 'Real estate',
    title: 'Website Design for Builders, Developers & Property Brokers in India',
    desc: 'Websites for Indian builders, developers and property brokers. RERA-compliant on every page showing a price, carpet area stated honestly, enquiry flow that qualifies.',
    h1: 'Websites for builders, developers and <em>property brokers</em>',
    lede: 'This is the one vertical where getting the website wrong is not a marketing problem. It is a legal one.',
    insight: {
      h: 'The RERA number goes on every page that shows a price',
      p: `Not the homepage. Not a compliance page nobody visits. <strong>Every page that advertises a project or shows a price</strong>, which in practice means most of the site.<br><br>This is a legal requirement, not a best practice, and a website is advertising. It is also the first thing a serious buyer checks, so the page that carries it properly is the page that gets the enquiry.`
    },
    truths: [
      { h: 'Carpet area, not super built-up', p: 'RERA defines carpet area and requires it. A site quoting super built-up because it sounds bigger is both non-compliant and the fastest way to lose a buyer who knows the difference — and they increasingly do.' },
      { h: 'Possession dates are commitments', p: 'Publish the RERA-declared date. An optimistic one on a website is a document someone will hold up later.' },
      { h: 'Floor plans are what people actually came for', p: 'Per unit type, with real dimensions, readable on a phone. Everything else on a project site is secondary to this.' },
      { h: 'The enquiry should qualify, not just collect', p: 'Budget, unit type and timeline asked at the form save an enormous amount of calling. A bare name-and-number field wastes both sides.' }
    ],
    compliance: {
      h: 'RERA — the non-negotiable one',
      p: 'The RERA registration number must appear on every page that advertises the project or shows a price, alongside the authority website. Carpet area must be stated as RERA defines it. Possession dates must match what was declared. We build this in from the start because retrofitting compliance onto a finished property site means rewriting most of it.'
    },
    includes: [
      ['RERA number on every project page', 'With the authority link, as required.'],
      ['Floor plans per unit type', 'Real dimensions, carpet area, readable on a phone.'],
      ['Location and connectivity', 'What is actually nearby, measured honestly.'],
      ['Qualifying enquiry form', 'Budget, unit type, timeline — so your calls are worth making.']
    ],
    demos: [
      { k: 'Live demo', href: '/realestate-lux/', t: 'Real estate flagship', d: 'A single page with 3D massing, floor plans and unit data.' },
      { k: 'How it is built', href: '/projects/realestate.html', t: 'Real estate template', d: 'The units data shape, and the RERA rules that shape it.' }
    ],
    faqs: [
      { q: 'Our project is not RERA registered yet. Can we still have a site?', a: 'You can have a site. You cannot advertise or market the project, including on a website, until it is registered — that is the rule, and the penalties are real. We will build everything that does not constitute project marketing and switch the rest on when your number comes through.' },
      { q: 'Can we show super built-up area instead? It sounds better.', a: 'No. RERA requires carpet area and defines how it is measured. Beyond the legal problem, buyers now ask for carpet area specifically, so a site quoting super built-up signals either ignorance or evasion.' },
      { q: 'We are brokers, not builders. Does RERA apply to us?', a: 'Agents have their own registration requirement and it also has to be displayed. The rules differ from a developer, so tell us which you are at the start and the site is built to the right set.' }
    ]
  },

  {
    slug: 'ecommerce-website-development',
    nav: 'Online stores',
    title: 'E-Commerce Website Development in India',
    desc: 'E-commerce websites for Indian businesses. Razorpay in your name, GST invoicing, the four mandatory legal pages, and honest talk about what running a store costs.',
    h1: 'E-commerce websites for <em>Indian businesses</em>',
    lede: 'Taking money on a website is a different undertaking from having one. Most of the difference is invisible until it goes wrong.',
    insight: {
      h: 'A store is not a website with a buy button',
      p: `The moment you transact, you acquire obligations: <strong>GST-correct invoicing, four legally required policy pages, a payment gateway registered in your name, and an ongoing responsibility</strong> for orders that fail at two in the morning.<br><br>None of that is a reason not to do it. It is a reason to be told about it before you start, rather than after your gateway application is rejected.`
    },
    truths: [
      { h: 'Everything is registered in your name, not ours', p: 'Razorpay, the database, the domain. If a studio sets up a gateway under their own account, your money flows through someone else and you cannot leave. We will not do that, and you should not accept it from anyone.' },
      { h: 'GST arithmetic is done in paise, not rupees', p: 'Floating-point money is how an invoice ends up a rupee off and an accountant ends up unhappy. It sounds like a detail until you are reconciling a month of orders.' },
      { h: 'Four legal pages are mandatory, not optional', p: 'Terms, privacy, refunds and cancellations, shipping. Your gateway will check for them before approving the account, so they are a launch blocker as well as a legal requirement.' },
      { h: 'A store needs a retainer, and anyone who says otherwise is guessing', p: 'Payment gateways change APIs, orders fail, stock goes wrong. A store without someone maintaining it is a liability, which is why this tier carries a monthly plan.' }
    ],
    compliance: {
      h: 'GST, invoicing and the four policy pages',
      p: 'Invoices have to carry the right GST treatment and the right numbers, computed without rounding drift. Terms, privacy, refunds and cancellations, and shipping each have to exist and say something true about how you actually operate — a copied policy naming someone else’s return window is worse than none, because you will be held to it.'
    },
    includes: [
      ['Razorpay in your name', 'Your account, your settlements, your control.'],
      ['GST-correct invoicing', 'Computed in paise, so it reconciles.'],
      ['The four legal pages', 'Written for how you actually operate.'],
      ['Catalogue, cart, checkout', 'Built to be maintained by you, not only by us.']
    ],
    demos: [
      { k: 'Live demo', href: '/commerce/', t: 'The store build', d: 'Twelve pages, catalogue through checkout.' },
      { k: 'How it is built', href: '/projects/ecommerce.html', t: 'Commerce template', d: 'The catalogue shape, and what the tier includes.' }
    ],
    faqs: [
      { q: 'Why not just use Shopify?', a: 'For many businesses you should, and we will say so. Shopify earns its monthly fee if you have a large catalogue, frequent stock changes and staff to run it. A custom store is the better answer when you have a focused range, want no per-sale platform cut, and want the thing to look like you rather than like a theme.' },
      { q: 'What does it cost to run, beyond the build?', a: 'A payment gateway takes roughly 2% per transaction. Hosting for a store of this kind is modest. The real cost is maintenance, which is why the store tier carries a care plan — a store nobody is watching is the one that quietly stops taking orders.' },
      { q: 'Can we start with a simple site and add the shop later?', a: 'Yes, and it is often the right order. Get found first, prove people want to buy, then build the machinery to take their money. Moving from a Business site to a store is a normal upgrade path, not a rebuild.' }
    ]
  }
];

/* ── helpers ───────────────────────────────────────────────────────────── */

function esc (s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* Schema answers must be plain text — the visible copy carries markup. */
function plain (s) {
  return String(s).replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ').trim();
}

const LOGO = '<svg viewBox="0 0 100 100" fill="none" aria-hidden="true">'
  + '<path d="M31 24 L69 76" stroke="#C9A84C" stroke-width="15"/>'
  + '<rect x="17" y="18" width="15" height="64" fill="#F4EFE6"/>'
  + '<rect x="68" y="18" width="15" height="64" fill="#F4EFE6"/>'
  + '<path d="M31 24 L45 43" stroke="#C9A84C" stroke-width="15"/></svg>';

const FAVICON = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'>"
  + "<rect width='100' height='100' rx='22' fill='%230A0F1E'/>"
  + "<path d='M31 24 L69 76' stroke='%23E0A94A' stroke-width='15'/>"
  + "<rect x='17' y='18' width='15' height='64' fill='%23F5F2EC'/>"
  + "<rect x='68' y='18' width='15' height='64' fill='%23F5F2EC'/>"
  + "<path d='M31 24 L45 43' stroke='%23E0A94A' stroke-width='15'/></svg>";

function build (v) {
  const url = `${ORIGIN}/${v.slug}/`;

  const serviceLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: plain(v.title),
    serviceType: 'Website design and development',
    description: v.desc,
    url,
    areaServed: { '@type': 'Country', name: 'India' },
    provider: {
      '@type': 'ProfessionalService',
      name: 'Netloom',
      url: ORIGIN + '/',
      email: 'hello@netloom.in',
      telephone: '+91-82499-92869'
    },
    offers: TIERS.map(t => ({
      '@type': 'Offer',
      name: t.name + ' website',
      price: t.price.replace(/[^0-9]/g, ''),
      priceCurrency: 'INR'
    }))
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: v.faqs.map(f => ({
      '@type': 'Question',
      name: plain(f.q),
      acceptedAnswer: { '@type': 'Answer', text: plain(f.a) }
    }))
  };

  const others = VERTICALS.filter(o => o.slug !== v.slug);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(v.title)} — Netloom</title>
<meta name="description" content="${esc(v.desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index, follow">
<meta name="theme-color" content="#0A0F1E">

<meta property="og:type" content="website">
<meta property="og:locale" content="en_IN">
<meta property="og:site_name" content="Netloom">
<meta property="og:title" content="${esc(v.title)} — Netloom">
<meta property="og:description" content="${esc(v.desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ORIGIN}/og-cover.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(v.title)} — Netloom">
<meta name="twitter:description" content="${esc(v.desc)}">
<meta name="twitter:image" content="${ORIGIN}/og-cover.png">

<link rel="icon" type="image/svg+xml" href="${FAVICON}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;1,500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&family=JetBrains+Mono:wght@400..500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/vertical.css">

<script type="application/ld+json">
${JSON.stringify(serviceLd, null, 2)}
</script>
<script type="application/ld+json">
${JSON.stringify(faqLd, null, 2)}
</script>
<script>
(function () {
  var TOKEN = '21490c8441f148d092cc15ebe8d7c48e';
  if (!TOKEN) return;
  var s = document.createElement('script');
  s.type = 'module';
  s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  s.setAttribute('data-cf-beacon', JSON.stringify({ token: TOKEN }));
  document.head.appendChild(s);
})();
</script>
</head>
<body>

<nav class="nav">
  <a href="/" class="logo" aria-label="Netloom home">${LOGO}<span>Netloom<em>.</em></span></a>
  <ul>
    <li><a href="/work/">Work</a></li>
    <li><a href="/services/">Services</a></li>
    <li><a href="/pricing/">Pricing</a></li>
    <li><a href="/contact/">Contact</a></li>
  </ul>
</nav>

<div class="wrap">

  <section class="hero">
    <p class="crumb"><a href="/">Netloom</a> · ${esc(v.nav)}</p>
    <h1>${v.h1}</h1>
    <p class="lede">${esc(v.lede)}</p>
  </section>

  <section>
    <div class="insight">
      <h2>${esc(v.insight.h)}</h2>
      <p>${v.insight.p}</p>
    </div>
  </section>

  <section>
    <h2>What we have learned building these</h2>
    <p class="sub">The things that decide whether a site in this trade works, which are rarely the things a brochure talks about.</p>
    <ul class="truths">
${v.truths.map((t, i) => `      <li class="truth">
        <span class="n">${String(i + 1).padStart(2, '0')}</span>
        <div><h3>${esc(t.h)}</h3><p>${esc(t.p)}</p></div>
      </li>`).join('\n')}
    </ul>
  </section>

  <section>
    <div class="compliance">
      <h2>${esc(v.compliance.h)}</h2>
      <p>${esc(v.compliance.p)}</p>
    </div>
  </section>

  <section>
    <h2>What the site includes</h2>
    <ul class="includes">
${v.includes.map(i => `      <li><strong>${esc(i[0])}</strong>${esc(i[1])}</li>`).join('\n')}
    </ul>
  </section>

  <section>
    <h2>See one that already works</h2>
    <p class="sub">Built, running, and open right now. Not a screenshot — open it on your phone and use it.</p>
    <div class="demos">
${v.demos.map(d => `      <a class="demo" href="${d.href}">
        <span class="k">${esc(d.k)}</span>
        <strong>${esc(d.t)}</strong>
        <span class="d">${esc(d.d)}</span>
      </a>`).join('\n')}
    </div>
  </section>

  <section>
    <h2>What it costs</h2>
    <p class="sub">Fixed, published, and the same for every trade. You see your homepage before you pay anything.</p>
    <div class="tiers">
${TIERS.map(t => `      <div class="tier${t.mid ? ' mid' : ''}">
        <div class="name">${esc(t.name)}</div>
        <div class="price">${t.price}</div>
        <p>${esc(t.note)}</p>
      </div>`).join('\n')}
    </div>
  </section>

  <section>
    <h2>Questions we get from this trade</h2>
    <div class="faq">
${v.faqs.map(f => `      <details>
        <summary>${esc(f.q)}</summary>
        <div class="a">${esc(f.a)}</div>
      </details>`).join('\n')}
    </div>
  </section>

  <section>
    <div class="cta">
      <h2>Tell us about your business</h2>
      <p>You see your homepage before you pay anything. WhatsApp is fastest.</p>
      <div class="btns">
        <a class="btn btn-primary" href="/contact/">Get a free demo</a>
        <a class="btn btn-ghost" href="https://wa.me/918249992869" target="_blank" rel="noopener">WhatsApp us</a>
      </div>
    </div>
  </section>

  <section>
    <h2>Other trades we build for</h2>
    <div class="related">
${others.map(o => `      <a href="/${o.slug}/">${esc(o.nav)}</a>`).join('\n')}
      <a href="/website-cost-in-india/">What a website costs in India</a>
    </div>
  </section>

</div>

<footer>
  <div class="foot-nav">
    <a href="/">Home</a><a href="/work/">Work</a><a href="/services/">Services</a><a href="/pricing/">Pricing</a><a href="/contact/">Contact</a>
  </div>
  © <span id="y">2026</span> Netloom · Websites for local businesses across India
  <script>document.getElementById('y').textContent = new Date().getFullYear();</script>
</footer>

</body>
</html>
`;
}

/* ── main ──────────────────────────────────────────────────────────────── */

function main () {
  const slugs = VERTICALS.map(v => v.slug);
  if (new Set(slugs).size !== slugs.length) {
    console.error('Duplicate slug — every vertical needs its own URL.');
    process.exit(1);
  }

  VERTICALS.forEach(v => {
    const dir = path.join(ROOT, v.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), build(v), 'utf8');
    console.log(`  ✓ /${v.slug}/`);
  });

  console.log(`\n${VERTICALS.length} industry pages generated.`);
}

module.exports = { VERTICALS, ORIGIN };

if (require.main === module) main();
