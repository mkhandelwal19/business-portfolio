// ─────────────────────────────────────────────
//  Export Helpers — CSV + JSON
// ─────────────────────────────────────────────

const fs = require('fs');
const path = require('path');

const CSV_HEADERS = [
  'Score',
  'Name',
  'Category',
  'Area',
  'Address',
  'Phone',
  'Email',
  'Email Source',
  'Website',
  'Website Type',
  'Rating',
  'Reviews',
  'Google Maps URL',
  'Why Good Lead',
];

function csvCell(val) {
  const s = String(val ?? '');
  // Wrap in quotes if it contains comma, quote, or newline
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function exportCSV(leads, filepath) {
  const rows = [CSV_HEADERS.join(',')];
  for (const l of leads) {
    rows.push([
      l.score,
      csvCell(l.name),
      csvCell(l.category),
      csvCell(l.area),
      csvCell(l.address),
      csvCell(l.phone),
      csvCell(l.email),
      csvCell(l.email_source),
      csvCell(l.website),
      csvCell(l.website_type),
      l.rating,
      l.reviews,
      csvCell(l.maps_url),
      csvCell(l.reasons),
    ].join(','));
  }
  fs.writeFileSync(filepath, rows.join('\n'), 'utf8');
  console.log(`\n💾  CSV saved → ${path.resolve(filepath)}  (${leads.length} rows)`);
}

function exportJSON(leads, filepath) {
  fs.writeFileSync(filepath, JSON.stringify(leads, null, 2), 'utf8');
  console.log(`💾  JSON saved → ${path.resolve(filepath)}`);
}

module.exports = { exportCSV, exportJSON };
