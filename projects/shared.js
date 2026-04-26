/* Shared subpage 3D hero scene + reveals */
(function(){
  const THREE = window.THREE;

  // Scroll progress bar
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  document.body.prepend(bar);
  window.addEventListener('scroll', () => {
    const h = document.documentElement;
    bar.style.transform = `scaleX(${h.scrollTop / (h.scrollHeight - h.clientHeight)})`;
  }, {passive:true});

  // Nav scroll state
  const pnav = document.querySelector('.pnav');
  if (pnav){
    window.addEventListener('scroll', () => pnav.classList.toggle('scrolled', window.scrollY > 40), {passive:true});
  }

  // Mobile browsers are more reliable with real <img> tags than CSS-only
  // remote backgrounds, so hydrate shared hero/gallery media from the same URL.
  document.querySelectorAll('.hero-art.photo-hero, .gshot .s').forEach(el => {
    const inlineBackground = el.style.background || '';
    const inlineBackgroundImage = el.style.backgroundImage || '';
    const source = inlineBackground || inlineBackgroundImage;
    const urlMatch = source.match(/url\((['"]?)(.*?)\1\)/i);
    if (!urlMatch || el.querySelector('.bg-image-layer')) return;

    const img = document.createElement('img');
    img.className = 'bg-image-layer';
    img.src = urlMatch[2];
    img.alt = '';
    img.decoding = 'async';
    img.loading = el.closest('.p-hero') ? 'eager' : 'lazy';
    if (el.closest('.p-hero')) img.fetchPriority = 'high';
    el.prepend(img);

    if (inlineBackground){
      const layeredMatch = inlineBackground.match(/^(.*),\s*url\((['"]?)(.*?)\2\)(.*)$/i);
      if (layeredMatch){
        el.style.setProperty('--bg-overlay', layeredMatch[1].trim());
        el.style.background = 'none';
      }
    }

    if (inlineBackgroundImage){
      el.style.backgroundImage = 'none';
    }
  });

  // Reveals with fallback: hero content should never wait on scroll timing.
  const revealEls = Array.from(document.querySelectorAll('.reveal'));
  const revealVisible = () => {
    revealEls.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.92 && r.bottom > 0) el.classList.add('in');
    });
  };

  revealEls.forEach(el => {
    if (el.closest('.p-hero')) el.classList.add('in');
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting){
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.01, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(el => {
    if (!el.classList.contains('in')) io.observe(el);
  });

  requestAnimationFrame(revealVisible);
  window.addEventListener('load', revealVisible, { once:true });
  setTimeout(() => document.body.classList.add('ready'), 1500);

  // 3D tilt on cards (mv-card, feature, result, step)
  document.querySelectorAll('.feature').forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--fx', ((e.clientX - r.left)/r.width*100) + '%');
      el.style.setProperty('--fy', ((e.clientY - r.top)/r.height*100) + '%');
    });
  });

  // Smooth anchor
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href').slice(1);
      const t = document.getElementById(id);
      if (!t) return;
      e.preventDefault();
      window.scrollTo({top: t.getBoundingClientRect().top + window.scrollY - 70, behavior:'smooth'});
    });
  });

  // Hero canvas — floating particles + dodecahedron
  const canvas = document.getElementById('p-hero-canvas');
  if (canvas && THREE){
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0A0F1E, 0.08);
    const cam = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 100);
    cam.position.set(0,0,8);
    const rn = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
    rn.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rn.setSize(window.innerWidth, window.innerHeight);

    const c = 1200, g = new THREE.BufferGeometry();
    const pos = new Float32Array(c*3);
    for (let i=0;i<c;i++){
      const r = 6 + Math.random()*14;
      const th = Math.random()*Math.PI*2;
      const ph = Math.acos(2*Math.random()-1);
      pos[i*3]=r*Math.sin(ph)*Math.cos(th);
      pos[i*3+1]=r*Math.sin(ph)*Math.sin(th)*0.55;
      pos[i*3+2]=r*Math.cos(ph)-4;
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos,3));

    const sc = document.createElement('canvas'); sc.width=sc.height=64;
    const sx = sc.getContext('2d');
    const gr = sx.createRadialGradient(32,32,0,32,32,32);
    gr.addColorStop(0,'rgba(232,201,119,1)');
    gr.addColorStop(0.3,'rgba(201,168,76,0.8)');
    gr.addColorStop(1,'rgba(201,168,76,0)');
    sx.fillStyle=gr; sx.fillRect(0,0,64,64);
    const tex = new THREE.CanvasTexture(sc);

    const pts = new THREE.Points(g, new THREE.PointsMaterial({
      size:0.13, map:tex, transparent:true, depthWrite:false,
      blending:THREE.AdditiveBlending, sizeAttenuation:true, color:0xE8C977
    }));
    scene.add(pts);

    const dod = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.4, 1)),
      new THREE.LineBasicMaterial({color:0xC9A84C, transparent:true, opacity:0.2})
    );
    scene.add(dod);

    let tmx=0,tmy=0,mx=0,my=0,sy=0;
    window.addEventListener('mousemove', e => {
      tmx=(e.clientX/window.innerWidth-0.5);
      tmy=(e.clientY/window.innerHeight-0.5);
    });
    window.addEventListener('scroll', () => sy = window.scrollY);
    window.addEventListener('resize', () => {
      cam.aspect=window.innerWidth/window.innerHeight; cam.updateProjectionMatrix();
      rn.setSize(window.innerWidth, window.innerHeight);
    });

    const start = performance.now();
    (function loop(){
      const t = (performance.now()-start)/1000;
      mx += (tmx-mx)*0.04; my += (tmy-my)*0.04;
      pts.rotation.y = t*0.04 + mx*0.3;
      pts.rotation.x = my*0.2;
      dod.rotation.x = t*0.08; dod.rotation.y = t*0.12;
      cam.position.y = -sy*0.0015; cam.position.x = mx*0.5;
      cam.lookAt(0,-sy*0.001,0);
      rn.render(scene,cam);
      requestAnimationFrame(loop);
    })();
  }

  // Product visual — rich 3D website mockup card
  const vcanvas = document.getElementById('p-visual-canvas');
  if (vcanvas && THREE && window.PRODUCT_CONFIG){
    const cfg = window.PRODUCT_CONFIG;
    const goldColor = cfg.accentColor || 0xC9A84C;
    const w = () => vcanvas.clientWidth || 400;
    const h = () => vcanvas.clientHeight || 400;
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(42, w()/h(), 0.1, 100);
    cam.position.set(0,0,5.5);
    const rn = new THREE.WebGLRenderer({canvas:vcanvas, antialias:true, alpha:true});
    rn.setPixelRatio(Math.min(window.devicePixelRatio,2));
    rn.setSize(w(), h(), false);

    const group = new THREE.Group();
    scene.add(group);

    // Main device card (phone-like aspect)
    const card = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 3.8, 0.09),
      new THREE.MeshStandardMaterial({color:0x0E1527, metalness:0.5, roughness:0.4, emissive:0x080e1c, emissiveIntensity:0.3})
    );
    group.add(card);

    // Gold edge wireframe
    card.add(new THREE.LineSegments(
      new THREE.EdgesGeometry(card.geometry),
      new THREE.LineBasicMaterial({color:goldColor, transparent:true, opacity:0.6})
    ));

    // Notch at top (phone detail)
    const notch = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.14, 0.092),
      new THREE.MeshBasicMaterial({color:0x060a12})
    );
    notch.position.set(0, 1.77, 0);
    card.add(notch);

    // Hero image area (category-tinted)
    const heroBlock = new THREE.Mesh(
      new THREE.PlaneGeometry(1.9, 1.2),
      new THREE.MeshBasicMaterial({color: cfg.heroColor || goldColor, transparent:true, opacity:0.65})
    );
    heroBlock.position.set(0, 0.85, 0.046);
    card.add(heroBlock);

    // Hero glow overlay
    const heroGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.9, 1.2),
      new THREE.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:0.06})
    );
    heroGlow.position.set(0, 0.85, 0.047);
    card.add(heroGlow);

    // Gold accent divider
    const divider = new THREE.Mesh(
      new THREE.PlaneGeometry(1.7, 0.025),
      new THREE.MeshBasicMaterial({color:goldColor})
    );
    divider.position.set(0, 0.23, 0.046);
    card.add(divider);

    // Text content bars (varying widths)
    const barWidths = [1.5, 1.2, 0.9, 1.4, 0.7];
    barWidths.forEach((bw, i) => {
      const b = new THREE.Mesh(
        new THREE.PlaneGeometry(bw, 0.065),
        new THREE.MeshBasicMaterial({color:0xF4EFE6, transparent:true, opacity:0.3 - i*0.04})
      );
      b.position.set(-(1.5-bw)/2 - 0.1, 0.08 - i*0.18, 0.046);
      card.add(b);
    });

    // CTA button
    const btn = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.22, 0.02),
      new THREE.MeshBasicMaterial({color:goldColor})
    );
    btn.position.set(-0.47, -0.95, 0.046);
    card.add(btn);

    // Bottom navigation dots
    for(let i=0;i<3;i++){
      const dot = new THREE.Mesh(
        new THREE.CircleGeometry(0.05, 8),
        new THREE.MeshBasicMaterial({color: i===0 ? goldColor : 0xF4EFE6, transparent:true, opacity: i===0 ? 1 : 0.3})
      );
      dot.position.set((i-1)*0.28, -1.65, 0.046);
      card.add(dot);
    }

    // Floating satellite: icosahedron (brand icon)
    const sat = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.32, 1),
      new THREE.MeshStandardMaterial({color:goldColor, metalness:0.85, roughness:0.15, emissive:0x6a4a10, emissiveIntensity:0.5})
    );
    sat.position.set(1.6, 1.5, 0.8);
    group.add(sat);

    // Floating torus ring
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.28, 0.018, 8, 40),
      new THREE.MeshBasicMaterial({color:goldColor, transparent:true, opacity:0.55})
    );
    ring.position.set(-1.5, -1.2, 0.6);
    ring.rotation.x = 0.4;
    group.add(ring);

    // Floating octahedron (secondary detail)
    const oct = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.18, 0),
      new THREE.MeshStandardMaterial({color:goldColor, metalness:0.7, roughness:0.3, emissive:0x3a2a08, emissiveIntensity:0.3, transparent:true, opacity:0.8})
    );
    oct.position.set(1.2, -1.4, 0.4);
    group.add(oct);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const l1 = new THREE.DirectionalLight(goldColor, 1.0); l1.position.set(4,5,6); scene.add(l1);
    const l2 = new THREE.DirectionalLight(0xffffff, 0.35); l2.position.set(-4,-3,4); scene.add(l2);
    const l3 = new THREE.PointLight(goldColor, 0.4, 8); l3.position.set(0,2,3); scene.add(l3);

    let tmx=0,tmy=0,mx=0,my=0;
    vcanvas.addEventListener('mousemove', e => {
      const r = vcanvas.getBoundingClientRect();
      tmx = (e.clientX-r.left)/r.width - 0.5;
      tmy = (e.clientY-r.top)/r.height - 0.5;
    });
    vcanvas.addEventListener('mouseleave', () => { tmx=0; tmy=0 });
    new ResizeObserver(() => {
      rn.setSize(w(),h(),false);
      cam.aspect = w()/h(); cam.updateProjectionMatrix();
    }).observe(vcanvas);

    const start = performance.now();
    (function loop(){
      const t = (performance.now()-start)/1000;
      mx += (tmx-mx)*0.05; my += (tmy-my)*0.05;
      group.rotation.y = Math.sin(t*0.35)*0.18 + mx*0.7;
      group.rotation.x = Math.cos(t*0.28)*0.07 + my*-0.45;
      sat.rotation.x = t*0.65; sat.rotation.y = t*0.5;
      sat.position.y = 1.5 + Math.sin(t*1.1)*0.18;
      ring.rotation.z = t*0.35; ring.rotation.y = t*0.2;
      ring.position.y = -1.2 + Math.cos(t*1.0)*0.14;
      oct.rotation.x = t*0.8; oct.rotation.y = t*0.6;
      oct.position.y = -1.4 + Math.sin(t*1.3)*0.1;
      rn.render(scene,cam);
      requestAnimationFrame(loop);
    })();
  }
})();
