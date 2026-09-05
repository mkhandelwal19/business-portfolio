/* ?biz= personalisation and ?embed=1 chrome-stripping on the demo templates. */
'use strict';
const { loadPage, suite } = require('./lib');

function demo(query){
  return loadPage('salon/index.html', {
    url: 'https://netloom.in/salon/index.html' + query,
    inline: { '<script src="../demo.js"></script>': 'demo.js' }
  });
}

module.exports = function run(){
  const s = suite('demo ?biz= personalisation and ?embed=1');

  let r = demo('?biz=Sharma%20Salon&embed=1');
  s.check(!r.document.querySelector('.preview-bar'), 'embed=1: demo preview bar removed');
  s.check(r.document.documentElement.classList.contains('is-embedded'), 'embed=1: is-embedded set');
  s.check(r.document.documentElement.style.getPropertyValue('--preview-h') === '0px', 'embed=1: --preview-h collapsed');
  s.check(/Sharma Salon/.test(r.document.querySelector('.nav-logo').textContent), 'embed=1: wordmark swapped');
  s.check(!r.document.querySelector('.cookie-banner'), 'embed=1: cookie banner suppressed');

  r = demo('');
  s.check(!!r.document.querySelector('.preview-bar'), 'no params: preview bar untouched');
  s.check(!r.document.documentElement.classList.contains('is-embedded'), 'no params: is-embedded not set');

  r = demo('?biz=Sharma%20Salon');
  s.check(!!r.document.querySelector('.preview-bar'), 'biz only: preview bar kept');
  s.check(/Sharma Salon/.test(r.document.querySelector('.nav-logo').textContent), 'biz only: wordmark swapped');
  s.check(!!r.document.querySelector('.pb-biz'), 'biz only: "Previewing as" pill shown');

  return Promise.resolve(s.report());
};
