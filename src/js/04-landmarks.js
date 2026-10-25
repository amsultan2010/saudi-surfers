/* ---------- Riyadh landmarks along King Fahd Road (skyscrapers at 0.6 scale) ---------- */
const LSC = 0.66;
function facadeTexMat(key, repX, repY, nightK = 0.9) {
  const t = TEX[key].clone(); t.needsUpdate = true; t.repeat.set(repX, repY);
  const n = TEX[key + 'N'].clone(); n.needsUpdate = true; n.repeat.set(repX * 0.5, repY * 0.5);
  return nightGlow(new THREE.MeshLambertMaterial({ map: t, emissive: 0xffffff, emissiveMap: n, emissiveIntensity: 0 }), nightK);
}
function glowMat(color, k = 1) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.0, visible: false });
}
function flatGeo(g) { g = g.index ? g.toNonIndexed() : g; g.computeVertexNormals(); return g; }

function lmKingdom() {
  const g = new THREE.Group();
  const H = 302, W = 31, top = 24.5, inn = 20.5, h0 = 0.705 * H, DEP = 15;
  const outer = (t) => W - (W - top) * Math.pow(t, 1.25);
  const N = 64, sh = new THREE.Shape();
  sh.moveTo(-W, 0); sh.lineTo(W, 0);
  for (let i = 1; i <= N; i++) sh.lineTo(outer(i / N), H * i / N);
  for (let i = N - 1; i >= -N + 1; i--) { const x = inn * i / N; sh.lineTo(x, h0 + (H - h0) * Math.pow(Math.abs(x / inn), 2.2)); }
  for (let i = N; i >= 1; i--) sh.lineTo(-outer(i / N), H * i / N);
  let geo = new THREE.ExtrudeGeometry(sh, { depth: DEP * 2, bevelEnabled: false, curveSegments: 4, steps: 1 });
  geo.translate(0, 0, -DEP);
  const lens = (x) => 0.38 + 0.62 * Math.sqrt(Math.max(0, 1 - (x / (W + 0.5)) * (x / (W + 0.5))));
  if (geo.index) geo = geo.toNonIndexed();
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, p.getZ(i) * lens(x)); uv.setXY(i, (x + W) / (2 * W), y / H); }
  geo.computeVertexNormals();
  // smooth the curved front and back faces analytically
  const nr = geo.attributes.normal, e = 0.01;
  for (let i = 0; i < nr.count; i++) {
    if (Math.abs(nr.getZ(i)) < 0.6) continue;
    const x = p.getX(i), sg = Math.sign(p.getZ(i)) || 1;
    const dz = sg * DEP * (lens(x + e) - lens(x - e)) / (2 * e);
    const v = new THREE.Vector3(-dz, 0, sg).normalize(); nr.setXYZ(i, v.x, v.y, v.z);
  }
  const mat = new THREE.MeshPhongMaterial({ map: TEX.kingdom, shininess: 70, specular: 0x5a6676, flatShading: false });
  g.add(new THREE.Mesh(geo, mat));
  const by = 0.89 * H, bx = inn * Math.pow((by - h0) / (H - h0), 1 / 2.2);
  g.add(new THREE.Mesh(merge([P.box(bx * 2 + 3, 5, 12, 0x6f8196, { y: by }), P.box(bx * 2 + 3, 0.8, 12.6, 0xd7e0ea, { y: by - 2.8 }), P.box(bx * 2 + 3, 0.8, 12.6, 0xd7e0ea, { y: by + 2.8 })]), MAT.lamb));
  // curved mall podium
  const pod = [];
  pod.push(P.geo(new THREE.CylinderGeometry(78, 78, 22, 48, 1, false, -Math.PI * 0.55, Math.PI * 1.1), 0xe9e4da, { y: 11, z: 18 }));
  pod.push(P.geo(new THREE.CylinderGeometry(79, 79, 5, 48, 1, true, -Math.PI * 0.55, Math.PI * 1.1), 0x6f8fae, { y: 15, z: 18 }));
  pod.push(P.geo(new THREE.CylinderGeometry(80, 80, 1.5, 48, 1, false, -Math.PI * 0.55, Math.PI * 1.1), 0xf7f4ee, { y: 22.6, z: 18 }));
  g.add(new THREE.Mesh(merge(pod), MAT.lamb));
  g.scale.setScalar(LSC);
  g.userData = { ar: 'برج المملكة', en: 'Kingdom Centre · 302 m', short: 'Kingdom Centre', x: 78, color: '#00a3e0' };
  return g;
}

function lmFaisaliah() {
  const g = new THREE.Group();
  const H = 267, R0 = 36, yCap = 0.72 * H, apex = 0.975 * H;
  const rAt = (y) => R0 * (1 - y / apex);
  const body = new THREE.CylinderGeometry(rAt(yCap), R0, yCap, 4, 24, false);
  body.rotateY(Math.PI / 4); body.translate(0, yCap / 2, 0);
  const tex = TEX.faisaliah; tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  g.add(new THREE.Mesh(flatGeo(body), new THREE.MeshPhongMaterial({ map: tex, shininess: 30, specular: 0x333333 })));
  const parts = [];
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + k * Math.PI / 2;
    const p0 = new THREE.Vector3(Math.cos(a) * R0 * 1.02, 0, Math.sin(a) * R0 * 1.02), p1 = new THREE.Vector3(0, apex, 0);
    const len = p0.distanceTo(p1);
    const leg = new THREE.CylinderGeometry(1.6, 2.4, len, 10);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), p1.clone().sub(p0).normalize());
    leg.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(q)); const mid = p0.clone().add(p1).multiplyScalar(0.5); leg.translate(mid.x, mid.y, mid.z);
    parts.push(tint(leg, 0xf2efe8));
    // diagonal braces in the open crown
    const b0 = new THREE.Vector3(Math.cos(a) * rAt(yCap) * 1.4, yCap, Math.sin(a) * rAt(yCap) * 1.4);
    const a2 = a + Math.PI / 2, b1 = new THREE.Vector3(Math.cos(a2) * rAt(0.86 * H) * 1.4, 0.86 * H, Math.sin(a2) * rAt(0.86 * H) * 1.4);
    const bl = b0.distanceTo(b1), br = new THREE.CylinderGeometry(0.7, 0.7, bl, 8);
    br.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b1.clone().sub(b0).normalize())));
    const bm = b0.clone().add(b1).multiplyScalar(0.5); br.translate(bm.x, bm.y, bm.z); parts.push(tint(br, 0xe8e4dc));
  }
  parts.push(P.box(rAt(yCap) * 1.45, 3, rAt(yCap) * 1.45, 0xcfd3d8, { y: yCap }));
  parts.push(P.cone(3.2, 8, 4, 0xe8e4dc, { y: apex + 2, ry: Math.PI / 4 }), P.cyl(0.5, 1.4, 34, 12, 0xf2efe8, { y: apex + 20 }));
  parts.push(P.box(120, 14, 90, 0xd9cdb5, { y: 7 }), P.cone(34, 28, 4, 0x8fb2c9, { y: 28, x: 34, ry: Math.PI / 4 }));
  g.add(new THREE.Mesh(merge(parts), MAT.lamb));
  const globe = new THREE.Mesh(new THREE.SphereGeometry(12.5, 40, 28), new THREE.MeshPhongMaterial({ color: 0x8a6a3a, emissive: 0x3a2408, shininess: 90, specular: 0xffd9a0 }));
  globe.position.y = 0.765 * H; g.add(globe);
  g.add(new THREE.Mesh(merge([P.tor(12.7, 0.6, 8, 40, TAU, 0xe8e4dc, { y: 0.765 * H, rx: Math.PI / 2 })]), MAT.lamb));
  g.scale.setScalar(LSC);
  g.userData = { ar: 'برج الفيصلية', en: 'Al Faisaliah Tower · 267 m', short: 'Al Faisaliah', x: -70, color: '#ffc400' };
  return g;
}

function lmLibrary() {
  // King Fahd National Library: cube wrapped in white diamond tensile panels, original dome inside
  const g = new THREE.Group();
  const tex = canvasTex(256, 256, (c, W, Hh) => {
    c.fillStyle = '#3b4b5c'; c.fillRect(0, 0, W, Hh);
    c.strokeStyle = '#f7f4ee'; c.lineWidth = 16;
    for (let i = -2; i < 4; i++) { c.beginPath(); c.moveTo(i * 128, 0); c.lineTo(i * 128 + 256, 256); c.stroke(); c.beginPath(); c.moveTo(i * 128 + 256, 0); c.lineTo(i * 128, 256); c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { c.beginPath(); c.arc(i * 64 + 32, j * 64 + 32, 6, 0, TAU); c.fill(); }
  });
  tex.repeat.set(8, 2);
  const fm = new THREE.MeshLambertMaterial({ map: tex });
  const box = new THREE.Mesh(new THREE.BoxGeometry(64, 24, 64), [fm, fm, MAT.roof, MAT.roof, fm, fm]);
  box.position.y = 12; g.add(box);
  g.add(new THREE.Mesh(merge([
    P.sph(16, 0xe8dfcc, { y: 24 }, 18, 10), P.cyl(17, 17, 3, 18, 0xcdbf9f, { y: 25 }), P.cyl(0.5, 0.8, 8, 6, 0xcdbf9f, { y: 42 }),
    P.box(70, 1.2, 70, 0xd9cdb5, { y: 24.4 })
  ]), MAT.lamb));
  const lg = new THREE.Mesh(new THREE.BoxGeometry(65, 1.4, 65), glowMat(0xfff1d0, 0.8)); lg.position.y = 0.8; g.add(lg);
  g.position.y = DIM.STREET;
  g.userData = { ar: 'مكتبة الملك فهد الوطنية', en: 'King Fahd National Library', short: 'National Library', x: 60, color: '#43b02a', near: true };
  return g;
}

function lmMajdoul() {
  const g = new THREE.Group();
  const H = 245, W = 34, D = 22, TW = Math.PI * 0.5;
  const geo = new THREE.BoxGeometry(W, H, D, 4, 80, 3);
  geo.translate(0, H / 2, 0);
  const p = geo.attributes.position;
  const twistAt = (y) => (y / H) * TW, taper = (y) => 1 - (y / H) * 0.12;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i), a = twistAt(y), k = taper(y), x = p.getX(i) * k, z = p.getZ(i) * k;
    p.setXYZ(i, x * Math.cos(a) - z * Math.sin(a), y, x * Math.sin(a) + z * Math.cos(a));
  }
  geo.computeVertexNormals();
  const tex = TEX.majdoul.clone(); tex.needsUpdate = true; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1, 14);
  g.add(new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ map: tex, shininess: 60, specular: 0x6a8aa8 })));
  const fins = [];
  for (const [cx, cz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const pts = [];
    for (let i = 0; i <= 40; i++) { const y = H * i / 40, a = twistAt(y), k = taper(y), x = cx * W / 2 * k, z = cz * D / 2 * k; pts.push(new THREE.Vector3(x * Math.cos(a) - z * Math.sin(a), y, x * Math.sin(a) + z * Math.cos(a))); }
    fins.push(tint(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.9, 8, false), 0xf4f6f8));
  }
  const a = twistAt(H);
  fins.push(P.cyl(9, 11, 6, 24, 0xe3e8ee, { y: H + 3 }), P.cyl(5, 5, 4, 20, 0x9fb6cc, { y: H + 8 }), P.box(90, 12, 60, 0xd9cdb5, { y: 6 }));
  g.add(new THREE.Mesh(merge(fins), MAT.lamb));
  g.scale.setScalar(LSC);
  g.userData = { ar: 'برج المجدول', en: 'Al Majdoul Tower · 245 m', short: 'Al Majdoul', x: -68, color: '#00b3a6' };
  return g;
}

function lmMOI() {
  // Ministry of Interior: inverted truncated pyramid with a dome on top
  const g = new THREE.Group();
  const H = 50;
  const body = new THREE.CylinderGeometry(70, 38, H, 4, 6, false); body.rotateY(Math.PI / 4); body.translate(0, H / 2 + 10, 0);
  g.add(new THREE.Mesh(flatGeo(body), facadeTexMat('fGlassBronze', 10, 4, 0.9)));
  g.add(new THREE.Mesh(merge([
    P.box(56, 10, 56, 0xcdbf9f, { y: 5 }),
    P.box(102, 2, 102, 0xe0d4bb, { y: H + 11 }),
    P.sph(26, 0xf1ece0, { y: H + 12 }, 20, 10),
    P.cyl(4, 4, 6, 12, 0xd9cdb5, { y: H + 39 }),
    P.cone(2.4, 8, 12, 0xffc23d, { y: H + 46 })
  ]), MAT.lamb));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(27, 1.1, 6, 40), glowMat(0x9fd6ff, 0.9)); ring.rotation.x = Math.PI / 2; ring.position.y = H + 12.5; g.add(ring);
  g.position.y = DIM.STREET;
  g.userData = { ar: 'وزارة الداخلية', en: 'Ministry of Interior', short: 'Ministry of Interior', x: -105, color: '#8f4fa3', near: true };
  return g;
}

function crystalTower(H, R, sides, twist, col, crownCol) {
  const pts = [];
  const prof = [[0, 1.0], [0.25, 1.06], [0.6, 0.96], [0.82, 0.8], [0.92, 0.52], [1.0, 0.04]];
  for (const [t, r] of prof) pts.push(new THREE.Vector2(R * r, H * t));
  let geo = new THREE.LatheGeometry(pts, sides);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i), a = (y / H) * twist, x = p.getX(i), z = p.getZ(i);
    p.setXYZ(i, x * Math.cos(a) - z * Math.sin(a), y, x * Math.sin(a) + z * Math.cos(a));
  }
  geo = flatGeo(geo);
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geo, facadeTexMat(col, Math.round(TAU * R / 16), Math.round(H / 14), 0.7)));
  if (crownCol) {
    const crown = new THREE.Mesh(new THREE.ConeGeometry(R * 0.52, H * 0.09, sides), glowMat(crownCol, 1));
    crown.position.y = H * 0.955; crown.rotation.y = twist * 0.95; g.add(crown);
  }
  return g;
}
function texBox(w, h, d, tex, rx, ry, shin = 30) {
  const t = tex.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry);
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshPhongMaterial({ map: t, shininess: shin, specular: 0x444444 }));
  m.position.y = h / 2; return m;
}
function lmKAFD() {
  const g = new THREE.Group();
  // PIF tower: chamfered prism with diamond tracery and a tapering crown
  const H = 385, R = 30;
  const pt = TEX.pif.clone(); pt.needsUpdate = true; pt.wrapS = pt.wrapT = THREE.RepeatWrapping; pt.repeat.set(8, 1);
  const pmat = new THREE.MeshPhongMaterial({ map: pt, shininess: 70, specular: 0x7f93a8 });
  const shaft = new THREE.CylinderGeometry(R * 0.93, R, H * 0.86, 8, 1); shaft.rotateY(Math.PI / 8); shaft.translate(0, H * 0.43, 0);
  const crown = new THREE.CylinderGeometry(R * 0.5, R * 0.93, H * 0.12, 8, 1); crown.rotateY(Math.PI / 8); crown.translate(0, H * 0.92, 0);
  g.add(new THREE.Mesh(flatGeo(shaft), pmat), new THREE.Mesh(flatGeo(crown), pmat));
  const misc = [P.cyl(R * 0.5, R * 0.5, 2, 8, 0xd7e0ea, { y: H * 0.98 }), P.cyl(0.6, 1.4, 20, 8, 0xd7e0ea, { y: H + 8 })];
  // neighbours
  const lat = texBox(28, 250, 26, TEX.lattice, 3, 14); lat.position.x = 62; lat.position.z = -10; g.add(lat);
  const lat2 = texBox(30, 170, 30, TEX.lattice, 3, 10); lat2.position.set(110, 85, 30); lat2.position.y = 85; g.add(lat2);
  const dark = makeTower(24, 220, 24, 'fGlassDark', 'plain'); dark.position.set(40, 0, 30); g.add(dark);
  const fins = texBox(34, 120, 30, TEX.fins, 4, 6); fins.position.set(-10, 60, 70); fins.position.y = 60; g.add(fins);
  // zig-zag stacked tower
  for (let i = 0; i < 20; i++) misc.push(P.box(28, 8.6, 26, i % 2 ? 0x4a4f5a : 0x6b7280, { x: -95 + Math.sin(i * 0.9) * 3, y: 4.5 + i * 9, z: 20 }));
  // sloped wedge
  const wedge = new THREE.Shape(); wedge.moveTo(-15, 0); wedge.lineTo(15, 0); wedge.lineTo(15, 160); wedge.lineTo(-15, 110); wedge.closePath();
  const wg = new THREE.ExtrudeGeometry(wedge, { depth: 26, bevelEnabled: false }); wg.translate(-55, 0, 50);
  g.add(new THREE.Mesh(wg, MAT.facade.fGlassDark));
  // faceted conference centre
  for (let i = 0; i < 7; i++) misc.push(P.cone(12, 26, 3, i % 2 ? 0x9fc3e0 : 0xc9e2f2, { x: -20 + i * 10, y: 13, z: 95, ry: i * 0.6 }));
  misc.push(P.box(80, 14, 30, 0xb7d3ea, { x: 10, y: 7, z: 95 }));
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 130, 32), MAT.facade.fGlassSky); cyl.position.set(-60, 65, -60); g.add(cyl);
  misc.push(P.box(380, 6, 300, 0xd9cdb5, { y: 3 }));
  g.add(new THREE.Mesh(merge(misc), MAT.lamb));
  g.scale.setScalar(LSC);
  g.userData = { ar: 'مركز الملك عبدالله المالي', en: 'KAFD · PIF Tower 385 m', short: 'KAFD', x: 110, color: '#ffd100' };
  return g;
}

function lmKAFDStation() {
  // white sculpted station canopy with wavy ribs (sits beside the cut)
  const g = new THREE.Group();
  const parts = [];
  for (let i = 0; i < 26; i++) {
    const z = -i * 3;
    const h = 9 + Math.sin(i * 0.42) * 4 + Math.sin(i * 0.17) * 3;
    const rib = new THREE.TorusGeometry(h, 0.7, 6, 16, Math.PI);
    xf(rib, { x: 0, y: 0, z, rz: 0, sx: 1.4 });
    parts.push(tint(rib, i % 2 ? 0xffffff : 0xeeeeee));
  }
  parts.push(P.box(44, 2, 82, 0xe8e2d6, { y: 1, z: -38 }));
  g.add(new THREE.Mesh(merge(parts), MAT.lamb));
  g.position.y = DIM.STREET;
  g.userData = { near: true, x: 46 };
  return g;
}

function lmRafal() {
  const g = new THREE.Group();
  const H = 308, W = 36, D = 24;
  const sh = new THREE.Shape();
  sh.moveTo(-W / 2, 0); sh.lineTo(W / 2, 0); sh.lineTo(W / 2, H * 0.97); sh.lineTo(-W / 2, H * 0.84); sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, { depth: D, bevelEnabled: false });
  geo.translate(0, 0, -D / 2);
  g.add(new THREE.Mesh(geo, facadeTexMat('fGlassBlue', 1 / 8, 1 / 7, 0.8)));
  const parts = [];
  for (let i = 0; i < 7; i++) parts.push(P.box(0.9, H * 0.82, 1.2, 0xc9d1db, { x: -W / 2 + 2 + i * (W - 4) / 6, y: H * 0.41, z: -D / 2 - 0.5 }));
  parts.push(P.box(2.4, H * 0.16, 2.4, 0xe3e8ee, { x: W / 2 - 1.2, y: H * 1.03 }));
  parts.push(P.cyl(0.5, 1.2, 26, 6, 0xe3e8ee, { x: W / 2 - 1.2, y: H * 1.15 }));
  parts.push(P.box(80, 16, 60, 0xd9cdb5, { y: 8 }));
  g.add(new THREE.Mesh(merge(parts), MAT.lamb));
  const edge = new THREE.Mesh(new THREE.BoxGeometry(W * 1.02, 1.2, D + 1), glowMat(0xff5aa5, 1));
  edge.position.y = H * 0.905; edge.rotation.z = Math.atan2(H * 0.13, W); g.add(edge);
  g.scale.setScalar(LSC);
  g.userData = { ar: 'برج رافال', en: 'Burj Rafal · 308 m', short: 'Burj Rafal', x: -70, color: '#e4002b' };
  return g;
}
const LANDMARK_BUILDERS = [lmKingdom, lmFaisaliah, lmLibrary, lmMajdoul, lmMOI, lmKAFD, lmRafal];
