#!/usr/bin/env node
// ─────────────────────────────────────────────
//  Dashboard server
//  Serves dashboard.html + leads.json on localhost:3131
//  Run:  node server.js
//  Then: open http://localhost:3131 in browser
// ─────────────────────────────────────────────

const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT    = 3131;
const DIR     = __dirname;
const LEADS   = path.join(DIR, 'leads.json');
const DASH    = path.join(DIR, 'dashboard.html');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.js':   'text/javascript',
  '.css':  'text/css',
};

const server = http.createServer((req, res) => {
  // CORS for local use
  res.setHeader('Access-Control-Allow-Origin', '*');

  let filePath;

  if (req.url === '/' || req.url === '/index.html') {
    filePath = DASH;
  } else if (req.url === '/leads.json') {
    filePath = LEADS;
  } else {
    // Serve any other file in DIR (css, js, etc.)
    filePath = path.join(DIR, req.url.split('?')[0]);
  }

  // Security: stay inside DIR
  if (!filePath.startsWith(DIR)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (req.url === '/leads.json') {
        // leads.json not generated yet
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'leads.json not found. Run: node scanner.js first.' }));
      } else {
        res.writeHead(404); res.end('Not found');
      }
      return;
    }
    const ext  = path.extname(filePath);
    const mime = MIME[ext] || 'text/plain';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║   Lead Scanner Dashboard                  ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log(`\n  🌐  Open:  http://localhost:${PORT}`);
  console.log(`  📁  Serving from: ${DIR}`);
  if (!fs.existsSync(LEADS)) {
    console.log('\n  ⚠️   leads.json not found yet.');
    console.log('  Run  node scanner.js  first to generate it.\n');
  } else {
    const leads = JSON.parse(fs.readFileSync(LEADS, 'utf8'));
    console.log(`\n  ✅  ${leads.length} leads loaded and ready.\n`);
  }
  console.log('  Press Ctrl+C to stop.\n');

  // Auto-open browser
  const open = process.platform === 'win32'  ? 'start'
             : process.platform === 'darwin' ? 'open'
             : 'xdg-open';
  require('child_process').exec(`${open} http://localhost:${PORT}`);
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌  Port ${PORT} is already in use.`);
    console.error(`   Open http://localhost:${PORT} in your browser — server may already be running.\n`);
  } else {
    console.error('\n❌  Server error:', err.message);
  }
  process.exit(1);
});
