# QA — before anyone outside sees it

Work top to bottom. The order is deliberate: the cheap automated checks come
first so you are not eyeballing a page that a `grep` would have failed.

---

## 1. Automated

```bash
npm test                    # 209 assertions, ~1s. Must be green.
node build-routes.js        # only if you touched the main site's index.html
node --check demo.js        # syntax, if you edited it
```

```bash
# No leftover template content. Every one of these should return nothing.
grep -rn "Aangan\|Basu Family\|Lumière\|Lumiere\|Praana\|Mallika\|Saha Properties\|Riyaaz\|Kolkata Craft" --include=*.html .
grep -rn "Lorem ipsum\|TODO\|FIXME\|XXX\|placeholder" --include=*.html .
grep -rn "918249992869" --include=*.html .     # Netloom's number, not the client's
grep -rn "netloom.in" --include=*.html .       # except the "Built by" credit
```

```bash
# Every image referenced actually exists
python -c "
import os, re, io, glob
missing = []
for p in glob.glob('**/*.html', recursive=True):
    for m in re.finditer(r'src=\"([^\"]+\.(?:webp|jpg|jpeg|png|svg))\"', io.open(p, encoding='utf-8').read()):
        s = m.group(1)
        if s.startswith(('http', 'data:')): continue
        f = os.path.normpath(os.path.join(os.path.dirname(p), s))
        if not os.path.exists(f): missing.append(p + ' -> ' + s)
print('\n'.join(missing) if missing else 'all images present')
"
```

```bash
# Every internal link resolves
python -c "
import os, re, io, glob
bad = []
for p in glob.glob('**/*.html', recursive=True):
    for m in re.finditer(r'href=\"([^\"#?]+\.html)[^\"]*\"', io.open(p, encoding='utf-8').read()):
        f = os.path.normpath(os.path.join(os.path.dirname(p), m.group(1)))
        if not os.path.exists(f): bad.append(p + ' -> ' + m.group(1))
print('\n'.join(bad) if bad else 'all internal links resolve')
"
```

---

## 2. Content

- [ ] Business name spelled exactly as the client wrote it, everywhere
- [ ] Phone number dials the right number — actually tap it
- [ ] WhatsApp link opens with a sensible prefilled message, and the number
      is the **client's**
- [ ] Email address correct in `mailto:` and in the visible text
- [ ] Address matches the intake sheet, pin code included
- [ ] Hours in `data-hours` match the hours shown as text
- [ ] Map shows the right building, not the right street
- [ ] Every price came from the client
- [ ] Every review is real, with a real name
- [ ] **Nothing on the page is a fact the client did not give us.** Read the
      whole site once with only this question in mind.
- [ ] No dead nav or footer links to pages the tier does not include
- [ ] `<title>` and meta description are per-page, not copied
- [ ] JSON-LD has the right `@type` and real values

---

## 3. Visual — you have to actually look

DOM tests cannot see rendering. They will not catch overlapping text, an
unreadable accent, a broken grid or a hero image cropped through a face.
Every visual bug in this repo's history was invisible to `npm test` and
obvious in a screenshot.

Serve the folder and shoot it:

```bash
python -m http.server 8124 --bind 127.0.0.1
```

```powershell
# PowerShell. Start-Process -Wait is more reliable here than calling chrome directly.
$sp = "$env:TEMP\shots"; New-Item -ItemType Directory -Force $sp | Out-Null
$i = 0
foreach ($page in @("index","about","contact","gallery")) {
  foreach ($theme in @("dark","light")) {
    $i++
    Start-Process -FilePath "C:\Program Files\Google\Chrome\Application\chrome.exe" `
      -ArgumentList "--headless=new","--disable-gpu","--hide-scrollbars",
        "--window-size=1400,1400","--virtual-time-budget=6000",
        "--user-data-dir=$sp\u$i","--screenshot=$sp\$page-$theme.png",
        "http://127.0.0.1:8124/$page.html?theme=$theme" -Wait
  }
}
```

Three traps, each of which will cost an hour:

- **`--window-size` below about 500px does not give you a 390px viewport.**
  Chrome on Windows enforces an OS minimum window width, so the page lays out
  wider and the screenshot is simply cropped — which looks exactly like
  horizontal overflow and sends you hunting a layout bug that is not there.
  `--headless=old` does not help. To test a real phone width, load the page in
  a 390px iframe from a wider window:

  ```html
  <!-- _mobtest.html in the site root; delete it when you are done -->
  <style>html,body{margin:0;background:#555}iframe{width:390px;height:844px;border:0}</style>
  <iframe src="/index.html?theme=light"></iframe>
  ```

  The inner document gets a genuine 390px layout viewport and the media
  queries fire correctly.

- **`--virtual-time-budget` does not advance while a `requestAnimationFrame`
  loop is running.** A `setTimeout` in a debug snippet never fires on a page
  with a permanent rAF loop. Drive state through the URL or a temporary copy
  of the page with the state already set in the source.
- **Fonts, icons and three.js come from a CDN**, so a headless run can fail
  transiently and leave you looking at a fallback. Retry before investigating.

Then look at:

- [ ] **Both themes.** Every page. Light is not a colour inversion and it
      breaks differently.
- [ ] 375px wide (iPhone SE) — the real test, most traffic here is mobile
- [ ] 1440px wide
- [ ] Hero image not cropped through a face or the subject
- [ ] Nothing overlaps at any width
- [ ] Accent text readable on both grounds
- [ ] Buttons look tappable and are at least 44px tall
- [ ] Gallery grid has no orphan in the last row
- [ ] Long business names do not break the nav

---

## 4. Behaviour

- [ ] Mobile nav opens and closes
- [ ] FAQ accordions open
- [ ] Gallery filters filter
- [ ] Jump nav scrolls and the active pill follows
- [ ] Open/closed dot shows the truth for the current time
- [ ] Contact form validates, and **actually delivers** — send one
- [ ] Theme switch works and survives a page navigation
- [ ] Nothing in the browser console

---

## 5. Performance and access

- [ ] Only the hero image is eager-loaded
- [ ] Heaviest page under 2MB
- [ ] Every `<img>` has meaningful alt text, or `alt=""` if decorative
- [ ] Tab through the whole page — focus is always visible and in order
- [ ] `prefers-reduced-motion` respected (`demo.css` already handles it —
      confirm you did not add an unguarded animation)
- [ ] Zoom to 200%; nothing is cut off

---

## 6. Pre-mockup

- [ ] `<meta name="robots" content="noindex, nofollow">` on **every** page
- [ ] `LICENCES.md` complete — every image has a source
- [ ] Slug is unguessable and not reused

## 7. Pre-live

- [ ] **Every `noindex` removed.** `grep -rl noindex .` returns nothing.
      This is the most common launch-day mistake and it makes the site
      invisible on Google.
- [ ] `robots.txt` allows crawling
- [ ] `sitemap.xml` present and listing the real hostname
- [ ] Canonical URLs point at the live domain, not the mockup
- [ ] Favicon in place
- [ ] Open Graph image set — check how the URL looks pasted into WhatsApp,
      because that is how it will be shared
- [ ] HTTPS working, no mixed content
- [ ] Tested on a real phone, on mobile data
