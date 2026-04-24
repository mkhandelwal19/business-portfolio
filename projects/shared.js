/* Shared subpage 3D hero scene + reveals */
(function(){
  const THREE = window.THREE;

  // Reveals with fallback: always show after 1.5s if IO hasn't fired
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target) }
    });
  }, { threshold: 0.01, rootMargin: '0px 0px 0px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  // Trigger immediately for any already-in-view elements after paint
  requestAnimationFrame(() => {
    document.querySelectorAll('.reveal').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('in');
    });
  });
  // Hard fallback
  setTimeout(() => document.body.classList.add('ready'), 1500);

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

  // Product visual — 3D product card showing the site's "look"
  const vcanvas = document.getElementById('p-visual-canvas');
  if (vcanvas && THREE && window.PRODUCT_CONFIG){
    const cfg = window.PRODUCT_CONFIG;
    const w = () => vcanvas.clientWidth || 400;
    const h = () => vcanvas.clientHeight || 400;
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(45, w()/h(), 0.1, 100);
    cam.position.set(0,0,5.5);
    const rn = new THREE.WebGLRenderer({canvas:vcanvas, antialias:true, alpha:true});
    rn.setPixelRatio(Math.min(window.devicePixelRatio,2));
    rn.setSize(w(), h(), false);

    const group = new THREE.Group();
    scene.add(group);

    // Background plane with category color
    const bg = new THREE.Mesh(
      new THREE.PlaneGeometry(5, 5),
      new THREE.MeshBasicMaterial({color: cfg.bgColor || 0x0E1527})
    );
    bg.position.z = -1.5;
    group.add(bg);

    // Device-like card
    const card = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 3.4, 0.08),
      new THREE.MeshStandardMaterial({color: 0x141C34, metalness:0.4, roughness:0.5, emissive:0x0c1328, emissiveIntensity:0.25})
    );
    card.rotation.y = -0.15;
    card.rotation.x = 0.08;
    group.add(card);

    // Gold edge
    card.add(new THREE.LineSegments(
      new THREE.EdgesGeometry(card.geometry),
      new THREE.LineBasicMaterial({color:0xC9A84C, transparent:true, opacity:0.55})
    ));

    // Gold accent stripe
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.04), new THREE.MeshBasicMaterial({color:0xC9A84C}));
    stripe.position.set(0, 1.4, 0.041);
    card.add(stripe);

    // Mock "hero" block (category color tinted)
    const hero = new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 1.1),
      new THREE.MeshBasicMaterial({color: cfg.heroColor || 0xC9A84C, transparent:true, opacity:0.6})
    );
    hero.position.set(0, 0.55, 0.042);
    card.add(hero);

    // Mock text bars
    for (let i=0;i<4;i++){
      const bar = new THREE.Mesh(
        new THREE.PlaneGeometry(1.6 - i*0.2, 0.07),
        new THREE.MeshBasicMaterial({color:0xF4EFE6, transparent:true, opacity:0.35 - i*0.05})
      );
      bar.position.set(-0.15, -0.3 - i*0.18, 0.042);
      card.add(bar);
    }

    // Mock button
    const btn = new THREE.Mesh(new THREE.PlaneGeometry(0.7,0.18), new THREE.MeshBasicMaterial({color:0xC9A84C}));
    btn.position.set(-0.55, -1.1, 0.042);
    card.add(btn);

    // Floating satellite icon (icosahedron)
    const sat = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.35, 0),
      new THREE.MeshStandardMaterial({color:0xC9A84C, metalness:0.8, roughness:0.2, emissive:0x8E7430, emissiveIntensity:0.4})
    );
    sat.position.set(1.5, 1.4, 0.8);
    group.add(sat);

    const sat2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.3, 0.02, 8, 32),
      new THREE.MeshBasicMaterial({color:0xC9A84C, transparent:true, opacity:0.5})
    );
    sat2.position.set(-1.4, -1.3, 0.6);
    group.add(sat2);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const l1 = new THREE.DirectionalLight(0xC9A84C, 0.9); l1.position.set(4,4,5); scene.add(l1);
    const l2 = new THREE.DirectionalLight(0xffffff, 0.3); l2.position.set(-4,-2,3); scene.add(l2);

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
      mx += (tmx-mx)*0.06; my += (tmy-my)*0.06;
      group.rotation.y = Math.sin(t*0.4)*0.15 + mx*0.6;
      group.rotation.x = Math.cos(t*0.3)*0.06 + my*-0.4;
      sat.rotation.x = t*0.7; sat.rotation.y = t*0.5;
      sat.position.y = 1.4 + Math.sin(t*1.2)*0.15;
      sat2.rotation.z = t*0.4;
      sat2.position.y = -1.3 + Math.cos(t*1.1)*0.12;
      rn.render(scene,cam);
      requestAnimationFrame(loop);
    })();
  }
})();
