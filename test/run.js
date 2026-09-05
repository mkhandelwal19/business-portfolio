#!/usr/bin/env node
/* node test/run.js  —  runs every *.test.js in this folder. */
'use strict';
const fs = require('fs');
const path = require('path');

(async () => {
  const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.test.js')).sort();
  console.log('');
  let ok = true;
  for (const f of files){
    const passed = await require(path.join(__dirname, f))();
    ok = ok && passed;
    console.log('');
  }
  console.log(ok ? 'ALL SUITES PASSED\n' : 'FAILURES PRESENT\n');
  process.exit(ok ? 0 : 1);
})();
