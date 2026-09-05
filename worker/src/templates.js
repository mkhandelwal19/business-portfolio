/* Email templates for netloom-enquiry.
   Pure functions, no Worker runtime imports, so preview.js can render them in
   plain Node. Everything here is table-based with inline styles: Outlook lays
   out with the Word engine, and most clients strip <style> blocks.
*/

/* ── brand ───────────────────────────────────────────────────────────────── */

const BRAND = {
  navy:      '#0A0F1E',
  gold:      '#C9A84C',
  goldSoft:  '#E8C977',
  ivory:     '#F4EFE6',
  paper:     '#FFFFFF',
  wash:      '#F5F2EC',
  ink:       '#1A1D26',
  inkSoft:   '#5A6070',
  rule:      '#E4E0D6'
};

/* Segoe first for Outlook on Windows, then the Apple stack, then Arial. Email
   clients ignore webfonts often enough that shipping one is not worth it. */
const FONT = "'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,'Helvetica Neue',Arial,sans-serif";

/* ── helpers ─────────────────────────────────────────────────────────────── */

/* btoa() works on binary strings, not UTF-8 text, so a name carrying any
   non-Latin character would throw. Encode to bytes first. */
function b64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const byte of bytes) bin += String.fromCharCode(byte);
  return btoa(bin);
}

/* Non-ASCII in a Subject header has to be RFC 2047 encoded or it arrives as
   mojibake. Indian names and the rupee sign both need this. */
function encodeHeader(str) {
  return /^[\x20-\x7E]*$/.test(str) ? str : '=?UTF-8?B?' + b64(str) + '?=';
}

/* Base64 bodies sidestep SMTP line-length limits and dot-stuffing entirely. */
function wrap76(str) {
  return (str.match(/.{1,76}/g) || []).join('\r\n');
}

function esc(value) {
  return String(value == null ? '' : value).slice(0, 4000);
}

/* Header injection: a newline smuggled into a name or subject would let a
   submitter add arbitrary headers (Bcc, for instance). Strip CR and LF. */
function oneLine(str) {
  return str.replace(/[\r\n]+/g, ' ').trim();
}

/* Every submitted value lands inside an HTML document. Escape it. */
function h(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* "MAYANK KHANDELWAL" greeted as "Hi MAYANK KHANDELWAL," reads like shouting.
   Take the first name, and normalise case only when the whole thing is caps —
   otherwise trust what they typed, so McDonald and O'Brien survive. */
function firstName(full) {
  const first = (String(full).trim().split(/\s+/)[0] || '').trim();
  if (!first) return 'there';
  if (first.length > 1 && first === first.toUpperCase()) {
    return first.charAt(0) + first.slice(1).toLowerCase();
  }
  return first;
}

const PACKAGES = {
  starter:  'Starter — ₹12,999',
  business: 'Business — ₹24,999',
  premium:  'Premium — ₹44,999'
};
function packageLabel(key) {
  return PACKAGES[String(key).toLowerCase()] || key;
}

function istStamp() {
  const d = new Date(Date.now() + 5.5 * 3600 * 1000);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return d.getUTCDate() + ' ' + months[d.getUTCMonth()] + ' ' + d.getUTCFullYear() +
         ', ' + hh + ':' + mm + ' IST';
}

/* ── email chrome ────────────────────────────────────────────────────────── */

/* A hidden first line. Inboxes show it beside the subject; without one they
   scrape the first visible text, which is usually the logo alt text. */
function preheader(text) {
  return '<div style="display:none;max-height:0;overflow:hidden;opacity:0;' +
         'mso-hide:all;font-size:1px;line-height:1px;color:' + BRAND.paper + '">' +
         h(text) + '&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;' +
         '&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;</div>';
}

function header(env, eyebrow) {
  return '' +
  '<tr><td style="background-color:' + BRAND.navy + ';padding:26px 32px">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' +
      '<td width="40" style="vertical-align:middle">' +
        '<img src="' + env.LOGO_URL + '" width="40" height="40" alt="Netloom" ' +
             'style="display:block;border:0;border-radius:9px;width:40px;height:40px">' +
      '</td>' +
      '<td style="vertical-align:middle;padding-left:13px">' +
        '<span style="font-family:' + FONT + ';font-size:19px;font-weight:700;' +
              'letter-spacing:-.3px;color:' + BRAND.ivory + '">Netloom' +
          '<span style="color:' + BRAND.gold + '">.</span></span>' +
      '</td>' +
      (eyebrow
        ? '<td align="right" style="vertical-align:middle">' +
            '<span style="font-family:' + FONT + ';font-size:10px;font-weight:700;' +
                  'letter-spacing:1.4px;text-transform:uppercase;color:' + BRAND.gold + '">' +
              h(eyebrow) + '</span></td>'
        : '') +
    '</tr></table>' +
  '</td></tr>' +
  '<tr><td style="height:3px;background-color:' + BRAND.gold + ';font-size:0;line-height:0">&nbsp;</td></tr>';
}

function footer(env, note) {
  return '' +
  '<tr><td style="background-color:' + BRAND.wash + ';padding:26px 32px;border-top:1px solid ' + BRAND.rule + '">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' +
      '<td width="34" style="vertical-align:top">' +
        '<img src="' + env.LOGO_URL + '" width="34" height="34" alt="Netloom" ' +
             'style="display:block;border:0;border-radius:8px;width:34px;height:34px">' +
      '</td>' +
      '<td style="vertical-align:top;padding-left:12px;font-family:' + FONT + ';' +
                 'font-size:12px;line-height:19px;color:' + BRAND.inkSoft + '">' +
        '<strong style="color:' + BRAND.ink + ';font-size:13px">Netloom</strong>' +
        '<span style="color:' + BRAND.gold + '">.</span>' +
        ' &nbsp;Websites for Indian local businesses<br>' +
        'Kolkata, India &nbsp;·&nbsp; ' +
        '<a href="' + env.SITE_URL + '" style="color:' + BRAND.inkSoft + ';text-decoration:underline">netloom.in</a>' +
        ' &nbsp;·&nbsp; ' +
        '<a href="mailto:' + env.MAIL_TO + '" style="color:' + BRAND.inkSoft + ';text-decoration:underline">' +
          env.MAIL_TO + '</a>' +
        (note ? '<br><span style="color:#8A8F9C;font-size:11px">' + h(note) + '</span>' : '') +
      '</td>' +
    '</tr></table>' +
  '</td></tr>';
}

function shell(env, inner) {
  return '' +
  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
         'bgcolor="' + BRAND.wash + '" style="background-color:' + BRAND.wash + ';margin:0;padding:0">' +
    '<tr><td align="center" style="padding:28px 12px">' +
      '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" ' +
             'bgcolor="' + BRAND.paper + '" ' +
             'style="width:600px;max-width:600px;background-color:' + BRAND.paper + ';' +
                    'border:1px solid ' + BRAND.rule + ';border-radius:12px;overflow:hidden">' +
        inner +
      '</table>' +
    '</td></tr>' +
  '</table>';
}

/* A label/value row. Tables, not flexbox — Outlook renders with Word. */
function row(label, value, isLink) {
  const shown = isLink
    ? '<a href="' + isLink + '" style="color:' + BRAND.ink + ';text-decoration:none;border-bottom:1px solid ' + BRAND.gold + '">' + h(value) + '</a>'
    : h(value);
  return '<tr>' +
    '<td style="padding:11px 0;border-bottom:1px solid ' + BRAND.rule + ';font-family:' + FONT + ';' +
               'font-size:11px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;' +
               'color:' + BRAND.inkSoft + ';width:112px;vertical-align:top">' + h(label) + '</td>' +
    '<td style="padding:11px 0;border-bottom:1px solid ' + BRAND.rule + ';font-family:' + FONT + ';' +
               'font-size:15px;line-height:22px;color:' + BRAND.ink + '">' + shown + '</td>' +
  '</tr>';
}

function button(href, label, dark) {
  return '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>' +
    '<td bgcolor="' + (dark ? BRAND.navy : BRAND.gold) + '" ' +
        'style="background-color:' + (dark ? BRAND.navy : BRAND.gold) + ';border-radius:8px">' +
      '<a href="' + href + '" style="display:inline-block;padding:13px 26px;font-family:' + FONT + ';' +
         'font-size:14px;font-weight:700;letter-spacing:.2px;color:' +
         (dark ? BRAND.ivory : BRAND.navy) + ';text-decoration:none">' + h(label) + '</a>' +
    '</td>' +
  '</tr></table>';
}

/* ── templates ───────────────────────────────────────────────────────────── */

function enquiryHtml(env, d) {
  const who = firstName(d.name);
  return '<!doctype html><html><body style="margin:0;padding:0;background-color:' + BRAND.wash + '">' +
    preheader(d.name + ' · ' + d.city + ' · ' + packageLabel(d.package)) +
    shell(env,
      header(env, 'New enquiry') +
      '<tr><td style="padding:30px 32px 6px">' +
        '<h1 style="margin:0 0 4px;font-family:' + FONT + ';font-size:23px;line-height:30px;' +
                   'font-weight:700;letter-spacing:-.3px;color:' + BRAND.ink + '">' + h(d.name) + '</h1>' +
        '<p style="margin:0;font-family:' + FONT + ';font-size:14px;color:' + BRAND.inkSoft + '">' +
          h(d.city) + ' &nbsp;·&nbsp; ' + h(packageLabel(d.package)) + '</p>' +
      '</td></tr>' +
      '<tr><td style="padding:18px 32px 0">' +
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' +
          row('Email', d.email, 'mailto:' + d.email) +
          row('Phone', d.phone || '—', d.phone ? 'tel:' + String(d.phone).replace(/[^0-9+]/g, '') : null) +
          row('City', d.city) +
          row('Business', d.type) +
          row('Package', packageLabel(d.package)) +
        '</table>' +
      '</td></tr>' +
      '<tr><td style="padding:24px 32px 0">' +
        '<div style="font-family:' + FONT + ';font-size:11px;font-weight:700;letter-spacing:.8px;' +
                    'text-transform:uppercase;color:' + BRAND.inkSoft + ';margin-bottom:9px">Message</div>' +
        '<div style="border-left:3px solid ' + BRAND.gold + ';background-color:' + BRAND.wash + ';' +
                    'padding:15px 18px;border-radius:0 8px 8px 0;font-family:' + FONT + ';' +
                    'font-size:15px;line-height:24px;color:' + BRAND.ink + '">' +
          h(d.message).replace(/\n/g, '<br>') +
        '</div>' +
      '</td></tr>' +
      '<tr><td style="padding:26px 32px 30px">' +
        button('mailto:' + d.email + '?subject=' + encodeURIComponent('Re: your enquiry — Netloom'),
               'Reply to ' + who, true) +
      '</td></tr>' +
      footer(env, 'Sent by the netloom.in enquiry form · ' + istStamp())
    ) +
  '</body></html>';
}

function enquiryText(d) {
  return [
    'NEW ENQUIRY FROM NETLOOM.IN',
    '',
    'Name       ' + d.name,
    'Email      ' + d.email,
    'Phone      ' + (d.phone || '—'),
    'City       ' + d.city,
    'Business   ' + d.type,
    'Package    ' + packageLabel(d.package),
    '',
    'MESSAGE',
    '-------',
    d.message,
    '',
    '--',
    'Sent by the netloom.in enquiry form · ' + istStamp(),
    'Reply to this mail to answer ' + d.name + ' directly.'
  ].join('\n');
}

function step(n, title, body) {
  return '<tr>' +
    '<td width="30" style="vertical-align:top;padding:0 0 16px">' +
      '<div style="width:24px;height:24px;border-radius:12px;background-color:' + BRAND.navy + ';' +
                  'font-family:' + FONT + ';font-size:12px;font-weight:700;color:' + BRAND.goldSoft + ';' +
                  'text-align:center;line-height:24px">' + n + '</div>' +
    '</td>' +
    '<td style="vertical-align:top;padding:0 0 16px 12px;font-family:' + FONT + '">' +
      '<div style="font-size:15px;font-weight:700;color:' + BRAND.ink + ';line-height:22px">' + h(title) + '</div>' +
      '<div style="font-size:14px;color:' + BRAND.inkSoft + ';line-height:22px">' + h(body) + '</div>' +
    '</td>' +
  '</tr>';
}

function ackHtml(env, d) {
  const who = firstName(d.name);
  const wa = 'https://wa.me/' + env.WA_NUMBER + '?text=' +
             encodeURIComponent('Hi Mayank, I just sent an enquiry through netloom.in.');
  return '<!doctype html><html><body style="margin:0;padding:0;background-color:' + BRAND.wash + '">' +
    preheader('Your enquiry has reached me — I will reply personally today.') +
    shell(env,
      header(env, null) +
      '<tr><td style="padding:32px 32px 0">' +
        '<h1 style="margin:0 0 14px;font-family:' + FONT + ';font-size:24px;line-height:32px;' +
                   'font-weight:700;letter-spacing:-.3px;color:' + BRAND.ink + '">' +
          'Thanks for getting in touch, ' + h(who) + '.</h1>' +
        '<p style="margin:0 0 14px;font-family:' + FONT + ';font-size:16px;line-height:26px;color:' + BRAND.ink + '">' +
          'Your enquiry has reached me directly &mdash; not a queue, not a ticketing system. ' +
          'I read every one myself and I will reply personally, usually within a few hours ' +
          'and always the same day.' +
        '</p>' +
      '</td></tr>' +
      '<tr><td style="padding:12px 32px 0">' +
        '<div style="font-family:' + FONT + ';font-size:11px;font-weight:700;letter-spacing:.8px;' +
                    'text-transform:uppercase;color:' + BRAND.inkSoft + ';margin-bottom:14px">What happens next</div>' +
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' +
          step(1, 'I read your enquiry properly',
                  'Today. Along with a look at your business and what is already online for it.') +
          step(2, 'You get a real reply',
                  'My initial thinking, an honest view on the package you picked, and a question or two.') +
          step(3, 'You see your homepage before you pay',
                  'If it is a fit, I build the homepage first. No payment until it is in front of you.') +
        '</table>' +
      '</td></tr>' +
      '<tr><td style="padding:8px 32px 0">' +
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
               'style="background-color:' + BRAND.wash + ';border:1px solid ' + BRAND.rule + ';border-radius:10px">' +
          '<tr><td style="padding:18px 20px">' +
            '<div style="font-family:' + FONT + ';font-size:11px;font-weight:700;letter-spacing:.8px;' +
                        'text-transform:uppercase;color:' + BRAND.inkSoft + ';margin-bottom:10px">Your enquiry</div>' +
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
                   'style="font-family:' + FONT + ';font-size:14px;line-height:24px;color:' + BRAND.ink + '">' +
              '<tr><td width="90" style="color:' + BRAND.inkSoft + '">City</td><td>' + h(d.city) + '</td></tr>' +
              '<tr><td style="color:' + BRAND.inkSoft + '">Business</td><td>' + h(d.type) + '</td></tr>' +
              '<tr><td style="color:' + BRAND.inkSoft + '">Package</td><td>' + h(packageLabel(d.package)) + '</td></tr>' +
            '</table>' +
          '</td></tr>' +
        '</table>' +
      '</td></tr>' +
      '<tr><td style="padding:26px 32px 4px">' +
        button(wa, 'Message me on WhatsApp', false) +
      '</td></tr>' +
      '<tr><td style="padding:14px 32px 30px">' +
        '<p style="margin:0;font-family:' + FONT + ';font-size:14px;line-height:23px;color:' + BRAND.inkSoft + '">' +
          'Or simply reply to this email &mdash; it comes straight to me.' +
        '</p>' +
        '<p style="margin:18px 0 0;font-family:' + FONT + ';font-size:15px;line-height:24px;color:' + BRAND.ink + '">' +
          'Mayank Khandelwal<br>' +
          '<span style="color:' + BRAND.inkSoft + ';font-size:14px">Founder, Netloom</span>' +
        '</p>' +
      '</td></tr>' +
      footer(env, 'You are receiving this because you submitted the enquiry form on netloom.in.')
    ) +
  '</body></html>';
}

function ackText(env, d) {
  const who = firstName(d.name);
  return [
    'Hi ' + who + ',',
    '',
    'Thanks for getting in touch. Your enquiry has reached me directly - not a',
    'queue, not a ticketing system. I read every one myself and I will reply',
    'personally, usually within a few hours and always the same day.',
    '',
    'WHAT HAPPENS NEXT',
    '',
    '  1. I read your enquiry properly',
    '     Today. Along with a look at your business and what is already online.',
    '',
    '  2. You get a real reply',
    '     My initial thinking, an honest view on the package you picked, and a',
    '     question or two.',
    '',
    '  3. You see your homepage before you pay',
    '     If it is a fit, I build the homepage first. No payment until it is in',
    '     front of you.',
    '',
    'YOUR ENQUIRY',
    '',
    '  City       ' + d.city,
    '  Business   ' + d.type,
    '  Package    ' + packageLabel(d.package),
    '',
    'Message me on WhatsApp: https://wa.me/' + env.WA_NUMBER,
    'Or simply reply to this email - it comes straight to me.',
    '',
    'Mayank Khandelwal',
    'Founder, Netloom',
    '',
    '--',
    'Netloom - Websites for Indian local businesses',
    'Kolkata, India | ' + env.SITE_URL + ' | ' + env.MAIL_TO,
    'You are receiving this because you submitted the enquiry form on netloom.in.'
  ].join('\n');
}



export {
  BRAND, FONT,
  b64, encodeHeader, wrap76, esc, oneLine, h,
  firstName, packageLabel, istStamp,
  enquiryHtml, enquiryText, ackHtml, ackText
};
