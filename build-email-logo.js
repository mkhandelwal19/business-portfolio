#!/usr/bin/env node
/* build-email-logo.js — rasterise the Netloom mark to PNG for use in email.

   The site's logo is inline SVG. Every major email client strips SVG, so the
   transactional templates need a raster copy. Rather than add an image library
   for one 240px square, this draws the same geometry directly: two ivory stems
   and a gold diagonal thread, 4x supersampled for clean edges, on the brand
   navy tile so it reads on both light and dark email backgrounds.

   Run after changing the logo:  node build-email-logo.js
   Output: assets/email-logo.png  (served at https://netloom.in/assets/email-logo.png)
*/
'use strict';

const fs   = require('fs');
const zlib = require('zlib');
const path = require('path');

const SIZE = 240;   // final pixels
const SS   = 4;     // supersample factor
const W     = SIZE * SS;

/* Brand tokens, lifted from index.html so the two cannot drift silently. */
const NAVY  = [0x0A, 0x0F, 0x1E];
const IVORY = [0xF4, 0xEF, 0xE6];
const GOLD  = [0xC9, 0xA8, 0x4C];

const RADIUS = 0.20;  // corner radius as a fraction of the tile

/* The SVG is authored in a 100x100 viewBox; scale into device pixels. */
const s = W / 100;
const STEMS  = [ { x: 17, y: 18, w: 15, h: 64 }, { x: 68, y: 18, w: 15, h: 64 } ];
const THREAD = { x1: 31, y1: 24, x2: 69, y2: 76, width: 15 };
/* Redrawn over the stems, matching the SVG's paint order. */
const THREAD_TOP = { x1: 31, y1: 24, x2: 45, y2: 43, width: 15 };

const buf = Buffer.alloc(W * W * 4);

function put(x, y, rgb, a) {
  const i = (y * W + x) * 4;
  const src = a, dst = (buf[i + 3] / 255) * (1 - a);
  const out = src + dst;
  if (out <= 0) return;
  for (let c = 0; c < 3; c++) {
    buf[i + c] = Math.round((rgb[c] * src + buf[i + c] * dst) / out);
  }
  buf[i + 3] = Math.round(out * 255);
}

/* Distance from a point to a segment — used to fill the thick diagonal with
   butt caps, which is what stroke-width without stroke-linecap gives you. */
function segDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = ((px - x1) * dx + (py - y1) * dy) / len2;
  if (t < 0 || t > 1) return Infinity;         // butt cap: nothing beyond the ends
  const cx = x1 + t * dx, cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function inRoundedRect(x, y, w, h, r) {
  const cx = Math.min(Math.max(x, r), w - r);
  const cy = Math.min(Math.max(y, r), h - r);
  const dx = x - cx, dy = y - cy;
  return dx * dx + dy * dy <= r * r || (x >= r && x <= w - r) || (y >= r && y <= h - r);
}

const r = W * RADIUS;
for (let y = 0; y < W; y++) {
  for (let x = 0; x < W; x++) {
    const px = x + 0.5, py = y + 0.5;

    if (!inRoundedRect(px, py, W, W, r)) continue;
    put(x, y, NAVY, 1);

    const u = px / s, v = py / s;   // back into viewBox units

    if (segDist(u, v, THREAD.x1, THREAD.y1, THREAD.x2, THREAD.y2) <= THREAD.width / 2) {
      put(x, y, GOLD, 1);
    }
    for (const st of STEMS) {
      if (u >= st.x && u <= st.x + st.w && v >= st.y && v <= st.y + st.h) put(x, y, IVORY, 1);
    }
    if (segDist(u, v, THREAD_TOP.x1, THREAD_TOP.y1, THREAD_TOP.x2, THREAD_TOP.y2) <= THREAD_TOP.width / 2) {
      put(x, y, GOLD, 1);
    }
  }
}

/* Box-downsample the supersampled buffer. */
const out = Buffer.alloc(SIZE * SIZE * 4);
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    let acc = [0, 0, 0, 0];
    for (let dy = 0; dy < SS; dy++) {
      for (let dx = 0; dx < SS; dx++) {
        const i = ((y * SS + dy) * W + (x * SS + dx)) * 4;
        const a = buf[i + 3] / 255;
        acc[0] += buf[i] * a; acc[1] += buf[i + 1] * a; acc[2] += buf[i + 2] * a; acc[3] += a;
      }
    }
    const n = SS * SS, o = (y * SIZE + x) * 4;
    if (acc[3] > 0) {
      out[o]     = Math.round(acc[0] / acc[3]);
      out[o + 1] = Math.round(acc[1] / acc[3]);
      out[o + 2] = Math.round(acc[2] / acc[3]);
    }
    out[o + 3] = Math.round((acc[3] / n) * 255);
  }
}

/* ── minimal PNG writer ──────────────────────────────────────────────────── */

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([len, body, crc]);
}

let TABLE = null;
function crc32(b) {
  if (!TABLE) {
    TABLE = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      TABLE[n] = c;
    }
  }
  let c = -1;
  for (let i = 0; i < b.length; i++) c = TABLE[(c ^ b[i]) & 0xFF] ^ (c >>> 8);
  return c ^ -1;
}

const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1));
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE * 4 + 1)] = 0;   // filter: none
  out.copy(raw, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8;    // bit depth
ihdr[9] = 6;    // colour type: RGBA
ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0))
]);

const dest = path.join(__dirname, 'assets', 'email-logo.png');
fs.writeFileSync(dest, png);
console.log('wrote ' + dest + '  ' + SIZE + 'x' + SIZE + '  ' + png.length + ' bytes');
