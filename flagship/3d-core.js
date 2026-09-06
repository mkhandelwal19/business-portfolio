/* =============================================================================
   flagship/3d-core.js — shared WebGL core for the Netloom flagship demos
   -----------------------------------------------------------------------------
   Extracted from jewellery-lux, which held all of this inline. Three flagships
   hand-copying a renderer, a camera rig and an auto-framing routine will drift,
   and the same bug will need finding three times.

   Loads as a plain script and defines window.Netloom3D. No modules: three.js
   0.147.0 is the last clean UMD build on cdnjs (r150+ warns, r160 dropped UMD
   entirely, r128 has no transmission/ior), and pulling a module graph into a
   single self-contained page buys nothing here.

   ── What this file is for ────────────────────────────────────────────────────
   Two jobs, and they pull against each other.

   1. Make the models read as photographed rather than rendered. That is mostly
      not polygon count. It is the environment map — every reflective surface on
      these pages is literally a picture of it — plus micro-variation in
      roughness, edges that are filleted rather than infinitely sharp, and
      objects that sit on something instead of floating in a void.

   2. Let someone actually inspect them: orbit, pinch, scroll, pan, on a phone,
      without stealing the page scroll from a visitor who is only passing
      through. See the note above the wheel handler for how that is resolved.

   ── Lessons already paid for, encoded as defaults ────────────────────────────

     - A gem needs metalness 1.0. A physically-correct dielectric reflects only
       ~4% of its environment head-on; the other 96% is flat diffuse colour,
       which renders as white plastic. Drive the surface from the environment.

     - Facet sparkle IS environment contrast. The env map wants hard-edged
       bright sources over near-black. A smooth gradient reflects as a smooth,
       dull stone.

     - Do not use real transmission on these pages. It needs something behind
       the object to refract, and there is only page background, so it goes
       dark.

     - Reveal the canvas before the first resize(). A [hidden] canvas measures
       0x0 and the renderer comes up 1x1.

     - Auto-frame every piece. frame() recentres on the bounding box and fits
       the camera, so composition never depends on hand-tuned offsets.

     - Nothing reads as real while it floats. A contact shadow on a surface does
       more for believability than any amount of added geometry.
   ========================================================================== */
window.Netloom3D = (function () {
  'use strict';

  var THREE_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.147.0/three.min.js';

  /* ── The load gate ─────────────────────────────────────────────────────────
     three.js is ~600 KB, which is real money on an Indian mobile data plan.
     It loads only where it will actually help: WebGL present, motion not
     reduced, and the connection not save-data or 2G. Everyone else keeps the
     hand-drawn SVG, which is built to stand on its own rather than look like
     a gap where something failed. */
  function webglOK() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
                (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }

  function reducedMotion() {
    try {
      return !!(window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) { return false; }
  }

  function thinPipe() {
    var c = navigator.connection;
    return !!(c && (c.saveData || /2g/.test(c.effectiveType || '')));
  }

  function shouldLoad() { return !reducedMotion() && !thinPipe() && webglOK(); }

  /* ── Detail tier ───────────────────────────────────────────────────────────
     One number, decided once, that any builder can ask for a segment count.
     A budget Android phone and a desktop both have to render these pages; the
     honest way to serve both is to build a smaller model on the small device,
     not to ship the big one and hope.

     Deliberately pessimistic. deviceMemory and hardwareConcurrency are absent
     on Safari, so an unknown device is treated as mid rather than high. */
  var _tier = null;
  function tier() {
    if (_tier !== null) return _tier;
    /* An explicit override, for a quality control on the page and for looking
       at the high-detail path on a machine that would not otherwise get it.
       Headless Chrome reports two cores, so everything below decides this is a
       weak device and quietly turns off shadows and antialiasing — which makes
       a screenshot a poor guide to what a visitor on a laptop actually sees. */
    if (typeof window.NETLOOM3D_TIER === 'number') {
      _tier = window.NETLOOM3D_TIER;
      return _tier;
    }
    var score = 1;
    try {
      var mem = navigator.deviceMemory || 0;
      var cpu = navigator.hardwareConcurrency || 0;
      var dpr = window.devicePixelRatio || 1;
      var small = Math.min(screen.width, screen.height) < 500;
      if (mem >= 8 && cpu >= 8) score = 2;
      if (mem && mem <= 4) score = 0;
      if (cpu && cpu <= 4) score = 0;
      /* A phone-sized viewport at a high pixel ratio is filling a lot of pixels
         with a small GPU, whatever the reported specs say. */
      if (small && dpr > 2.5 && score > 1) score = 1;
    } catch (e) { /* keep the mid default */ }
    _tier = score;
    return score;
  }

  /* detail(high, mid, low) — pick a number for this device. */
  function detail(hi, mid, lo) {
    var t = tier();
    return t === 2 ? hi : (t === 1 ? mid : (lo === undefined ? mid : lo));
  }

  /* boot(onReady, onSkip)
     onReady(THREE, api) runs only once three.js is actually on the page.
     onSkip(reason) runs when the gate says no, or the CDN fails — the caller
     uses it to leave the SVG fallback in place. Never throws into the host
     page: a flagship that half-loads should look like a flagship that chose
     not to load. */
  function boot(onReady, onSkip) {
    if (!shouldLoad()) { if (onSkip) onSkip('gated'); return; }
    if (window.THREE) { safely(onReady, onSkip); return; }

    var s = document.createElement('script');
    s.src = THREE_SRC;
    s.async = true;
    s.onerror = function () { if (onSkip) onSkip('cdn'); };
    s.onload = function () { safely(onReady, onSkip); };
    document.head.appendChild(s);
  }

  function safely(onReady, onSkip) {
    try {
      if (!window.THREE) { if (onSkip) onSkip('missing'); return; }
      onReady(window.THREE, API);
    } catch (e) {
      console.warn('3D disabled:', e);
      if (onSkip) onSkip('error');
    }
  }

  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }

  /* ══════════════════════════════════════════════════════════════════════════
     ENVIRONMENT
     ══════════════════════════════════════════════════════════════════════════
     Every reflective surface on these pages is, literally, a picture of this
     canvas. It is the highest-leverage code in the repo for how the models
     look, and it costs one canvas rather than one network request.

     Painted in a fixed 1024x512 coordinate space and scaled up to whatever the
     device can afford, so raising the resolution never invalidates a
     hand-placed light. */
  /* ── The gem environment ───────────────────────────────────────────────────
     A diamond has no colour and almost no diffuse component. Everything you
     see in one is the room, folded 57 ways. So the room is the model.

     What matters is CONTRAST and FREQUENCY, not brightness. The first version
     of this page lit the stone with a smooth warm gradient and got back a
     smooth warm stone: adjacent facets differ by a few degrees, so on a smooth
     environment they reflect almost the same value and the whole crown reads
     as one surface. Here the map is mostly black, with a handful of small,
     very bright sources — so two neighbouring facets land on wildly different
     values, and turning the stone sweeps facets across sources one at a time.
     That flashing is what the trade calls pinfire, and it is the only reason
     a cut stone looks different from a moulded one.

     Which is also why there are no full-width bands: a band is seen by every
     facet at once and flattens exactly what the flares are here to create. */
  var GEM_ENV = (function () {
    /* A light tent, built rather than hand-listed.

       The first version placed a handful of sources by hand and every stone
       except the big hero one came out a black silhouette. The reason is
       geometric: a facet reflects exactly one direction, and a hand-placed
       source covers a few percent of the sphere, so most facets at most
       orientations were looking at nothing. Small stones have fewer facets to
       get lucky with, which is why they went black first.

       Three rings of strip lights at even azimuths fix that — whichever way a
       facet turns there is something to catch — while the GAPS between them
       keep the contrast that makes it sparkle rather than glow. That is how
       diamonds are actually photographed, and for the same reason.

       Deterministic, so the stone does not change between reloads. */
    var boxes = [], flares = [], i;

    // Upper ring: the key lights, staggered in height so the reflections in
    // adjacent facets are not identical.
    for (i = 0; i < 8; i++) {
      boxes.push([i * 128 + 12, 44 + (i % 2) * 30, 98, 76,
                  i % 3 === 0 ? '#fff2d8' : (i % 3 === 2 ? '#e9f1ff' : '#ffffff'),
                  0.42, 0.96 - (i % 2) * 0.18]);
    }
    // Mid ring: narrow hard bars. These are the pinfire.
    for (i = 0; i < 6; i++) {
      boxes.push([i * 171 + 22, 212 + (i % 3) * 36, 106, 15,
                  i % 2 ? '#ffe9b8' : '#ffffff', 0.05, 0.92]);
    }
    // Lower ring: what the pavilion looks into. Dimmer, but not nothing — a
    // flat bounce here turns the bottom half of every stone to solid metal.
    for (i = 0; i < 5; i++) {
      boxes.push([i * 205 + 32, 380 + (i % 2) * 48, 120, 19,
                  i % 2 ? '#eae4ff' : '#ffffff', 0.08, 0.58]);
    }
    for (i = 0; i < 18; i++) {
      flares.push([(i * 397) % 1024, 88 + ((i * 149) % 344), 13 + (i % 4) * 8]);
    }

    return {
      /* Lit at the zenith and falling away fast. In an equirectangular map the
         top edge is the ceiling, and the table — the big flat facet on top of
         every cut stone — points almost straight at it. */
      base: [[0.00, '#2e2a22'], [0.12, '#12100c'], [0.34, '#070605'],
             [0.56, '#030303'], [0.86, '#050505'], [1.00, '#0d0c0b']],
      bands: [],
      softboxes: boxes,
      flares: flares,
      bounce: ['rgba(96,84,64,0)', 'rgba(120,106,82,.30)'],
      grain: 0.03
    };
  })();

  var ENV_DEFAULTS = {
    base: [[0.00, '#000000'], [0.40, '#2a2011'], [0.55, '#0d0a06'], [1.00, '#000000']],
    bands: [[92, 26, '#ffffff'], [124, 10, '#fff3d6'], [168, 34, '#ffe9b8'],
            [214, 8, '#ffffff'], [262, 18, '#d9b65f'], [318, 10, '#8a6e2c']],
    flares: [[200, 108, 78], [640, 150, 62], [860, 96, 50]],
    bounce: ['rgba(122, 88, 30, 0)', 'rgba(168, 124, 44, .55)']
  };

  /* A softbox: a bright rectangle with a hot core and a soft falloff, clipped
     so its long edges stay hard. That is what a real studio light looks like
     reflected in polished metal, and it is the difference between a surface
     that reads as lit and one that reads as painted.

     [x, y, w, h, colour, soft, peak] in the 1024x512 space. */
  function softbox(g, x, y, w, h, colour, soft, peak) {
    soft = soft === undefined ? 0.35 : soft;
    var grd = g.createRadialGradient(x + w / 2, y + h / 2, 0,
                                     x + w / 2, y + h / 2, Math.max(w, h) / 2);
    grd.addColorStop(0, colour);
    grd.addColorStop(clamp(1 - soft, 0.02, 0.98), colour);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.save();
    g.globalAlpha = peak === undefined ? 1 : peak;
    g.beginPath();
    g.rect(x, y, w, h);
    g.clip();
    g.fillStyle = grd;
    g.fillRect(x - w, y - h, w * 3, h * 3);
    g.restore();
  }

  /* Reflections of a perfectly clean studio look like CG. A little noise in the
     environment shows up as grain in every highlight on the page. */
  function envGrain(g, w, h, amount) {
    if (!amount) return;
    g.save();
    g.globalAlpha = amount;
    for (var i = 0; i < 1600; i++) {
      var v = (Math.random() * 120) | 0;
      g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',.5)';
      g.fillRect(Math.random() * w, Math.random() * h, 2.2, 2.2);
    }
    g.restore();
  }

  function studioEnv(renderer, opts) {
    var T = window.THREE;
    var o = opts || {};
    var base = o.base || ENV_DEFAULTS.base;
    var bands = o.bands || ENV_DEFAULTS.bands;
    var flares = o.flares || ENV_DEFAULTS.flares;
    var bounce = o.bounce || ENV_DEFAULTS.bounce;

    var W = detail(2048, 1024, 1024), H = W / 2;
    var c = document.createElement('canvas');
    c.width = W; c.height = H;
    var g = c.getContext('2d');
    g.scale(W / 1024, H / 512);          // everything below is in 1024x512 space

    var grad = g.createLinearGradient(0, 0, 0, 512);
    base.forEach(function (st) { grad.addColorStop(st[0], st[1]); });
    g.fillStyle = grad;
    g.fillRect(0, 0, 1024, 512);

    bands.forEach(function (b) { g.fillStyle = b[2]; g.fillRect(0, b[0], 1024, b[1]); });

    (o.softboxes || []).forEach(function (s) {
      softbox(g, s[0], s[1], s[2], s[3], s[4], s[5], s[6]);
    });

    flares.forEach(function (h) {
      var r = g.createRadialGradient(h[0], h[1], 0, h[0], h[1], h[2]);
      r.addColorStop(0, 'rgba(255,255,255,1)');
      r.addColorStop(0.45, 'rgba(255,240,210,.55)');
      r.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = r;
      g.fillRect(h[0] - h[2], h[1] - h[2], h[2] * 2, h[2] * 2);
    });

    var low = g.createLinearGradient(0, 400, 0, 512);
    low.addColorStop(0, bounce[0]);
    low.addColorStop(1, bounce[1]);
    g.fillStyle = low;
    g.fillRect(0, 400, 1024, 112);

    envGrain(g, 1024, 512, o.grain === undefined ? 0.05 : o.grain);

    var tex = new T.CanvasTexture(c);
    tex.mapping = T.EquirectangularReflectionMapping;
    var pm = new T.PMREMGenerator(renderer);
    pm.compileEquirectangularShader();
    var env = pm.fromEquirectangular(tex).texture;
    pm.dispose(); tex.dispose();

    /* Remember both the recipe and the context. envFor() below needs the first
       to reproduce a look and the second to know it must. */
    env.__n3opts = o;
    env.__n3renderer = renderer;
    return env;
  }

  /* ── Why an environment cannot simply be handed to a second stage ──────────
     A PMREM environment is a WebGLRenderTarget texture, and a render target
     belongs to the GL context that created it. Every stage on these pages has
     its own WebGLRenderer and therefore its own context, so passing
     `env: firstStage.env` to a second stage hands it a texture from a foreign
     context: it samples as nothing, silently.

     What that looks like is worth writing down, because it is not obviously an
     environment problem. Metal keeps its specular highlights, because those
     come from the discrete lights — so a gold band still reads as lit metal,
     just unusually dark. A near-mirror surface has almost no analytic specular
     and goes PURE BLACK. The collection viewer rendered a black diamond in a
     lit gold ring for exactly this reason, and both of the other two flagships
     were quietly running their second canvas with no environment at all.

     So `opts.env` is treated as "the same LOOK as that one", not "that exact
     texture": if it came from another renderer it is rebuilt here from the
     recipe it was made with. */
  function envFor(renderer, opts) {
    if (opts.env) {
      if (opts.env.__n3renderer === renderer) return opts.env;
      if (opts.env.__n3opts) return studioEnv(renderer, opts.env.__n3opts);
    }
    return studioEnv(renderer, opts.envOpts);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     PROCEDURAL TEXTURE
     ══════════════════════════════════════════════════════════════════════════ */

  function paint(w, h, draw) {
    var c = document.createElement('canvas');
    c.width = w; c.height = h === undefined ? w : h;
    draw(c.getContext('2d'), c.width, c.height);
    return c;
  }

  /* Soft value noise, for a roughness map. Real surfaces are never uniformly
     polished — a worn bangle, a cast concrete panel and a pressed cotton all
     vary, and that variation is what the eye reads as material. Uniform
     roughness is the commonest tell of a rendered image. */
  function noiseCanvas(size, opts) {
    var o = opts || {};
    var lo = o.lo === undefined ? 90 : o.lo;
    var hi = o.hi === undefined ? 190 : o.hi;
    var blobs = o.blobs === undefined ? 90 : o.blobs;
    var spread = o.spread === undefined ? 0.34 : o.spread;
    var mid = (lo + hi) >> 1;
    return paint(size, size, function (g, w, h) {
      g.fillStyle = 'rgb(' + mid + ',' + mid + ',' + mid + ')';
      g.fillRect(0, 0, w, h);
      for (var i = 0; i < blobs; i++) {
        var x = Math.random() * w, y = Math.random() * h;
        var r = (0.05 + Math.random() * spread) * w;
        var v = (lo + Math.random() * (hi - lo)) | 0;
        var grd = g.createRadialGradient(x, y, 0, x, y, r);
        grd.addColorStop(0, 'rgba(' + v + ',' + v + ',' + v + ',.55)');
        grd.addColorStop(1, 'rgba(' + v + ',' + v + ',' + v + ',0)');
        g.fillStyle = grd;
        g.fillRect(x - r, y - r, r * 2, r * 2);
      }
    });
  }

  /* Fine directional polish marks. On gold this is most of the difference
     between reading as metal and reading as chrome. */
  function scratchCanvas(size, opts) {
    var o = opts || {};
    var count = o.count === undefined ? 300 : o.count;
    var base = o.base === undefined ? 138 : o.base;
    return paint(size, size, function (g, w, h) {
      g.fillStyle = 'rgb(' + base + ',' + base + ',' + base + ')';
      g.fillRect(0, 0, w, h);
      g.lineWidth = 1;
      for (var i = 0; i < count; i++) {
        var y = Math.random() * h;
        var len = (0.08 + Math.random() * 0.55) * w;
        var x = Math.random() * w;
        var v = (base - 30 + Math.random() * 60) | 0;
        g.strokeStyle = 'rgba(' + v + ',' + v + ',' + v + ',' + (0.10 + Math.random() * 0.24).toFixed(2) + ')';
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + len, y + (Math.random() - 0.5) * 2.5);
        g.stroke();
      }
    });
  }

  /* Height canvas to tangent-space normal map, by Sobel.
     Cloth weave, concrete grain and milgrain beading are all far cheaper as a
     normal map than as geometry, and at these viewing distances they are
     indistinguishable. Wraps at the edges, so the result still tiles. */
  function normalFrom(canvas, strength, repeat) {
    var T = window.THREE;
    var w = canvas.width, h = canvas.height;
    var src = canvas.getContext('2d').getImageData(0, 0, w, h).data;
    var out = document.createElement('canvas');
    out.width = w; out.height = h;
    var ctx = out.getContext('2d');
    var img = ctx.createImageData(w, h);
    var d = img.data;
    var k = strength === undefined ? 2.2 : strength;

    function lum(x, y) {
      x = (x + w) % w; y = (y + h) % h;
      var i = (y * w + x) * 4;
      return (src[i] * 0.299 + src[i + 1] * 0.587 + src[i + 2] * 0.114) / 255;
    }

    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var tl = lum(x - 1, y - 1), tc = lum(x, y - 1), tr = lum(x + 1, y - 1);
        var ml = lum(x - 1, y), mr = lum(x + 1, y);
        var bl = lum(x - 1, y + 1), bc = lum(x, y + 1), br = lum(x + 1, y + 1);
        var dx = (tr + 2 * mr + br) - (tl + 2 * ml + bl);
        var dy = (bl + 2 * bc + br) - (tl + 2 * tc + tr);
        var nx = -dx * k, ny = -dy * k;
        var len = Math.sqrt(nx * nx + ny * ny + 1);
        var i = (y * w + x) * 4;
        d[i]     = ((nx / len) * 0.5 + 0.5) * 255;
        d[i + 1] = ((ny / len) * 0.5 + 0.5) * 255;
        d[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    var tex = new T.CanvasTexture(out);
    tex.wrapS = tex.wrapT = T.RepeatWrapping;
    if (repeat) tex.repeat.set(repeat[0], repeat[1]);
    return tex;
  }

  function textureFrom(canvas, repeat) {
    var T = window.THREE;
    var tex = new T.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = T.RepeatWrapping;
    if (repeat) tex.repeat.set(repeat[0], repeat[1]);
    return tex;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     GEOMETRY
     ══════════════════════════════════════════════════════════════════════════ */

  /* r128 shipped BufferGeometryUtils separately and 0.147 still wants a second
     file for it, so merge by hand rather than add another network request.
     Bake any transform into the geometry before passing it in — merging is
     also how a few hundred window mullions become one draw call. */
  function mergeGeoms(list) {
    var T = window.THREE;
    var pos = [], norm = [];
    list.forEach(function (g) {
      var gg = g.index ? g.toNonIndexed() : g;
      var p = gg.attributes.position.array;
      for (var i = 0; i < p.length; i++) pos.push(p[i]);
      if (gg.attributes.normal) {
        var n = gg.attributes.normal.array;
        for (var j = 0; j < n.length; j++) norm.push(n[j]);
      }
      if (gg !== g) gg.dispose();
      g.dispose();
    });
    var out = new T.BufferGeometry();
    out.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    if (norm.length === pos.length) {
      out.setAttribute('normal', new T.Float32BufferAttribute(norm, 3));
    } else {
      out.computeVertexNormals();
    }
    return out;
  }

  /* Build a flat-shaded solid from explicit facets.

     Each facet is a list of [x,y,z] corners; it is fanned into triangles and
     every triangle is given the facet's own normal, computed by Newell's
     method. That matters for a cut stone: a facet has to stay optically flat
     even when its four corners are not perfectly coplanar, which they are not
     once the girdle is scalloped. computeVertexNormals() would smooth across
     the facet edges and throw away the entire effect.

     Normals are flipped outward against the centroid rather than trusting the
     winding, because for a solid that is star-shaped about its origin — every
     cut in this file — that is exact, and it removes a whole class of
     invisible bug. */
  function facetSolid(facets) {
    var T = window.THREE;
    var pos = [], nor = [];
    facets.forEach(function (f) {
      var nx = 0, ny = 0, nz = 0, cx = 0, cy = 0, cz = 0, i, a, b;
      for (i = 0; i < f.length; i++) {
        a = f[i]; b = f[(i + 1) % f.length];
        nx += (a[1] - b[1]) * (a[2] + b[2]);
        ny += (a[2] - b[2]) * (a[0] + b[0]);
        nz += (a[0] - b[0]) * (a[1] + b[1]);
        cx += a[0]; cy += a[1]; cz += a[2];
      }
      var L = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      nx /= L; ny /= L; nz /= L;
      cx /= f.length; cy /= f.length; cz /= f.length;
      var flip = (nx * cx + ny * cy + nz * cz) < 0;
      if (flip) { nx = -nx; ny = -ny; nz = -nz; }

      for (var t = 1; t < f.length - 1; t++) {
        var tri = flip ? [f[0], f[t + 1], f[t]] : [f[0], f[t], f[t + 1]];
        for (var v = 0; v < 3; v++) {
          pos.push(tri[v][0], tri[v][1], tri[v][2]);
          nor.push(nx, ny, nz);
        }
      }
    });
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
    return g;
  }

  /* ── The round brilliant ───────────────────────────────────────────────────
     Every proportion below is the Tolkowsky ideal cut, as a fraction of the
     girdle RADIUS (the trade quotes them against the diameter, so they are all
     doubled here): table 56%, crown height 16.2%, girdle 3%, pavilion depth
     43.1%, star length 55%, lower-half length 80%.

     The topology is the real one — 8 bezel kites, 8 star facets, 16 upper
     girdle halves, 8 pavilion mains, 16 lower girdle halves, table and culet.
     57 facets, plus the girdle band itself.

     This matters more than it sounds. The first version of this page cut the
     stone as two open cones, and no amount of material tuning could rescue it:
     a cone has one continuous surface per side, so it produces one continuous
     highlight. The scattered, shifting pinfire that says "diamond" to anyone
     who has held one is not a material property at all. It is many small
     facets at different angles each catching a different part of the room.

     The star and lower-girdle junction points are placed ON the bezel and
     pavilion-main planes, so those facets come out genuinely planar and the
     two halves of the crown meet without a seam.

     Spans -0.894r (culet) to +0.320r (table) about the girdle plane. Derive
     seat heights from CUT rather than guessing them — the first ring had its
     stone parked at a height with no relation to the band and prongs both
     inside and below the girdle. */
  var CUT = {
    table: 0.605,     // table octagon circumradius
    crown: 0.320,     // table height above the girdle plane
    girdle: 0.030,    // half the girdle thickness
    star: 0.802,      // star-point radius
    starY: 0.221,     // star-point height (on the bezel plane)
    pav: 0.894,       // culet depth below the girdle plane
    lgr: 0.200,       // lower-girdle junction radius
    lgrY: -0.735      // lower-girdle junction height (on the pavilion plane)
  };

  function brilliant(radius, segments) {
    var r = radius === undefined ? 1 : radius;
    var C = CUT;
    /* A real girdle is not a cylinder — it is scalloped, thinner where a bezel
       facet meets it and thicker between. Small, and one of those details that
       is only noticed when it is missing. Dropped on the low tier, where the
       stones are also small enough that nobody will look. */
    var wave = (segments !== undefined && segments < 12) || tier() === 0 ? 0 : 1;
    var gt = [], j, k, a;
    for (j = 0; j < 16; j++) gt.push(C.girdle * (wave ? (j % 2 ? 1.30 : 0.74) : 1));

    function ring(count, rad, y, offset) {
      var out = [];
      for (var i = 0; i < count; i++) {
        var ang = (i / count) * Math.PI * 2 + (offset || 0);
        out.push([Math.cos(ang) * rad * r, y * r, Math.sin(ang) * rad * r]);
      }
      return out;
    }

    var Gu = [], Gl = [];
    for (j = 0; j < 16; j++) {
      a = (j / 16) * Math.PI * 2;
      Gu.push([Math.cos(a) * r, gt[j] * r, Math.sin(a) * r]);
      Gl.push([Math.cos(a) * r, -gt[j] * r, Math.sin(a) * r]);
    }
    var Tb = ring(8, C.table, C.crown, 0);                        // table corners
    var St = ring(8, C.star, C.starY, Math.PI / 8);               // star points
    var Lg = ring(8, C.lgr, C.lgrY, Math.PI / 8);                 // lower-girdle junctions
    var culet = [0, -C.pav * r, 0];

    var F = [];
    F.push(Tb.slice());                                            // the table

    for (k = 0; k < 8; k++) {
      var kPrev = (k + 7) % 8;
      // bezel (kite): table corner, the two star points either side, girdle main
      F.push([Tb[k], St[kPrev], Gu[2 * k], St[k]]);
      // star facet: a table edge, apexed at the star point between the kites
      F.push([Tb[k], Tb[(k + 1) % 8], St[k]]);
      // the two upper-girdle halves filling the V between adjacent kites
      F.push([St[k], Gu[2 * k], Gu[2 * k + 1]]);
      F.push([St[k], Gu[2 * k + 1], Gu[(2 * k + 2) % 16]]);
      // pavilion main, and its two lower-girdle halves
      F.push([Gl[2 * k], Lg[k], culet, Lg[kPrev]]);
      F.push([Lg[k], Gl[2 * k], Gl[2 * k + 1]]);
      F.push([Lg[k], Gl[2 * k + 1], Gl[(2 * k + 2) % 16]]);
    }
    for (j = 0; j < 16; j++) {
      var n = (j + 1) % 16;
      F.push([Gu[j], Gl[j], Gl[n], Gu[n]]);                        // girdle band
    }
    return facetSolid(F);
  }

  /* ── Step cut (emerald / Asscher) ──────────────────────────────────────────
     A completely different optical character to a brilliant: long parallel
     facets that flash in broad planes rather than scintillating. Worth having
     because two stones cut the same way on one page look like one stone shown
     twice. */
  function stepCut(radius, opts) {
    var r = radius === undefined ? 1 : radius;
    var o = opts || {};
    var ratio = o.ratio === undefined ? 1 : o.ratio;   // >1 for an emerald cut
    var N = 8;

    function ring(rad, y) {
      var out = [];
      for (var i = 0; i < N; i++) {
        var a = (i / N) * Math.PI * 2 + Math.PI / N;
        out.push([Math.cos(a) * rad * r * ratio, y * r, Math.sin(a) * rad * r]);
      }
      return out;
    }

    var rings = [
      ring(0.60, 0.30),    // table
      ring(0.79, 0.20),
      ring(0.93, 0.10),
      ring(1.00, 0.03),    // girdle, upper
      ring(1.00, -0.03),   // girdle, lower
      ring(0.80, -0.34),
      ring(0.52, -0.66),
      ring(0.22, -0.90)
    ];
    var F = [rings[0].slice()];
    for (var s = 0; s < rings.length - 1; s++) {
      for (var i = 0; i < N; i++) {
        var n = (i + 1) % N;
        F.push([rings[s][i], rings[s][n], rings[s + 1][n], rings[s + 1][i]]);
      }
    }
    var keel = rings[rings.length - 1].slice();
    keel.reverse();
    F.push(keel);
    return facetSolid(F);
  }

  /* ── Rose cut ──────────────────────────────────────────────────────────────
     Flat back, domed front, triangular facets to a point. This is what polki
     actually is, and what a jhumka fringe is actually set with — an uncut
     diamond cleaved and polished rather than a modern brilliant. Also the
     cheapest stone in the file, which is why the fringes use it. */
  function roseCut(radius, points) {
    var r = radius === undefined ? 1 : radius;
    var N = points || 6;
    var base = [], mid = [], i, a;
    for (i = 0; i < N; i++) {
      a = (i / N) * Math.PI * 2;
      base.push([Math.cos(a) * r, 0, Math.sin(a) * r]);
    }
    for (i = 0; i < N; i++) {
      a = (i / N) * Math.PI * 2 + Math.PI / N;
      mid.push([Math.cos(a) * r * 0.58, r * 0.40, Math.sin(a) * r * 0.58]);
    }
    var apex = [0, r * 0.72, 0];
    var F = [base.slice().reverse()];
    for (i = 0; i < N; i++) {
      var n = (i + 1) % N;
      F.push([base[i], base[n], mid[i]]);
      F.push([mid[i], base[n], mid[n]]);
      F.push([mid[i], mid[n], apex]);
    }
    return facetSolid(F);
  }

  /* ── Filleted box ──────────────────────────────────────────────────────────
     Nothing in the physical world has an infinitely sharp edge, and the eye
     knows it: a real edge catches a thin line of light along its whole length.
     A BoxGeometry never can, which is most of why untextured architectural
     massing reads as a diagram. This is the same box with its arrises broken.

     Falls back to a plain box on the low tier, where the extra triangles cost
     more than the highlight is worth. */
  function roundedBox(w, h, d, r, segments) {
    var T = window.THREE;
    r = Math.min(r === undefined ? Math.min(w, h, d) * 0.06 : r,
                 Math.min(w, h, d) / 2 - 0.0001);
    var seg = segments === undefined ? detail(3, 2, 1) : segments;
    if (r <= 0 || tier() === 0 && seg <= 1) return new T.BoxGeometry(w, h, d);

    var sh = new T.Shape();
    var x = -w / 2, y = -h / 2;
    sh.moveTo(x + r, y);
    sh.lineTo(x + w - r, y);
    sh.absarc(x + w - r, y + r, r, -Math.PI / 2, 0);
    sh.lineTo(x + w, y + h - r);
    sh.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2);
    sh.lineTo(x + r, y + h);
    sh.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
    sh.lineTo(x, y + r);
    sh.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5);

    var geo = new T.ExtrudeGeometry(sh, {
      depth: Math.max(0.0001, d - r * 2), bevelEnabled: true,
      bevelThickness: r, bevelSize: r, bevelSegments: seg, curveSegments: seg + 2
    });
    geo.translate(0, 0, -(d - r * 2) / 2);
    geo.computeVertexNormals();
    return geo;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     MATERIALS
     ══════════════════════════════════════════════════════════════════════════ */

  var _maps = {};
  function cachedMap(key, make) {
    if (!_maps[key]) _maps[key] = make();
    return _maps[key];
  }

  /* Generic polished metal. The jewellery flagship's gold is this with its
     defaults; brushed steel or an anodised window frame is the same call with
     a higher roughness and a colder colour.

     The roughness map is the point. A single roughness number gives a surface
     that is equally polished everywhere, which no real object is — light then
     travels across it in one clean sweep and it reads as chrome. Breaking it up
     with polish marks costs one 256px canvas, shared by every metal on the
     page. */
  function metalMaterial(env, opts) {
    var T = window.THREE;
    var o = opts || {};
    var m = new T.MeshStandardMaterial({
      color: o.color === undefined ? 0xd9b65f : o.color,
      metalness: o.metalness === undefined ? 1.0 : o.metalness,
      roughness: o.roughness === undefined ? 0.22 : o.roughness,
      envMap: env,
      envMapIntensity: o.envMapIntensity === undefined ? 1.9 : o.envMapIntensity
    });
    if (o.polish !== false && tier() > 0) {
      m.roughnessMap = cachedMap('polish', function () {
        return textureFrom(scratchCanvas(256, { count: 340, base: 150 }), [3, 3]);
      });
    }
    return m;
  }

  /* A cut stone, driven entirely from the environment.

     metalness 1 on something that is obviously not a metal is the whole trick,
     and it is recorded at the top of this file. iridescence, where the build
     has it, adds the spectral edge that a real stone throws and a metal does
     not — it is doing the job dispersion would do if this were a ray tracer. */
  function gemMaterial(env, opts) {
    var T = window.THREE;
    var o = opts || {};
    var m = new T.MeshPhysicalMaterial({
      color: o.color === undefined ? 0xFFF1D2 : o.color,
      metalness: 1.0,
      roughness: o.roughness === undefined ? 0.035 : o.roughness,
      envMap: env,
      envMapIntensity: o.envMapIntensity === undefined ? 3.1 : o.envMapIntensity,
      flatShading: true,
      side: T.DoubleSide
    });
    if ('iridescence' in m && o.fire !== false) {
      m.iridescence = o.fire === undefined ? 0.42 : o.fire;
      m.iridescenceIOR = 1.8;
      if (m.iridescenceThicknessRange) m.iridescenceThicknessRange = [120, 520];
    }
    return m;
  }

  /* ══════════════════════════════════════════════════════════════════════════
     THE VIEWER
     ══════════════════════════════════════════════════════════════════════════ */

  /* One stylesheet for the on-canvas controls, injected once. Each page tints
     it by setting --n3-* on any ancestor; the defaults are deliberately neutral
     so a page that sets nothing still looks intentional. */
  var CTL_CSS =
    '.n3-ctl{position:absolute;right:12px;bottom:12px;z-index:5;display:flex;' +
    'flex-direction:column;gap:6px;opacity:0;transform:translateY(6px);' +
    'transition:opacity .45s ease,transform .45s ease}' +
    '.n3-ctl.n3-on{opacity:1;transform:none}' +
    '.n3-btn{width:34px;height:34px;padding:0;display:grid;place-items:center;' +
    'border-radius:10px;cursor:pointer;-webkit-appearance:none;appearance:none;' +
    'background:var(--n3-bg,rgba(12,14,20,.66));' +
    'border:1px solid var(--n3-line,rgba(255,255,255,.15));' +
    'color:var(--n3-ink,rgba(255,255,255,.68));' +
    '-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);' +
    'transition:color .25s,border-color .25s,background .25s,transform .25s}' +
    '.n3-btn:hover{color:var(--n3-hot,#fff);border-color:var(--n3-hot,rgba(255,255,255,.4));' +
    'transform:translateY(-1px)}' +
    '.n3-btn:focus-visible{outline:2px solid var(--n3-hot,#fff);outline-offset:2px}' +
    '.n3-btn svg{width:15px;height:15px;display:block;fill:none;stroke:currentColor;' +
    'stroke-width:1.7;stroke-linecap:round}' +
    '.n3-zoom{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);z-index:5;' +
    'font:600 10px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;' +
    'padding:5px 9px;border-radius:99px;pointer-events:none;white-space:nowrap;' +
    'background:var(--n3-bg,rgba(12,14,20,.66));' +
    'border:1px solid var(--n3-line,rgba(255,255,255,.15));' +
    'color:var(--n3-ink,rgba(255,255,255,.72));' +
    'opacity:0;transition:opacity .3s}' +
    '.n3-zoom.n3-on{opacity:1}' +
    '@media(max-width:640px){.n3-btn{width:40px;height:40px}.n3-btn svg{width:17px;height:17px}}' +
    '@media(prefers-reduced-motion:reduce){.n3-ctl,.n3-btn,.n3-zoom{transition:none}}';

  var _cssDone = false;
  function injectCSS() {
    if (_cssDone) return;
    _cssDone = true;
    var st = document.createElement('style');
    st.setAttribute('data-netloom-3d', '');
    st.appendChild(document.createTextNode(CTL_CSS));
    document.head.appendChild(st);
  }

  var ICONS = {
    in: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/>' +
        '<path d="M15.5 15.5 21 21M10.5 7.6v5.8M7.6 10.5h5.8"/></svg>',
    out: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/>' +
         '<path d="M15.5 15.5 21 21M7.6 10.5h5.8"/></svg>',
    reset: '<svg viewBox="0 0 24 24" aria-hidden="true">' +
           '<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v4.4h-4.4"/></svg>'
  };

  /* pointer:coarse is the question actually being asked — is the PRIMARY
     input a finger. hover:none alone matches a headless browser and a few
     desktop setups, which is how a laptop ended up being told to pinch. */
  function touchLikely() {
    try {
      return !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    } catch (e) { return false; }
  }

  /* ── One renderer per canvas ───────────────────────────────────────────────
     Owns the camera rig, the lights, the pointer handling, and the visibility
     gating that stops an off-screen canvas burning battery.

     The camera looks down -Z at a group that carries all the rotation, so
     "zoom" is the camera's distance and "pan" is a translation of both the
     camera and its target. Keeping rotation on the group is what lets frame()
     stay a pure bounding-box fit and every existing builder keep working. */
  function makeStage(canvas, fallbackEl, opts) {
    var T = window.THREE;
    opts = opts || {};

    // Must come off [hidden] before the first resize(): a display:none canvas
    // measures 0x0 and the renderer would come up one pixel square.
    canvas.hidden = false;
    if (fallbackEl) fallbackEl.style.display = 'none';

    var renderer = new T.WebGLRenderer({
      canvas: canvas, antialias: tier() > 0, alpha: true, powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, detail(2, 2, 1.5)));
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = opts.exposure === undefined ? 1.28 : opts.exposure;

    var scene = new T.Scene();
    if (opts.fog) scene.fog = new T.Fog(opts.fog.color, opts.fog.near, opts.fog.far);

    var camera = new T.PerspectiveCamera(opts.fov || 38, 1, 0.1, opts.far || 100);

    var env = envFor(renderer, opts);
    scene.environment = env;

    var L = opts.lights || {};
    scene.add(new T.AmbientLight(0xffffff, L.ambient === undefined ? 0.35 : L.ambient));
    var key = new T.DirectionalLight(L.keyColor || 0xfff3dc, L.key === undefined ? 2.1 : L.key);
    key.position.set(4, 6, 5); scene.add(key);
    var rim = new T.DirectionalLight(L.rimColor || 0xd9b65f, L.rim === undefined ? 1.5 : L.rim);
    rim.position.set(-5, -2, -4); scene.add(rim);
    var fill = new T.PointLight(0xffffff, L.fill === undefined ? 1.1 : L.fill, 22);
    fill.position.set(-3, 3, 4); scene.add(fill);

    /* Shadows are opt-in per stage. They are the cheapest realism available for
       anything that sits on a surface, and pointless for anything that does
       not — a shadow under a floating gem just looks like a mistake. */
    if (opts.shadows && tier() > 0) {
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = T.PCFSoftShadowMap;
      key.castShadow = true;
      var sz = detail(2048, 1024, 512);
      key.shadow.mapSize.set(sz, sz);
      var reach = opts.shadowReach || 14;
      key.shadow.camera.left = -reach; key.shadow.camera.right = reach;
      key.shadow.camera.top = reach; key.shadow.camera.bottom = -reach;
      key.shadow.camera.near = 0.5;
      key.shadow.camera.far = reach * 5;
      key.shadow.bias = -0.0009;
      key.shadow.normalBias = 0.022;
      key.shadow.radius = 2.2;
    }

    var group = new T.Group();
    scene.add(group);

    /* zoom is a multiplier on the framed distance: 1 is "as frame() left it",
       2 is twice as close. Storing it that way means a resize can re-fit the
       model without throwing away the visitor's zoom. */
    var view = {
      base: opts.dist || 6, zoom: 1, want: 1,
      min: opts.minZoom === undefined ? 0.62 : opts.minZoom,
      max: opts.maxZoom === undefined ? 5.0 : opts.maxZoom,
      px: 0, py: 0, wx: 0, wy: 0
    };
    camera.position.set(0, 0, view.base);

    var stage = {
      scene: scene, group: group, env: env, renderer: renderer,
      camera: camera, view: view, key: key,
      tiltLimit: opts.tiltLimit === undefined ? 0.75 : opts.tiltLimit
    };

    function resize() {
      var r = canvas.getBoundingClientRect();
      var w = Math.max(1, r.width), h = Math.max(1, r.height);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    function resizeAndRefit() { resize(); if (stage.__refit) stage.__refit(); }
    resize();
    window.addEventListener('resize', resizeAndRefit, { passive: true });
    // The grid can still be settling on first paint; measure again after it.
    requestAnimationFrame(resizeAndRefit);
    window.addEventListener('load', resizeAndRefit);

    /* Pan is bounded relative to how far in the visitor has zoomed: at the
       framed distance there is nowhere useful to go, and the further in they
       are the more of the model is off-screen and worth reaching. It is not
       possible to lose the object off the edge, which is the failure mode that
       makes people give up on a 3D viewer. */
    function panLimit() {
      return view.base * (0.05 + 0.55 * Math.max(0, 1 - 1 / view.want));
    }

    /* Zoom about a point rather than about the centre, so the thing under the
       cursor or between the fingers stays under it. Without this, zooming into
       a detail means zoom, pan, zoom, pan. */
    function zoomAt(nx, ny, factor) {
      var z0 = view.want;
      var z1 = clamp(z0 * factor, view.min, view.max);
      if (Math.abs(z1 - z0) < 1e-4) return false;
      var t = Math.tan(camera.fov * Math.PI / 360);
      var dh = t * (view.base / z0) - t * (view.base / z1);
      view.wx += nx * camera.aspect * dh;
      view.wy += ny * dh;
      view.want = z1;
      showZoom();
      return true;
    }

    function ndc(clientX, clientY) {
      var r = canvas.getBoundingClientRect();
      return [((clientX - r.left) / r.width) * 2 - 1,
              -((((clientY - r.top) / r.height) * 2) - 1)];
    }

    /* ── Controls ── */
    injectCSS();
    var host = canvas.parentNode;
    var ctl = null, zoomTag = null, zoomTimer = 0;
    if (host && opts.controls !== false) {
      ctl = document.createElement('div');
      ctl.className = 'n3-ctl';
      ctl.setAttribute('role', 'group');
      ctl.setAttribute('aria-label', opts.controlsLabel || '3D view controls');
      [['in', 'Zoom in'], ['out', 'Zoom out'], ['reset', 'Reset the view']].forEach(function (b) {
        var el = document.createElement('button');
        el.type = 'button';
        el.className = 'n3-btn';
        el.setAttribute('aria-label', b[1]);
        el.innerHTML = ICONS[b[0]];
        el.addEventListener('click', function () {
          armed = true;
          if (b[0] === 'reset') stage.reset();
          else zoomAt(0, 0, b[0] === 'in' ? 1.45 : 1 / 1.45);
        });
        ctl.appendChild(el);
      });
      host.appendChild(ctl);
      setTimeout(function () { ctl.classList.add('n3-on'); }, 700);

      zoomTag = document.createElement('div');
      zoomTag.className = 'n3-zoom';
      host.appendChild(zoomTag);
    }

    function showZoom() {
      if (!zoomTag) return;
      zoomTag.textContent = (view.want).toFixed(1).replace(/\.0$/, '') + '×';
      zoomTag.classList.add('n3-on');
      clearTimeout(zoomTimer);
      zoomTimer = setTimeout(function () { zoomTag.classList.remove('n3-on'); }, 1100);
    }

    /* The hint. Worth owning here rather than in each page, because the right
       words depend on what the visitor is holding. */
    var hintEl = opts.hint || null;
    if (hintEl) {
      var label = touchLikely() ? 'Drag to turn · pinch to zoom'
                                : 'Drag to turn · scroll to zoom';
      var lastNode = hintEl.lastChild;
      if (lastNode && lastNode.nodeType === 3) lastNode.nodeValue = ' ' + label;
      else hintEl.appendChild(document.createTextNode(' ' + label));
      setTimeout(function () { hintEl.classList.add('show'); }, opts.hintDelay || 1000);
    }
    var hintKilled = false;
    function killHint() {
      if (hintKilled || !hintEl) return;
      hintKilled = true;
      hintEl.classList.remove('show');
    }

    /* ── Pointer handling ──────────────────────────────────────────────────
       One pointer orbits. Two pinch to zoom and drag to pan. Pointer Events
       rather than separate mouse and touch paths, because the two-finger case
       is unwritable with the old touch API without tracking identifiers by
       hand anyway.

       touch-action stays pan-y in the stylesheet, so a one-finger vertical
       swipe still scrolls the page — these canvases are most of a phone
       screen, and a visitor who cannot scroll past the hero has been trapped
       by the demo. It is switched to none for the duration of a two-finger
       gesture, which is unambiguously aimed at the model. */
    var pts = {}, nPts = 0;
    var velX = 0, velY = 0, idle = 0;
    var spin = opts.idleSpin === undefined ? 0.0004 : opts.idleSpin;
    var tiltLimit = opts.tiltLimit === undefined ? 0.75 : opts.tiltLimit;
    var pinchDist = 0, pinchMid = null;
    var armed = false, lastTap = 0, tapX = 0, tapY = 0;
    var savedTouch = canvas.style.touchAction;

    function ids() { return Object.keys(pts); }

    function down(e) {
      if (nPts >= 2) return;
      pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      nPts++;
      armed = true;
      idle = 0;
      killHint();
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* not fatal */ }
      if (nPts === 2) {
        canvas.style.touchAction = 'none';
        var k = ids();
        pinchDist = dist(pts[k[0]], pts[k[1]]);
        pinchMid = mid(pts[k[0]], pts[k[1]]);
      } else {
        canvas.style.cursor = 'grabbing';
      }
    }

    function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
    function mid(a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }

    function move(e) {
      var p = pts[e.pointerId];
      if (!p) return;
      var dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;

      if (nPts === 1) {
        /* Divided by the zoom, so a drag turns the model by the same angle
           however far in the visitor is — otherwise a close-up becomes
           uncontrollable. */
        var s = 1 / Math.sqrt(view.want);
        velY += dx * 0.0055 * s;
        velX += dy * 0.0045 * s;
        if (e.cancelable && e.pointerType !== 'mouse') e.preventDefault();
        return;
      }

      var k = ids();
      if (k.length < 2) return;
      var a = pts[k[0]], b = pts[k[1]];
      var nd = dist(a, b), nm = mid(a, b);
      if (pinchDist > 0 && nd > 0) {
        var c = ndc(nm.x, nm.y);
        zoomAt(c[0], c[1], nd / pinchDist);
      }
      if (pinchMid) {
        /* Move the world under the fingers: at the plane the model sits on, a
           screen pixel is this many world units. */
        var t = Math.tan(camera.fov * Math.PI / 360) * (view.base / view.want);
        var r = canvas.getBoundingClientRect();
        view.wx -= (nm.x - pinchMid.x) / r.height * 2 * t;
        view.wy += (nm.y - pinchMid.y) / r.height * 2 * t;
      }
      pinchDist = nd; pinchMid = nm;
      if (e.cancelable) e.preventDefault();
    }

    function up(e) {
      if (!pts[e.pointerId]) return;
      delete pts[e.pointerId];
      nPts = Math.max(0, nPts - 1);
      try { canvas.releasePointerCapture(e.pointerId); } catch (err) { /* fine */ }
      if (nPts < 2) { pinchDist = 0; pinchMid = null; }
      if (nPts === 0) {
        canvas.style.cursor = 'grab';
        canvas.style.touchAction = savedTouch;
        if (e.type === 'pointerup' && e.pointerType !== 'mouse') {
          var now = Date.now();
          if (now - lastTap < 320 && Math.hypot(e.clientX - tapX, e.clientY - tapY) < 30) {
            var c = ndc(e.clientX, e.clientY);
            if (view.want > 1.3) stage.reset(); else zoomAt(c[0], c[1], 2.1);
            lastTap = 0;
          } else { lastTap = now; tapX = e.clientX; tapY = e.clientY; }
        }
      } else if (nPts === 1) {
        var k = ids();
        if (k.length === 1) { pinchDist = 0; pinchMid = null; }
      }
    }

    canvas.style.cursor = 'grab';
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move, { passive: false });
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('pointerleave', function (e) {
      if (e.pointerType === 'mouse' && nPts === 0) armed = false;
    });

    /* ── Wheel ─────────────────────────────────────────────────────────────
       The hard problem on this page. A hero canvas can be most of a laptop
       screen, and a viewer that swallows the wheel means a visitor scrolling
       down the page gets stuck in a diamond. A viewer that ignores it is not a
       viewer.

       So: the wheel zooms only once the canvas has been engaged — a click, a
       drag, a tap on the controls — and stops again when the pointer leaves.
       Someone passing through scrolls past untouched; someone who has started
       turning the piece gets the wheel they expect. Ctrl or Cmd always zooms,
       because that is the trackpad pinch and the browser's own convention.

       At either end of the range the event is left alone, so the page scrolls
       on rather than the wheel dying against a limit. */
    canvas.addEventListener('wheel', function (e) {
      if (!armed && !(e.ctrlKey || e.metaKey)) return;
      var step = e.deltaY * (e.deltaMode === 1 ? 16 : (e.deltaMode === 2 ? 100 : 1));
      var c = ndc(e.clientX, e.clientY);
      if (zoomAt(c[0], c[1], Math.pow(0.9985, step))) {
        killHint();
        if (e.cancelable) e.preventDefault();
      }
    }, { passive: false });

    canvas.addEventListener('dblclick', function (e) {
      armed = true;
      var c = ndc(e.clientX, e.clientY);
      if (view.want > 1.3) stage.reset(); else zoomAt(c[0], c[1], 2.1);
    });

    /* Keyboard, so the viewer is operable without a pointer at all. */
    if (!canvas.hasAttribute('tabindex')) canvas.setAttribute('tabindex', '0');
    canvas.addEventListener('keydown', function (e) {
      var k = e.key, used = true;
      armed = true;
      if (k === 'ArrowLeft') velY -= 0.05;
      else if (k === 'ArrowRight') velY += 0.05;
      else if (k === 'ArrowUp') velX -= 0.04;
      else if (k === 'ArrowDown') velX += 0.04;
      else if (k === '+' || k === '=') zoomAt(0, 0, 1.35);
      else if (k === '-' || k === '_') zoomAt(0, 0, 1 / 1.35);
      else if (k === '0' || k === 'Escape') stage.reset();
      else used = false;
      if (used) { idle = 0; killHint(); e.preventDefault(); }
    });
    canvas.addEventListener('blur', function () { armed = false; });

    stage.reset = function () {
      view.want = 1; view.wx = 0; view.wy = 0;
      velX = 0; velY = 0; idle = 0;
      if (opts.home) group.rotation.set(opts.home[0], opts.home[1], opts.home[2]);
      showZoom();
    };

    // Do not burn battery on an off-screen canvas or a background tab.
    var visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; },
        { threshold: 0.02 }).observe(canvas);
    }

    function tick() {
      requestAnimationFrame(tick);
      if (!visible || document.hidden) return;

      if (nPts === 0) {
        idle += 1;
        // Slower the further in the visitor is: the same angular rate reads as
        // much faster when the piece fills the frame.
        velY += (idle > 90 ? spin / view.zoom : 0);   // settles near 20 deg/sec
      }
      velX *= 0.94; velY *= 0.94;
      group.rotation.y += velY;
      group.rotation.x = clamp(group.rotation.x + velX, -tiltLimit, tiltLimit);

      var lim = panLimit();
      view.wx = clamp(view.wx, -lim, lim);
      view.wy = clamp(view.wy, -lim, lim);
      view.zoom += (view.want - view.zoom) * 0.16;
      view.px += (view.wx - view.px) * 0.18;
      view.py += (view.wy - view.py) * 0.18;

      camera.position.set(view.px, view.py, view.base / view.zoom);
      camera.lookAt(view.px, view.py, 0);

      if (stage.onFrame) stage.onFrame(stage);
      renderer.render(scene, camera);
    }
    tick();

    return stage;
  }

  /* Recentre a group on its own bounding box and pull the camera back to fit
     it. Without this, composition depends on every hand-tuned offset being
     right: the first solitaire's box centre sat between the band and the
     stone, so it rotated about a point in mid-air and drifted out of frame.

     Writes the fitted distance into stage.view.base, which the zoom is a
     multiplier on — so a resize refits the model without discarding whatever
     the visitor had zoomed to. */
  function frame(stage, group, pad) {
    var T = window.THREE;

    /* Measure with the group's own rotation taken off.

       Box3.setFromObject() reports a WORLD-space box, but the recentring below
       subtracts that centre from LOCAL child positions. On an unrotated group
       those two spaces coincide and it works; on a rotated one — which every
       piece here is, so it presents at three-quarters — the correction is
       applied along the wrong axes and the model ends up off-centre and
       undersized. Zeroing the rotation first makes local and world the same
       space again, and it is also the right frame to measure the spin extents
       in, since rotation about Y must not change the fit at all. */
    var rot = group.rotation.clone();
    group.rotation.set(0, 0, 0);
    group.updateMatrixWorld(true);

    /* Children flagged n3ignoreFrame are moved with everything else but do not
       get a vote on the fit. Site context is the reason: a tower needs a
       ground plane, a road and some neighbours to stop reading as a diagram,
       but those are thirty units across against a five-unit building, so
       fitting them puts the camera so far back the tower becomes a splinter.
       The subject decides the framing; the setting just comes along. */
    var box = new T.Box3(), tmp = new T.Box3();
    group.children.forEach(function (ch) {
      if (ch.userData && ch.userData.n3ignoreFrame) return;
      box.union(tmp.setFromObject(ch));
    });
    if (box.isEmpty()) box.setFromObject(group);
    if (box.isEmpty()) { group.rotation.copy(rot); return; }
    var c = box.getCenter(new T.Vector3());
    group.children.forEach(function (ch) { ch.position.sub(c); });

    /* Fit the bounding CYLINDER about the Y axis, not the bounding sphere.
       These groups spin freely about Y and are clamped in X to tiltLimit, so
       the sphere is a much larger volume than anything the model can actually
       occupy — and it is paid for in dead margin around every wide, flat
       object. A floor plan is 12 m across and 2.4 m tall; fitting its sphere
       throws away most of the frame. */
    group.updateMatrixWorld(true);
    var b = new T.Box3(), t2 = new T.Box3();
    group.children.forEach(function (ch) {
      if (ch.userData && ch.userData.n3ignoreFrame) return;
      b.union(t2.setFromObject(ch));
    });
    if (b.isEmpty()) b.setFromObject(group);
    var rH = 0;
    [b.min.x, b.max.x].forEach(function (x) {
      [b.min.z, b.max.z].forEach(function (z) { rH = Math.max(rH, Math.hypot(x, z)); });
    });
    var hY = Math.max(Math.abs(b.max.y), Math.abs(b.min.y));
    group.rotation.copy(rot);
    group.updateMatrixWorld(true);

    /* Worst case under tilt. Fitting the full tiltLimit is correct but costs
       real frame at rest, so only two thirds of it is reserved — a visitor who
       tilts all the way to the stop crops the piece slightly, which is a far
       better trade than every piece sitting small forever. */
    var tilt = (stage.tiltLimit || 0) * 0.66;
    var vExt = hY * Math.cos(tilt) + rH * Math.sin(tilt);

    var cam = stage.camera;
    var vFov = cam.fov * Math.PI / 180;
    var hFov = 2 * Math.atan(Math.tan(vFov / 2) * cam.aspect);
    var dist = Math.max(vExt / Math.tan(vFov / 2), rH / Math.tan(hFov / 2)) * (pad || 1.15);
    if (stage.view) stage.view.base = dist;
    cam.position.set(0, 0, dist);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
    stage.__radius = Math.max(rH, hY);
  }

  /* Walk a subtree and turn shadows on. Cheaper to say once here than to set
     two flags on every mesh at every call site, and forgetting one is the kind
     of thing only a screenshot catches. */
  function castAll(obj, cast, receive) {
    obj.traverse(function (o) {
      if (!o.isMesh) return;
      o.castShadow = cast !== false;
      o.receiveShadow = receive !== false;
    });
  }

  /* A shadow-catching floor, sat directly under whatever has just been framed.
     ShadowMaterial draws nothing but the shadow, so the page background shows
     through and the piece reads as resting on the surface it is photographed
     on rather than on an added grey disc. */
  function groundShadow(stage, group, opts) {
    var T = window.THREE;
    var o = opts || {};
    group.updateMatrixWorld(true);
    var box = new T.Box3().setFromObject(group);
    if (box.isEmpty()) return null;
    var size = (o.size || 6) * Math.max(box.max.x - box.min.x, box.max.z - box.min.z);
    var m = new T.Mesh(
      new T.PlaneGeometry(size, size),
      new T.ShadowMaterial({ opacity: o.opacity === undefined ? 0.42 : o.opacity })
    );
    m.rotation.x = -Math.PI / 2;
    m.position.y = box.min.y - (o.drop || 0.01);
    m.receiveShadow = true;
    m.userData.n3ground = true;
    group.add(m);
    return m;
  }

  /* Empty a group and release what it held. Called on every piece switch, so
     anything leaked here leaks once per click. Shared maps are cached and
     handed out repeatedly, so they are deliberately not disposed. */
  function clearGroup(g) {
    for (var i = g.children.length - 1; i >= 0; i--) {
      var ch = g.children[i];
      g.remove(ch);
      if (ch.traverse) {
        ch.traverse(function (o) {
          if (o.geometry) o.geometry.dispose();
          if (o.material) {
            (Array.isArray(o.material) ? o.material : [o.material])
              .forEach(function (m) { m.dispose(); });
          }
        });
      }
    }
  }

  var API = {
    boot: boot,
    shouldLoad: shouldLoad,
    webglOK: webglOK,
    reducedMotion: reducedMotion,
    tier: tier,
    detail: detail,
    studioEnv: studioEnv,
    envFor: envFor,
    softbox: softbox,
    makeStage: makeStage,
    frame: frame,
    clearGroup: clearGroup,
    castAll: castAll,
    groundShadow: groundShadow,
    mergeGeoms: mergeGeoms,
    facetSolid: facetSolid,
    brilliant: brilliant,
    stepCut: stepCut,
    roseCut: roseCut,
    roundedBox: roundedBox,
    metalMaterial: metalMaterial,
    gemMaterial: gemMaterial,
    noiseCanvas: noiseCanvas,
    scratchCanvas: scratchCanvas,
    normalFrom: normalFrom,
    textureFrom: textureFrom,
    CUT: CUT,
    GEM_ENV: GEM_ENV,
    THREE_SRC: THREE_SRC
  };
  return API;
})();
