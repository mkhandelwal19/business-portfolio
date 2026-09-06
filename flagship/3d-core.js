/* =============================================================================
   flagship/3d-core.js — shared WebGL core for the Netloom flagship demos
   -----------------------------------------------------------------------------
   Extracted from jewellery-lux, which held all of this inline. Three flagships
   hand-copying a renderer, a drag controller and an auto-framing routine will
   drift, and the same bug will need finding three times.

   Loads as a plain script and defines window.Netloom3D. No modules: three.js
   0.147.0 is the last clean UMD build on cdnjs (r150+ warns, r160 dropped UMD
   entirely, r128 has no transmission/ior), and pulling a module graph into a
   single self-contained page buys nothing here.

   Lessons already paid for by the first flagship, encoded as defaults:

     - A gem needs metalness 1.0. A physically-correct dielectric reflects only
       ~4% of its environment head-on; the other 96% is flat diffuse colour,
       which renders as white plastic. Drive the surface from the environment.

     - Facet sparkle IS environment contrast. The env map wants hard-edged
       bright bands over near-black. A smooth gradient reflects as a smooth,
       dull stone.

     - Do not use real transmission on these pages. It needs something behind
       the object to refract, and there is only page background, so it goes
       dark.

     - Reveal the canvas before the first resize(). A [hidden] canvas measures
       0x0 and the renderer comes up 1x1.

     - Auto-frame every piece. frame() recentres on the bounding box and fits
       the camera, so composition never depends on hand-tuned offsets.
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

  /* ── Painted studio environment ────────────────────────────────────────────
     One bright key band and a warm bounce is all a faceted surface needs to
     read as lit. Painted into a canvas rather than downloaded, so the page
     stays at a single network request.

     The hard band edges are the entire point — see the note at the top. */
  var ENV_DEFAULTS = {
    base: [[0.00, '#000000'], [0.40, '#2a2011'], [0.55, '#0d0a06'], [1.00, '#000000']],
    bands: [[92, 26, '#ffffff'], [124, 10, '#fff3d6'], [168, 34, '#ffe9b8'],
            [214, 8, '#ffffff'], [262, 18, '#d9b65f'], [318, 10, '#8a6e2c']],
    flares: [[200, 108, 78], [640, 150, 62], [860, 96, 50]],
    bounce: ['rgba(122, 88, 30, 0)', 'rgba(168, 124, 44, .55)']
  };

  function studioEnv(renderer, opts) {
    var T = window.THREE;
    var o = opts || {};
    var base = o.base || ENV_DEFAULTS.base;
    var bands = o.bands || ENV_DEFAULTS.bands;
    var flares = o.flares || ENV_DEFAULTS.flares;
    var bounce = o.bounce || ENV_DEFAULTS.bounce;

    var c = document.createElement('canvas');
    c.width = 1024; c.height = 512;
    var g = c.getContext('2d');

    var grad = g.createLinearGradient(0, 0, 0, 512);
    base.forEach(function (st) { grad.addColorStop(st[0], st[1]); });
    g.fillStyle = grad;
    g.fillRect(0, 0, 1024, 512);

    bands.forEach(function (b) { g.fillStyle = b[2]; g.fillRect(0, b[0], 1024, b[1]); });

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

    var tex = new T.CanvasTexture(c);
    tex.mapping = T.EquirectangularReflectionMapping;
    var pm = new T.PMREMGenerator(renderer);
    pm.compileEquirectangularShader();
    var env = pm.fromEquirectangular(tex).texture;
    pm.dispose(); tex.dispose();
    return env;
  }

  /* r128 shipped BufferGeometryUtils separately and 0.147 still wants a second
     file for it, so merge by hand rather than add another network request. */
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
    }
    out.computeVertexNormals();
    return out;
  }

  /* A brilliant cut is a shallow crown over a deep pavilion. Two open cones
     with flat shading and a low segment count give the facets for free.

     It spans -1.32r to +0.42r from the girdle. Derive seat heights from that
     rather than guessing — the first ring had its stone parked at a height
     with no relation to the band, and prongs both inside and below the
     girdle. */
  function brilliant(radius, segments) {
    var T = window.THREE;
    segments = segments || 16;
    var crown = new T.CylinderGeometry(radius * 0.56, radius, radius * 0.42, segments, 1, true);
    crown.translate(0, radius * 0.21, 0);
    var pav = new T.CylinderGeometry(radius, 0.0001, radius * 1.32, segments, 1, true);
    pav.translate(0, -radius * 0.66, 0);
    var table = new T.CircleGeometry(radius * 0.56, segments);
    table.rotateX(-Math.PI / 2);
    table.translate(0, radius * 0.42, 0);
    return mergeGeoms([crown, pav, table]);
  }

  /* Generic polished metal. The jewellery flagship's gold is this with its
     defaults; brushed steel or an anodised window frame is the same call with
     a higher roughness and a colder colour. */
  function metalMaterial(env, opts) {
    var T = window.THREE;
    var o = opts || {};
    return new T.MeshStandardMaterial({
      color: o.color === undefined ? 0xd9b65f : o.color,
      metalness: o.metalness === undefined ? 1.0 : o.metalness,
      roughness: o.roughness === undefined ? 0.22 : o.roughness,
      envMap: env,
      envMapIntensity: o.envMapIntensity === undefined ? 1.9 : o.envMapIntensity
    });
  }

  /* ── One renderer per canvas ───────────────────────────────────────────────
     Owns the camera, the lights, drag-with-inertia, and the visibility gating
     that stops an off-screen canvas burning battery. */
  function makeStage(canvas, fallbackEl, opts) {
    var T = window.THREE;
    opts = opts || {};

    // Must come off [hidden] before the first resize(): a display:none canvas
    // measures 0x0 and the renderer would come up one pixel square.
    canvas.hidden = false;
    if (fallbackEl) fallbackEl.style.display = 'none';

    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = opts.exposure === undefined ? 1.28 : opts.exposure;

    var scene = new T.Scene();
    var camera = new T.PerspectiveCamera(opts.fov || 38, 1, 0.1, opts.far || 100);
    camera.position.set(0, 0, opts.dist || 6.2);

    var env = opts.env || studioEnv(renderer, opts.envOpts);
    scene.environment = env;

    var L = opts.lights || {};
    scene.add(new T.AmbientLight(0xffffff, L.ambient === undefined ? 0.35 : L.ambient));
    var key = new T.DirectionalLight(L.keyColor || 0xfff3dc, L.key === undefined ? 2.1 : L.key);
    key.position.set(4, 6, 5); scene.add(key);
    var rim = new T.DirectionalLight(L.rimColor || 0xd9b65f, L.rim === undefined ? 1.5 : L.rim);
    rim.position.set(-5, -2, -4); scene.add(rim);
    var fill = new T.PointLight(0xffffff, L.fill === undefined ? 1.1 : L.fill, 22);
    fill.position.set(-3, 3, 4); scene.add(fill);

    var group = new T.Group();
    scene.add(group);
    var stage = { scene: scene, group: group, env: env, renderer: renderer, camera: camera };

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

    /* Drag to rotate, with inertia; idles into a slow turn so the piece is
       never sitting dead still when someone scrolls past it. */
    var velX = 0, velY = 0, dragging = false, lastX = 0, lastY = 0, idle = 0;
    var spin = opts.idleSpin === undefined ? 0.0004 : opts.idleSpin;
    var tiltLimit = opts.tiltLimit === undefined ? 0.75 : opts.tiltLimit;

    function down(e) {
      dragging = true; idle = 0;
      var p = e.touches ? e.touches[0] : e;
      lastX = p.clientX; lastY = p.clientY;
      canvas.style.cursor = 'grabbing';
    }
    function move(e) {
      if (!dragging) return;
      var p = e.touches ? e.touches[0] : e;
      velY += (p.clientX - lastX) * 0.0055;
      velX += (p.clientY - lastY) * 0.0045;
      lastX = p.clientX; lastY = p.clientY;
      if (e.cancelable && e.touches) e.preventDefault();
    }
    function up() { dragging = false; canvas.style.cursor = 'grab'; }

    canvas.style.cursor = 'grab';
    canvas.addEventListener('mousedown', down);
    window.addEventListener('mousemove', move, { passive: false });
    window.addEventListener('mouseup', up);
    canvas.addEventListener('touchstart', down, { passive: true });
    canvas.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);

    // Do not burn battery on an off-screen canvas or a background tab.
    var visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; },
        { threshold: 0.02 }).observe(canvas);
    }

    function tick() {
      requestAnimationFrame(tick);
      if (!visible || document.hidden) return;
      if (!dragging) {
        idle += 1;
        velY += (idle > 90 ? spin : 0);   // settles near 20 deg/sec
      }
      velX *= 0.94; velY *= 0.94;
      group.rotation.y += velY;
      group.rotation.x += velX;
      group.rotation.x = Math.max(-tiltLimit, Math.min(tiltLimit, group.rotation.x));
      if (stage.onFrame) stage.onFrame(stage);
      renderer.render(scene, camera);
    }
    tick();

    return stage;
  }

  /* Recentre a group on its own bounding box and pull the camera back to fit
     it. Without this, composition depends on every hand-tuned offset being
     right: the first solitaire's box centre sat between the band and the
     stone, so it rotated about a point in mid-air and drifted out of frame. */
  function frame(stage, group, pad) {
    var T = window.THREE;
    group.updateMatrixWorld(true);
    var box = new T.Box3().setFromObject(group);
    if (box.isEmpty()) return;
    var c = box.getCenter(new T.Vector3());
    group.children.forEach(function (ch) { ch.position.sub(c); });

    group.updateMatrixWorld(true);
    var sph = new T.Box3().setFromObject(group).getBoundingSphere(new T.Sphere());
    var cam = stage.camera;
    var vFov = cam.fov * Math.PI / 180;
    var hFov = 2 * Math.atan(Math.tan(vFov / 2) * cam.aspect);
    var dist = (sph.radius * (pad || 1.3)) / Math.sin(Math.min(vFov, hFov) / 2);
    cam.position.set(0, 0, dist);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  }

  /* Empty a group and release what it held. Called on every piece switch, so
     anything leaked here leaks once per click. */
  function clearGroup(g) {
    for (var i = g.children.length - 1; i >= 0; i--) {
      var ch = g.children[i];
      g.remove(ch);
      if (ch.geometry) ch.geometry.dispose();
      if (ch.material) {
        (Array.isArray(ch.material) ? ch.material : [ch.material])
          .forEach(function (m) { m.dispose(); });
      }
    }
  }

  var API = {
    boot: boot,
    shouldLoad: shouldLoad,
    webglOK: webglOK,
    reducedMotion: reducedMotion,
    studioEnv: studioEnv,
    makeStage: makeStage,
    frame: frame,
    clearGroup: clearGroup,
    mergeGeoms: mergeGeoms,
    brilliant: brilliant,
    metalMaterial: metalMaterial,
    THREE_SRC: THREE_SRC
  };
  return API;
})();
