# Photographs, licences and provenance

**Read this before you download a single image.**

This repo currently ships 216 photographs with **no recorded source**. That
is written up as an open legal risk in `LICENCES.md` at the repo root. It
happened because someone downloaded good pictures quickly and meant to write
down where they came from later. Later never arrives. Do not create a second
one on a client's site, where the exposure is theirs as well as ours.

---

## The rule

> **A file does not enter a client build until its source URL is written
> down.** Same minute, not same day.

Being on the public web is not a licence. Being findable through an image
search is not a licence. "Free to download" is not "free to use
commercially". A reverse-image search by an agency that owns the photo takes
about four seconds.

---

## Where photographs may come from

### 1. The client — always ask first

Client photos beat stock, even mediocre ones, because they are of the actual
place. A slightly soft phone photo of their real dining room outperforms a
perfect stock shot of somebody else's.

- Ask for the **originals**, not the WhatsApp copies. WhatsApp recompresses
  to around 100KB and it shows on a hero image.
- Their Instagram is usually the real archive. Ask them to share the account
  or send the folder.
- Get it in writing (a WhatsApp message is fine) that they own the photos and
  we may use them. If a photographer shot them, the photographer may still
  own the copyright — ask.

### 2. Licensed stock — exactly three sources

| Source | Licence | Commercial use | Attribution |
|---|---|---|---|
| [Unsplash](https://unsplash.com) | Unsplash Licence | Yes | Not required, still good manners |
| [Pexels](https://pexels.com) | Pexels Licence | Yes | Not required |
| [Pixabay](https://pixabay.com) | Pixabay Content Licence | Yes | Not required |

That is the whole list. Not Google Images. Not Pinterest. Not a competitor's
site. Not "it was on the first page of results".

Two things those licences do **not** cover, and both matter here:

- **Identifiable people.** The licence covers the photographer's copyright,
  not the subject's personality rights. Unsplash and Pexels both say so
  explicitly. Using a recognisable face in a way that implies endorsement or
  employment needs a model release, which stock libraries do not supply.
- **Logos, brands and artwork** visible in the frame.

### 3. AI-generated

Allowed, but record the tool and the date — terms differ per tool and some
restrict commercial use. Do not use AI images of food, people or the
client's actual products. They read as fake to exactly the customers the
client is trying to win, and food is where the uncanny valley is worst.

---

## The three things never to do

1. **Never put a stock face under a real person's name.** "Dr. A. Sen,
   Senior Consultant" over a stock portrait asserts a relationship that does
   not exist. Five pages were deleted from this repo on 6 September 2026 for
   exactly this, along with 18 portrait files.
2. **Never use a competitor's photographs.** Including "just as a
   placeholder". Placeholders ship.
3. **Never use a photo of an interior, a dish or a product and imply it is
   the client's** if it is not. Generic category imagery is fine and normal;
   a specific claim about a specific thing is not.

---

## Recording provenance

Every client build gets its own `LICENCES.md`, copied from the template
below, filled in **as you download**, and handed over at go-live.

```markdown
# Asset licences — <Client Name>

Last updated: <date>

## Photography

| File | Source | URL | Licence | Downloaded | By |
|------|--------|-----|---------|-----------|-----|
| hero-01.webp | Client | — | Client-owned, permission in WhatsApp 12 Sep | 2026-09-12 | <name> |
| interior-03.webp | Unsplash | https://unsplash.com/photos/abc123 | Unsplash Licence | 2026-09-12 | <name> |

## People in photographs
<Which files contain identifiable people, and on what basis they are used.>

## Fonts and icons
Playfair Display, DM Sans, JetBrains Mono — SIL OFL 1.1, via Google Fonts.
Font Awesome Free 6.5.1 — CC BY 4.0 (icons), OFL 1.1 (font), MIT (code),
loaded from cdnjs so their notice travels with it.

## Maps
Google Maps embed via `output=embed`. Google's attribution — the wordmark
bottom-left and the Terms link bottom-right — must not be moved, obscured or
filtered. This is why the map is not colour-inverted to match a dark theme.
```

---

## Preparing the files

### Naming

`<category>-NN.webp`, zero-padded, in `assets/photos/`. Do not keep the
original download filename — `pexels-photo-1234567.jpeg` in a client's repo
is both ugly and a hint about where it came from that you would rather have
in `LICENCES.md` than in the URL.

### Sizes

| Directory | Size | Used for |
|---|---|---|
| `assets/photos/` | long edge 1200px | Hero images, gallery |
| `assets/photos/md/` | long edge 800px | Cards, blog thumbs, product images |
| `assets/photos/sm/` | 560 × 350 crop | Feature tiles |
| `assets/photos/xs/` | 200 × 200 crop | Avatars, thumbnails |

### The derivative script

Requires Pillow (`pip install Pillow`). Run from the client site root.

```python
#!/usr/bin/env python3
"""Generate md/sm/xs derivatives from assets/photos/*.webp."""
import os
from PIL import Image, ImageOps

SRC = 'assets/photos'
SPECS = [('md', 'long', 800), ('sm', 'crop', (560, 350)), ('xs', 'crop', (200, 200))]

for sub, mode, spec in SPECS:
    os.makedirs(os.path.join(SRC, sub), exist_ok=True)

for name in sorted(os.listdir(SRC)):
    if not name.lower().endswith('.webp'):
        continue
    src = os.path.join(SRC, name)
    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im).convert('RGB')
        for sub, mode, spec in SPECS:
            out = os.path.join(SRC, sub, name)
            if mode == 'long':
                d = im.copy()
                d.thumbnail((spec, spec), Image.LANCZOS)
            else:
                d = ImageOps.fit(im, spec, Image.LANCZOS, centering=(0.5, 0.4))
            d.save(out, 'WEBP', quality=82, method=6)
            print('  ', out, d.size)
```

`centering=(0.5, 0.4)` crops slightly above centre, because faces and the
subject of a photograph are almost never in the vertical middle.

A derivative carries exactly the licence of its source. Resizing creates a
derivative work; it does not create a new right in it.

### Converting to WebP first

```bash
# from JPEG/PNG originals in a folder called incoming/
python -c "
import os
from PIL import Image, ImageOps
os.makedirs('assets/photos', exist_ok=True)
for i, f in enumerate(sorted(os.listdir('incoming'))):
    if not f.lower().endswith(('.jpg','.jpeg','.png')): continue
    im = ImageOps.exif_transpose(Image.open(os.path.join('incoming', f))).convert('RGB')
    im.thumbnail((1200, 1200), Image.LANCZOS)
    out = 'assets/photos/%s-%02d.webp' % (os.environ.get('CAT','photo'), i)
    im.save(out, 'WEBP', quality=86, method=6)
    print(out, im.size)
"
```

---

## In the markup

```html
<img src="../assets/photos/restaurant-18.webp"
     alt="Sunday lunch at Aangan — the long table laid for a family"
     loading="eager" decoding="async" fetchpriority="high">
```

- **The hero image only** gets `loading="eager"` and `fetchpriority="high"`.
  Everything else is `loading="lazy"`.
- **Alt text describes the picture**, in a sentence, for someone who cannot
  see it. Not the filename, not a keyword list. Purely decorative images
  behind text get `alt=""`.
- Photographs inside `.feature-img`, `.gallery-item`, `.hero-art` and
  `.team-photo` get an automatic scrim from `demo.css`, tuned separately for
  light and dark. Do not add your own gradient over the top.

---

## The quick audit, before the client sees anything

- [ ] Every file in `assets/photos/` has a row in `LICENCES.md`
- [ ] No file came from Google Images, Pinterest or a competitor
- [ ] No stock face appears under a named person
- [ ] Every identifiable person is either staff who agreed, or generic use
      that implies nothing
- [ ] Every `<img>` has real alt text or a deliberate `alt=""`
- [ ] Only the hero is eager-loaded
- [ ] Total page weight under 2MB on the heaviest page
