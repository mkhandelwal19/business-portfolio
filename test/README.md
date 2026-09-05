# Tests

```bash
npm install     # once
npm test
```

## Why these exist

The hero **Preview** button shipped broken twice. Both times the checks that
were run — "the markup is present", "the inline script parses" — passed, because
neither actually executes the page. A single top-level throw anywhere in
`index.html`'s script block silently kills every IIFE after it, and the only
symptom is a control that does nothing when clicked.

These suites load the real page in jsdom, run its scripts, and drive the DOM the
way a visitor would. `preview.test.js` asserts `__netloomOpenPreview` is defined
at all, which is the direct check for that class of failure.

## Running after a change

`npm test` after touching anything in `index.html`'s script block, `demo.js`, or
the preview/modal markup. It takes about a second.

If you change `index.html`, also run `npm run build` to regenerate the route
pages — the tests only cover `index.html` itself.

## Notes

- jsdom has no layout engine and no WebGL. `test/lib.js` stubs
  `IntersectionObserver`, `matchMedia`, `scrollTo` and canvas contexts so a
  missing API cannot masquerade as a real failure. Nothing here can catch a
  *visual* regression — the flagship 3D and the mobile hero badge both needed
  eyes on a screenshot.
- `demo.js` is loaded via `<script src>`, which jsdom is deliberately not given
  file access for. `loadPage`'s `inline` option substitutes the file contents
  instead.
