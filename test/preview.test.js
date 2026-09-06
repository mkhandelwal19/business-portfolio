/* Hero "Preview" button -> personalised live-demo modal. */
'use strict';
const { loadPage, suite } = require('./lib');

module.exports = function run(){
  const s = suite('hero preview button + live demo modal');
  const { window: w, document: d, errors } = loadPage('index.html');

  return new Promise(resolve => setTimeout(() => {
    // If a top-level throw killed the script, these never get defined — which
    // is exactly how the button shipped dead while still "being present".
    s.check(typeof w.__netloomOpenPreview === 'function', 'script ran to completion (__netloomOpenPreview defined)');
    s.check(typeof w.__netloomNavigate === 'function', '__netloomNavigate defined');

    const form  = d.getElementById('bizPreviewForm');
    const input = d.getElementById('bizNameInput');
    const btn   = d.getElementById('bizPreviewBtn');
    const modal = d.getElementById('bizModal');
    const frame = d.getElementById('bizModalFrame');

    s.check(form && input && btn && modal && frame, 'form, button and modal all present');
    s.check(btn && btn.tagName === 'BUTTON' && btn.type === 'submit', 'Preview is a real submit button');
    s.check(modal && modal.hidden === true, 'modal starts hidden');
    s.check(d.getElementById('bizModalTabs').children.length === 8, 'eight industry tabs built');

    input.value = 'Sharma Salon';
    input.dispatchEvent(new w.Event('input', { bubbles:true }));
    btn.click();

    s.check(modal.hidden === false, 'clicking Preview opens the modal');
    s.check(d.getElementById('bizModalName').textContent === 'Sharma Salon', 'modal shows the typed name');
    s.check(/\/salon\/index\.html/.test(frame.src), 'industry guessed from the name -> salon');
    s.check(/biz=Sharma%20Salon/.test(frame.src), 'name forwarded as ?biz=');
    s.check(/embed=1/.test(frame.src), 'embed=1 set');
    s.check(d.body.classList.contains('bizmodal-open'), 'body scroll locked');

    [...d.getElementById('bizModalTabs').children]
      .find(b => b.textContent.includes('Jewellery')).click();
    s.check(/jewellery-lux\/index\.html/.test(frame.src), 'switching tab reloads the 3D flagship');

    d.dispatchEvent(new w.KeyboardEvent('keydown', { key:'Escape', bubbles:true }));
    s.check(modal.hidden === true, 'Escape closes the modal');
    s.check(/about:blank/.test(frame.src), 'iframe unloaded on close');

    input.value = '';
    btn.click();
    s.check(modal.hidden === true, 'empty name does not open the modal');
    s.check(/Type your business name/.test(d.getElementById('bizPreviewHint').textContent), 'empty name shows the inline hint');

    /* All eight verticals still answer to their own words — a jeweller
       searching "gold" must still land somewhere. Four of them now open the
       premium page rather than the retired standard one, so the expected
       path is listed explicitly instead of derived from the key. */
    [['Nizami Biryani','restaurant','restaurant'],
     ['Basu Dental Clinic','healthcare','healthcare'],
     ['Mallika Gold','jewellery','jewellery-lux'],
     ['Saha Properties','realestate','realestate-lux'],
     ['Praana Yoga','yoga','yoga'],
     ['Riyaaz Boutique','boutique','boutique-lux'],
     ['Kolkata Craft Store','ecommerce','commerce']]
      .forEach(([name, want, dir]) => {
        modal.hidden = true; d.body.classList.remove('bizmodal-open');
        w.__netloomOpenPreview(name);
        s.check(new RegExp('/' + dir + '/').test(frame.src), 'guess: "' + name + '" -> ' + dir);
      });

    resolve(s.report(errors));
  }, 600));
};
