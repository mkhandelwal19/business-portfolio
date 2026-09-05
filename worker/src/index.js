/* netloom-enquiry — contact form transport for netloom.in
   ----------------------------------------------------------------------------
   GitHub Pages serves static files and cannot send mail, so the enquiry form
   needs something server-side. This Worker is that something. It replaces
   Formspree entirely.

   On each submission it opens ONE authenticated SMTP session to Zoho and sends
   two messages, each as multipart/alternative (plain text + HTML):

     1. the enquiry        -> hello@netloom.in, with Reply-To set to the
                              enquirer so hitting reply in the inbox goes
                              straight back to them
     2. an acknowledgement -> the enquirer, genuinely From: hello@netloom.in

   Zoho's free plan permits SMTP (smtp.zoho.in:465), which is what makes the
   second message possible without paying a form backend for an autoresponder.

   Secrets are set with `wrangler secret put`, never committed:
     SMTP_USER   the Zoho account login
     SMTP_PASS   Zoho app-specific password (NOT the account password)
*/

import { connect } from 'cloudflare:sockets';

import {
  b64, encodeHeader, wrap76, esc, oneLine,
  enquiryHtml, enquiryText, ackHtml, ackText
} from './templates.js';

/* ── minimal SMTP client ─────────────────────────────────────────────────── */

class Smtp {
  constructor(socket) {
    this.reader = socket.readable.getReader();
    this.writer = socket.writable.getWriter();
    this.enc = new TextEncoder();
    this.dec = new TextDecoder();
    this.buf = '';
  }

  /* An SMTP reply may span several lines: continuations look like "250-text"
     and only the final line is "250 text". Read until that final line lands. */
  takeComplete() {
    const lines = this.buf.split('\r\n');
    for (let i = 0; i < lines.length - 1; i++) {
      if (/^\d{3} /.test(lines[i])) {
        const resp = lines.slice(0, i + 1).join('\r\n');
        this.buf = lines.slice(i + 1).join('\r\n');
        return resp;
      }
    }
    return null;
  }

  async read() {
    for (;;) {
      const done = this.takeComplete();
      if (done !== null) return done;
      const { value, done: closed } = await this.reader.read();
      if (closed) throw new Error('SMTP connection closed mid-reply');
      this.buf += this.dec.decode(value, { stream: true });
    }
  }

  async write(line) {
    await this.writer.write(this.enc.encode(line + '\r\n'));
  }

  /* `quiet` keeps credentials out of thrown errors, and therefore out of logs. */
  async cmd(line, expect, quiet) {
    await this.write(line);
    const resp = await this.read();
    const code = Number(resp.slice(0, 3));
    if (!expect.includes(code)) {
      const label = quiet ? '<redacted>' : line.split(':')[0];
      throw new Error('SMTP ' + label + ' -> ' + resp.trim().slice(0, 200));
    }
    return resp;
  }
}

/* multipart/alternative: clients that cannot render HTML — and the plain-text
   scrapers that decide whether you look like spam — get the text part. */
function buildMessage({ fromName, from, to, subject, replyTo, text, html }) {
  const boundary = '--=_netloom_' + crypto.randomUUID().replace(/-/g, '');
  const headers = [
    'From: ' + encodeHeader(oneLine(fromName)) + ' <' + from + '>',
    'To: ' + oneLine(to),
    'Subject: ' + encodeHeader(oneLine(subject)),
    'Date: ' + new Date().toUTCString(),
    'Message-ID: <' + crypto.randomUUID() + '@netloom.in>',
    'MIME-Version: 1.0',
    'Content-Type: multipart/alternative; boundary="' + boundary + '"'
  ];
  if (replyTo) headers.splice(3, 0, 'Reply-To: ' + oneLine(replyTo));

  const part = (type, body) =>
    '--' + boundary + '\r\n' +
    'Content-Type: ' + type + '; charset=UTF-8\r\n' +
    'Content-Transfer-Encoding: base64\r\n\r\n' +
    wrap76(b64(body)) + '\r\n';

  return headers.join('\r\n') + '\r\n\r\n' +
         part('text/plain', text) +
         part('text/html', html) +
         '--' + boundary + '--';
}

/* Both messages go over a single session — connecting twice doubles the TLS
   handshake and Zoho's rate accounting for no benefit. */
async function sendAll(env, messages) {
  const socket = connect(
    { hostname: env.SMTP_HOST, port: Number(env.SMTP_PORT) },
    { secureTransport: 'on', allowHalfOpen: false }
  );

  const smtp = new Smtp(socket);
  try {
    await smtp.read();                          // 220 greeting
    await smtp.cmd('EHLO netloom.in', [250]);
    await smtp.cmd('AUTH LOGIN', [334]);
    await smtp.cmd(b64(env.SMTP_USER), [334], true);
    await smtp.cmd(b64(env.SMTP_PASS), [235], true);

    const sent = [];
    for (const msg of messages) {
      try {
        await smtp.cmd('MAIL FROM:<' + env.MAIL_FROM + '>', [250]);
        await smtp.cmd('RCPT TO:<' + msg.to + '>', [250, 251]);
        await smtp.cmd('DATA', [354]);
        await smtp.write(msg.data + '\r\n.');
        const resp = await smtp.read();
        if (!resp.startsWith('250')) throw new Error('DATA -> ' + resp.trim());
        sent.push(msg.label);
      } catch (err) {
        /* One failed recipient must not cost us the other message. */
        console.error('send failed:', msg.label, err.message);
        await smtp.cmd('RSET', [250]).catch(() => {});
      }
    }

    await smtp.write('QUIT');
    return sent;
  } finally {
    try { await socket.close(); } catch { /* already gone */ }
  }
}

/* ── request handling ────────────────────────────────────────────────────── */

function cors(origin, allowed) {
  const ok = allowed.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin : allowed[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers }
  });
}

export default {
  async fetch(request, env) {
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim());
    const origin = request.headers.get('Origin') || '';
    const head = cors(origin, allowed);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: head });
    }
    if (request.method !== 'POST') {
      return json({ error: 'method not allowed' }, 405, head);
    }
    if (!allowed.includes(origin)) {
      return json({ error: 'forbidden' }, 403, head);
    }

    let f;
    try {
      f = await request.json();
    } catch {
      return json({ error: 'bad request' }, 400, head);
    }

    /* Honeypot. Bots fill every field they find; humans never see this one.
       Answer 200 so the bot records a success and does not retry or adapt. */
    if (esc(f._gotcha).trim()) return json({ ok: true }, 200, head);

    const d = {
      name:    oneLine(esc(f.name)),
      email:   oneLine(esc(f.email)),
      city:    oneLine(esc(f.city)),
      phone:   oneLine(esc(f.phone)),
      package: oneLine(esc(f.package)),
      type:    oneLine(esc(f.type)),
      message: esc(f.message).trim()
    };

    if (!d.name || !d.email || !d.city || !d.package || !d.type || !d.message) {
      return json({ error: 'missing required fields' }, 422, head);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) {
      return json({ error: 'invalid email' }, 422, head);
    }

    const enquiry = buildMessage({
      fromName: env.FROM_NAME,
      from:     env.MAIL_FROM,
      to:       env.MAIL_TO,
      replyTo:  d.email,
      subject:  'Netloom enquiry — ' + d.name + ', ' + d.city + ' (' + d.package + ')',
      text:     enquiryText(d),
      html:     enquiryHtml(env, d)
    });

    const ack = buildMessage({
      fromName: env.FROM_NAME,
      from:     env.MAIL_FROM,
      to:       d.email,
      replyTo:  env.MAIL_TO,
      subject:  'Thanks for getting in touch — Netloom',
      text:     ackText(env, d),
      html:     ackHtml(env, d)
    });

    try {
      const sent = await sendAll(env, [
        { label: 'enquiry', to: env.MAIL_TO, data: enquiry },
        { label: 'ack',     to: d.email,     data: ack }
      ]);

      /* The enquiry is the message that must not be lost. If only the
         acknowledgement failed the lead is still safely in the inbox, so the
         visitor should still see success. */
      if (!sent.includes('enquiry')) {
        return json({ error: 'could not send' }, 502, head);
      }
      return json({ ok: true, ack: sent.includes('ack') }, 200, head);
    } catch (err) {
      console.error('smtp session failed:', err.message);
      return json({ error: 'could not send' }, 502, head);
    }
  }
};
