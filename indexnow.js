#!/usr/bin/env node
/* indexnow.js - push every sitemap URL to IndexNow.

   IndexNow is a ping, not a ranking lever: it tells Bing, Yandex, Seznam and
   Naver that a URL changed instead of waiting for them to re-crawl. Google does
   not participate. It matters here because Bing's index feeds ChatGPT search.

   The key lives in a file at the site root; IndexNow fetches it to prove we own
   the host, which is why the file and the key below must never drift apart.

   Run after a deploy has actually gone live - submitting a URL that still
   serves the old bytes just wastes the ping:  node indexnow.js
*/
'use strict';

const fs    = require('fs');
const path  = require('path');
const https = require('https');

const KEY  = '7d174953d83cc5147f2533a3dbd6273e';
const HOST = 'netloom.in';

const sitemap = fs.readFileSync(path.join(__dirname, 'sitemap.xml'), 'utf8');
const urlList = [...sitemap.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map(m => m[1]);

if (!urlList.length) {
  console.error('No <loc> entries found in sitemap.xml - nothing to submit.');
  process.exit(1);
}

const body = JSON.stringify({
  host: HOST,
  key: KEY,
  keyLocation: `https://${HOST}/${KEY}.txt`,
  urlList
});

const req = https.request({
  hostname: 'api.indexnow.org',
  path: '/indexnow',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body)
  }
}, res => {
  let out = '';
  res.on('data', c => { out += c; });
  res.on('end', () => {
    /* 200 accepted, 202 accepted but the key is still being verified. Both are
       success; anything else is worth reading. */
    const ok = res.statusCode === 200 || res.statusCode === 202;
    console.log(`${ok ? 'OK' : 'FAILED'}  HTTP ${res.statusCode}  ${urlList.length} URLs submitted`);
    if (out.trim()) console.log(out.trim());
    if (!ok) process.exit(1);
  });
});

req.on('error', err => {
  console.error('Request failed:', err.message);
  process.exit(1);
});

req.write(body);
req.end();
