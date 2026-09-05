#!/usr/bin/env node
/* preview.js — render both email templates to HTML files without sending mail.
   Open the output in a browser to check layout before deploying.

     node preview.js            writes preview/enquiry.html and preview/ack.html

   The templates import nothing from the Workers runtime, which is the whole
   reason they live in their own module.
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { enquiryHtml, enquiryText, ackHtml, ackText } from './src/templates.js';

const dir = path.dirname(fileURLToPath(import.meta.url));

const env = {
  LOGO_URL: 'https://netloom.in/assets/email-logo.png',
  SITE_URL: 'https://netloom.in',
  MAIL_TO:  'hello@netloom.in',
  WA_NUMBER: '918249992869'
};

/* Deliberately awkward sample data: a shouted name to prove the greeting is
   normalised, a multi-line message, and an apostrophe to prove escaping. */
const sample = {
  name:    'MAYANK KHANDELWAL',
  email:   'priya@sharmasweets.in',
  phone:   '+918017482686',
  city:    'Kolkata',
  type:    'Yoga / Wellness / Fitness',
  package: 'starter',
  message: "We're a small studio in Ballygunge running six classes a day.\n\n" +
           "Right now everything happens over WhatsApp and we lose people who " +
           "can't find our timings. I'd like a site that shows the schedule and " +
           "takes bookings."
};

const out = path.join(dir, 'preview');
fs.mkdirSync(out, { recursive: true });

fs.writeFileSync(path.join(out, 'enquiry.html'), enquiryHtml(env, sample), 'utf8');
fs.writeFileSync(path.join(out, 'ack.html'), ackHtml(env, sample), 'utf8');
fs.writeFileSync(path.join(out, 'enquiry.txt'), enquiryText(sample), 'utf8');
fs.writeFileSync(path.join(out, 'ack.txt'), ackText(env, sample), 'utf8');

console.log('wrote preview/enquiry.html, preview/ack.html and the .txt parts');
