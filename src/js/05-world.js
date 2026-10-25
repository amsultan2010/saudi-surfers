/* ---------- scene, light, sky and the scrolling Riyadh highway ---------- */
let renderer, scene, camera, hemi, sunLight, sky;
const WORLD = { shops: [], segs: [], via: [], viaTrains: [], side: [], towers: [], gantries: [], bridges: [], cars: [], marks: [] };
const ENV = { t: 0, night: 0, sunDir: new THREE.Vector3(-0.62, 0.68, 0.38).normalize() };
const SKY = { top: '#3a8ee0', hor: '#e9cfa6', fog: '#dcc29b' };
const castAll = (o, rec = true) => o.traverse((m) => { if (m.isMesh) { m.castShadow = true; if (rec) m.receiveShadow = true; } });

function initRenderer(container) {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setSize(container.clientWidth || innerWidth, container.clientHeight || innerHeight);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(SKY.fog, 260, 1150);
  renderer.setClearColor(SKY.fog);
  camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.3, 3200);
  hemi = new THREE.HemisphereLight(0x9cc4f0, 0xd99a6a, 0.46); scene.add(hemi);
  const fill = new THREE.DirectionalLight(0xffc4e0, 0.1); fill.position.set(0.8, 0.35, 0.3); scene.add(fill);
  const rim = new THREE.DirectionalLight(0x9fd8ff, 0.14); rim.position.set(0.2, 0.5, -1); scene.add(rim);
  sunLight = new THREE.DirectionalLight(0xffd8a8, 0.74);
  sunLight.castShadow = true;
  const sc = sunLight.shadow.camera; sc.left = -30; sc.right = 30; sc.top = 34; sc.bottom = -26; sc.near = 1; sc.far = 220;
  const sm = matchMedia('(pointer: coarse)').matches ? 1024 : 2048; sunLight.shadow.mapSize.set(sm, sm); sunLight.shadow.bias = -0.0006; sunLight.shadow.normalBias = 0.03;
  scene.add(sunLight); scene.add(sunLight.target);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(SKY.top) }, hor: { value: new THREE.Color(SKY.hor) }, sunDir: { value: ENV.sunDir } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 top; uniform vec3 hor; uniform vec3 sunDir; varying vec3 vP;
      void main(){ float y = vP.y; vec3 c = mix(hor, top, pow(clamp(y * 1.5, 0.0, 1.0), 0.6));
        float d = max(dot(normalize(vP), normalize(sunDir)), 0.0);
        c += vec3(1.0, 0.85, 0.62) * (pow(d, 900.0) * 1.0 + pow(d, 8.0) * 0.12);
        c = mix(c, vec3(0.86, 0.77, 0.64), clamp(1.0 - y * 9.0, 0.0, 1.0) * 0.55);
        gl_FragColor = vec4(c, 1.0); }`
  });
  sky = new THREE.Mesh(new THREE.SphereGeometry(2600, 48, 24), skyMat); sky.renderOrder = -1; scene.add(sky);
  const cloudTex = canvasTex(256, 128, (g) => {
    for (let i = 0; i < 9; i++) { const x = 40 + i * 22 + Math.random() * 10, y = 70 + Math.sin(i) * 12, r = 26 + Math.random() * 20;
      const gr = g.createRadialGradient(x, y, 2, x, y, r); gr.addColorStop(0, 'rgba(255,250,242,1)'); gr.addColorStop(0.7, 'rgba(255,246,232,.85)'); gr.addColorStop(1, 'rgba(255,240,225,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
  }, false);
  WORLD.clouds = [];
  for (let i = 0; i < 8; i++) {
    const c = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, fog: false, depthWrite: false, opacity: 0.75 }));
    c.scale.set(rand(240, 420), rand(80, 130), 1); scene.add(c);
    WORLD.clouds.push({ c, x: rand(-1100, 1100), y: rand(300, 620), d: rand(1500, 2200) });
  }
  MAT.sand.fog = false; TEX.sand.repeat.set(260, 260);
  WORLD.ground = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000).rotateX(-Math.PI / 2), MAT.sand);
  WORLD.ground.position.y = -0.03; WORLD.ground.receiveShadow = true; scene.add(WORLD.ground);
}
function applyDay() { /* warm late afternoon */ }

function buildWorld() {
  for (let i = 0; i < NSEG; i++) {
    const g = new THREE.Group();
    const flat = [new THREE.Mesh(GEO.segTrack, MAT.track), new THREE.Mesh(GEO.segRoad, MAT.road), new THREE.Mesh(GEO.segMedian, MAT.median), new THREE.Mesh(GEO.segWalk, MAT.paver)];
    for (const m of flat) m.receiveShadow = true;
    const vc = new THREE.Mesh(GEO.segVC[i % 2], MAT.toon), lv = new THREE.Mesh(GEO.segLeaves[i % 2], MAT.leaves);
    vc.castShadow = vc.receiveShadow = true; lv.castShadow = true;
    g.add(...flat, vc, lv);
    scene.add(g); WORLD.segs.push({ g, s: 0 });
    const v = new THREE.Mesh(GEO.viaduct, MAT.toon); v.castShadow = true; scene.add(v); WORLD.via.push({ g: v, s: 0 });
  }
  for (let k = 0; k < 2; k++) {
    const g = new THREE.Group();
    for (let c = 0; c < 4; c++) { const car = makeCar(k ? 1 : 6); car.position.z = -c * (DIM.CAR_L + DIM.CAR_GAP); g.add(car); }
    g.position.set(-27 + (k ? 2 : -2), 11.85, 0); if (k) g.rotation.y = Math.PI;
    castAll(g, false); scene.add(g); WORLD.viaTrains.push({ g, s: 0, v: k ? 30 : -36, len: 4 * DIM.CAR_L + 1.5 });
  }
  const designs = streetDesigns();
  const add = (g, kind, w) => { g.visible = false; castAll(g); scene.add(g); WORLD.side.push({ g, s: -1e9, len: g.userData.len || 20, w, kind }); };
  for (let i = 0; i < 10; i++) add(makeVilla(i), 'villa', 11);
  for (let i = 0; i < 3; i++) add(makeMosque(i), 'mosque', 13);
  for (let i = 0; i < 6; i++) add(makeBillboard(i), 'billboard', 7);
  // low Saudi shopfront rows lining the road
  const lows = lowDesigns().map((d) => ({ d, mesh: makeStreetBuilding(d) }));
  for (let i = 0; i < 44; i++) {
    const p = lows[i % lows.length];
    const m = i < lows.length ? p.mesh : new THREE.Mesh(p.mesh.geometry, p.mesh.material);
    m.castShadow = true; m.receiveShadow = true; m.visible = false; scene.add(m);
    WORLD.shops.push({ g: m, s: -1e9, len: p.d.d, w: p.d.w });
  }
  shuffleInPlace(WORLD.shops);
  shuffleInPlace(WORLD.side);
  const keys = ['fGlassBlue', 'fGlassTeal', 'fGlassSky', 'fGlassSilver', 'fGlassBronze', 'fGlassDark'];
  for (let i = 0; i < 30; i++) {
    const w = rand(18, 32), d = rand(18, 32), h = rand(40, 105);
    const t = makeTower(w, h, d, keys[i % keys.length], pick(['crown', 'slant', 'plain'])); t.visible = false; scene.add(t);
    WORLD.towers.push({ g: t, s: -1e9, len: d, side: i % 2 ? 1 : -1 });
  }
  for (let i = 0; i < 3; i++) { const g = makeGantry(i * 2); g.visible = false; castAll(g); scene.add(g); WORLD.gantries.push({ g, s: -1e9 }); }
  for (let i = 0; i < 2; i++) { const g = makeBridge(i); g.visible = false; castAll(g); scene.add(g); WORLD.bridges.push({ g, s: -1e9, len: g.userData.len }); }
  buildAutoGeos();
  for (let i = 0; i < 18; i++) { const m = new THREE.Mesh(pick(AUTO_GEOS), MAT.toon); m.castShadow = true; scene.add(m); WORLD.cars.push({ m, s: 0, x: 0, v: 0, side: i % 2 ? 1 : -1 }); }
  for (const fn of LANDMARK_BUILDERS) {
    const g = fn(); g.visible = false; scene.add(g);
    g.traverse((o) => { if (o.material) for (const m of [].concat(o.material)) m.fog = false; });
    WORLD.marks.push({ g, s: -1e9, info: g.userData, announced: false });
  }
  WORLD.titleMark = lmKingdom(); WORLD.titleMark.position.set(-80, DIM.STREET, 560); WORLD.titleMark.rotation.y = Math.PI + 0.35; scene.add(WORLD.titleMark);
  WORLD.titleMark.traverse((o) => { if (o.material) for (const m of [].concat(o.material)) m.fog = false; });
  WORLD.kafdStation = lmKAFDStation(); WORLD.kafdStation.visible = false; scene.add(WORLD.kafdStation);
}
function shuffleInPlace(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } }

const WS = { nextShop: { '-1': 0, '1': 0 }, next: { '-1': 0, '1': 0 }, nextT: { '-1': 0, '1': 0 }, nextGantry: 0, nextBridge: 0, markIdx: 0, nextMark: 0, landmarksPassed: 0 };
function resetWorld(s0) {
  WORLD.segs.forEach((r, i) => { r.s = s0 - 240 + i * SEG; r.g.position.z = -r.s; });
  WORLD.via.forEach((r, i) => { r.s = s0 - 240 + i * SEG; r.g.position.z = -r.s; });
  WORLD.viaTrains.forEach((t, i) => { t.s = s0 + (i ? 60 : 420); });
  WS.next['-1'] = WS.next['1'] = s0 - 250;
  WS.nextShop['-1'] = WS.nextShop['1'] = s0 - 200;
  WS.nextT['-1'] = WS.nextT['1'] = s0 - 120;
  for (const arr of [WORLD.shops, WORLD.side, WORLD.towers, WORLD.gantries, WORLD.bridges]) for (const r of arr) { r.s = -1e9; r.g.visible = false; }
  WS.nextGantry = s0 + 160; WS.nextBridge = s0 + 380;
  WS.markIdx = 0; WS.nextMark = s0 + 700; WS.landmarksPassed = 0;
  for (const m of WORLD.marks) { m.s = -1e9; m.g.visible = false; }
  WORLD.kafdStation.visible = false; WORLD.kafdS = -1e9;
  placeNextMark(); placeNextMark(); placeNextMark();
  WORLD.cars.forEach((c) => spawnCar(c, s0, true));
  for (let i = 0; i < 40; i++) updateWorld(0, s0, 260);
}
function placeNextMark() {
  const m = WORLD.marks[WS.markIdx % WORLD.marks.length];
  WS.markIdx++;
  m.s = WS.nextMark; m.announced = false;
  const side = Math.sign(m.info.x);
  m.g.position.set(m.info.x, DIM.STREET, -m.s);
  m.g.rotation.y = m.info.near ? 0 : side > 0 ? -0.3 : 0.3;
  m.g.visible = true;
  if (m.info.short === 'KAFD') { WORLD.kafdS = m.s - 60; WORLD.kafdStation.position.set(WORLD.kafdStation.userData.x, DIM.STREET, -WORLD.kafdS); WORLD.kafdStation.visible = true; }
  WS.nextMark += m.info.near ? 380 : 480;
}
function blockedFar(side, s, pad = 0) {
  for (const m of WORLD.marks) {
    if (!m.g.visible || Math.sign(m.info.x) !== side) continue;
    const big = (m.info.short === 'KAFD' ? 200 : m.info.short === 'Kingdom Centre' ? 110 : 90) + pad;
    if (Math.abs(s - m.s) < big) return m.s + big;
  }
  if (side > 0 && Math.abs(s - WORLD.kafdS) < 70) return WORLD.kafdS + 70;
  return 0;
}
function spawnCar(c, ps, initial) {
  const lanes = [MX + 1.8, MX + 5.45, MX + 9.1];
  c.x = c.side * pick(lanes);
  if (c.side > 0) { c.v = rand(15, 25); c.s = ps + (initial ? rand(-10, 500) : rand(250, 600)); c.m.rotation.y = 0; }
  else { c.v = -rand(20, 30); c.s = ps + (initial ? rand(40, 800) : rand(500, 950)); c.m.rotation.y = Math.PI; }
  c.m.geometry = pick(AUTO_GEOS);
}
function updateWorld(dt, ps, behind = 14) {
  const cs = ps - behind;
  if (WORLD.titleMark) WORLD.titleMark.visible = behind > 100;
  WORLD.ground.position.set(0, -0.03, -ps);
  const far = (typeof TOUCH !== 'undefined' && TOUCH) ? 560 : 1e9;
  for (const r of WORLD.segs) { if (r.s + SEG < cs) { r.s += NSEG * SEG; r.g.position.z = -r.s; } r.g.visible = r.s - ps < far; }
  for (const r of WORLD.via) if (r.s + SEG < cs) { r.s += NSEG * SEG; r.g.position.z = -r.s; }
  for (const t of WORLD.viaTrains) {
    t.s += t.v * dt;
    if (t.v > 0 && (t.s < cs - 80 || t.s > ps + 900)) t.s = t.s < cs - 80 ? ps + rand(500, 800) : cs - 70;
    if (t.v < 0 && t.s < cs - 80) t.s = ps + rand(600, 1000);
    t.g.position.z = t.v > 0 ? -t.s - t.len : -t.s;
  }
  for (const b of WORLD.bridges) if (b.s + b.len < cs - 5 && WS.nextBridge < ps + 800) {
    b.s = WS.nextBridge; b.g.position.z = -b.s; b.g.visible = true; WS.nextBridge += rand(520, 760);
  }
  for (const side of [-1, 1]) {
    for (const r of WORLD.shops) {
      if (r.s > -1e8 && r.s + r.len > cs) continue;
      let s = WS.nextShop[side];
      for (const b of WORLD.bridges) if (b.s > -1e8 && s + r.len > b.s - 4 && s < b.s + b.len + 4) s = b.s + b.len + 4;
      if (s > ps + 760) break;
      r.s = s; r.g.visible = true;
      const base = side < 0 ? 31.6 : SX + 1.4;
      r.g.position.set(side * (base + r.w / 2), 0.05, -(s + r.len / 2));
      const q = Math.random();
      WS.nextShop[side] = s + r.len + (q < 0.7 ? rand(0.4, 3) : q < 0.9 ? rand(5, 10) : rand(25, 45));
      break;
    }
    for (const r of WORLD.side) {
      if (r.s > -1e8 && r.s + r.len > cs) continue;
      let s = WS.next[side];
      const blk = blockedFar(side, s + r.len / 2, 10); if (blk) s = blk;
      if (s > ps + 820) break;
      r.s = s; r.side = side; r.g.visible = true;
      const base = side < 0 ? 52 : 46;
      const x = side * (base + r.w + rand(0, 14));
      r.g.position.set(x, 0, -(s + r.len / 2));
      r.g.rotation.y = r.kind === 'billboard' ? -side * 0.45 : side > 0 ? 0 : Math.PI;
      WS.next[side] = s + r.len + rand(18, 55);
      break;
    }
    for (const t of WORLD.towers) {
      if (t.side !== side || t.s + t.len > cs) continue;
      let s = WS.nextT[side];
      const blk = blockedFar(side, s); if (blk) s = blk;
      if (s > ps + 1150) continue;
      t.s = s; t.g.visible = true;
      t.g.position.set(side * rand(70, 230), 0, -(s + t.len / 2));
      WS.nextT[side] = s + t.len * 0.6 + rand(15, 55);
    }
  }
  for (const g of WORLD.gantries) if (g.s < cs - 5 && WS.nextGantry < ps + 700) {
    if (WORLD.bridges.some((b) => Math.abs(b.s - WS.nextGantry) < 40)) WS.nextGantry += 60;
    g.s = WS.nextGantry; g.g.position.z = -g.s; g.g.visible = true; WS.nextGantry += rand(260, 400);
  }
  for (const c of WORLD.cars) {
    c.s += c.v * dt;
    if (c.side > 0 && (c.s < cs - 20 || c.s > ps + 750)) { if (c.s > ps + 750) { c.s = cs - 15; c.v = rand(24, 30); } else spawnCar(c, ps, false); }
    if (c.side < 0 && c.s < cs - 20) spawnCar(c, ps, false);
    c.m.position.set(c.x, 0.05, -c.s);
  }
  for (const m of WORLD.marks) {
    if (!m.g.visible) continue;
    if (!m.announced && ps > m.s - 150) { m.announced = true; WS.landmarksPassed++; if (window.onLandmark) onLandmark(m.info); }
    if (m.s < ps - 300) { m.g.visible = false; m.s = -1e9; }
  }
  if (WORLD.kafdStation.visible && WORLD.kafdS < ps - 150) WORLD.kafdStation.visible = false;
  if (WS.nextMark < ps + 1400) placeNextMark();
  sky.position.copy(camera.position);
  for (const c of WORLD.clouds) c.c.position.set(camera.position.x + c.x, c.y, camera.position.z - c.d);
  const fx = PL && PL.x || 0, fz = -(ps + 12);
  sunLight.target.position.set(fx * 0.5, 0, fz);
  sunLight.position.set(fx * 0.5 - ENV.sunDir.x * -100, ENV.sunDir.y * 100, fz - ENV.sunDir.z * -100);
}
function nextMarkInfo(ps) {
  let best = null;
  for (const m of WORLD.marks) if (m.g.visible && !m.announced && (!best || m.s < best.s)) best = m;
  return best;
}
