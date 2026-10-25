/* ---------- open highway: track in the median, palm-lined medians, 3-lane roads, roadside Riyadh ---------- */
const SEG = 60, NSEG = 15;
const PX = 4.3, MX = 7.3, RX = 18.3, SX = 21.6; // track edge, median edge, road edge, sidewalk edge
function planeXZ(w, l, cx, cy, cz, uRep, vRep) {
  const g = new THREE.PlaneGeometry(w, l); g.rotateX(-Math.PI / 2);
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * uRep, uv.getY(i) * vRep);
  g.translate(cx, cy, cz); return g;
}
function uvConst(g, u, v) { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, u, v); return g; }

/* date palm: ringed trunk with frond-base stubs, pinnate fronds (rachis + leaflets), hanging date bunches */
function palmTrunk(x, z, h, y0, lean = 0) {
  const pts = [], n = 30;
  for (let i = 0; i <= n; i++) { const t = i / n; pts.push(new THREE.Vector2((0.3 - t * 0.08) * (i % 2 ? 0.94 : 1.1) + (t < 0.06 ? 0.12 * (1 - t / 0.06) : 0), t * h)); }
  const g = new THREE.LatheGeometry(pts, 12);
  xf(g, { rz: lean }); xf(g, { x, y: y0, z });
  const top = new THREE.Vector3(x - Math.sin(lean) * h, y0 + Math.cos(lean) * h, z);
  const parts = [tint(g, 0x7f5634), P.sph(0.34, 0x6b4a2c, { x: top.x, y: top.y, z: top.z }, 16, 12)];
  for (let i = 0; i < 12; i++) { // old frond bases under the crown
    const a = i * 0.52 + h, yy = top.y - 0.35 - (i % 3) * 0.18;
    parts.push(P.cone(0.09, 0.42, 6, 0x7a5230, { x: top.x + Math.cos(a) * 0.26, y: yy, z: top.z + Math.sin(a) * 0.26, rx: Math.sin(a) * 2.4, rz: -Math.cos(a) * 2.4 }));
  }
  return { parts, top };
}
const _pc = [new THREE.Color(0x2b8a3e), new THREE.Color(0x58c060), new THREE.Color(0x3fa14d), new THREE.Color(0x7bd36a)];
function frondGeo(len, wid, droop, seed) {
  // rachis curve + paired leaflets, built as raw triangles with a dark-to-light colour ramp
  const pos = [], col = [];
  const P3 = (t) => new THREE.Vector3(0, -droop * t * t * len, t * len);
  const push = (a, b, c, ca, cb, cc) => { pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z); col.push(ca.r, ca.g, ca.b, cb.r, cb.g, cb.b, cc.r, cc.g, cc.b); };
  const NS = 16;
  for (let i = 0; i < NS; i++) { // rachis ribbon
    const t0 = i / NS, t1 = (i + 1) / NS, w0 = 0.035 * (1 - t0), w1 = 0.035 * (1 - t1);
    const a = P3(t0), b = P3(t1);
    push(new THREE.Vector3(-w0, a.y + 0.01, a.z), new THREE.Vector3(w0, a.y + 0.01, a.z), new THREE.Vector3(w1, b.y + 0.01, b.z), _pc[0], _pc[0], _pc[0]);
    push(new THREE.Vector3(-w0, a.y + 0.01, a.z), new THREE.Vector3(w1, b.y + 0.01, b.z), new THREE.Vector3(-w1, b.y + 0.01, b.z), _pc[0], _pc[0], _pc[0]);
  }
  const NL = 18;
  for (let i = 1; i < NL; i++) {
    const t = i / NL, base = P3(t), L = wid * Math.sin(Math.PI * Math.min(1, t * 1.1)) * (1 - t * 0.3) + 0.12;
    const tip = (i + seed) % 2 ? _pc[3] : _pc[1];
    for (const sd of [-1, 1]) {
      const dir = new THREE.Vector3(sd * 0.85, 0.32, 0.45).normalize();
      const end = base.clone().addScaledVector(dir, L); end.y -= L * 0.25 * t;
      const side = new THREE.Vector3(0, 0, 0.055);
      push(base.clone().sub(side), base.clone().add(side), end, _pc[2], _pc[2], tip);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(pos.length / 3 * 2), 2));
  g.computeVertexNormals();
  return g;
}
function palmCrown(top, s = 1, seed = 0) {
  const parts = [], n = 15;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + seed;
    const ring = i % 3;
    const fr = frondGeo(3.1 * s * (ring === 0 ? 0.8 : 1), 0.95 * s, ring === 0 ? 0.08 : ring === 1 ? 0.24 : 0.4, i);
    xf(fr, { rx: ring === 0 ? -0.9 : ring === 1 ? -0.35 : 0.05 });
    xf(fr, { ry: a });
    xf(fr, { x: top.x, y: top.y + 0.05, z: top.z });
    parts.push(fr);
  }
  return parts;
}
function dateBunches(top, seed) {
  const parts = [];
  for (let b = 0; b < 2; b++) {
    const a = b * 2.1 + seed, cx = top.x + Math.cos(a) * 0.42, cz = top.z + Math.sin(a) * 0.42;
    parts.push(P.cyl(0.02, 0.03, 0.6, 6, 0xd9a03a, { x: cx, y: top.y - 0.35, z: cz, rz: Math.cos(a) * 0.5, rx: -Math.sin(a) * 0.5 }));
    for (let k = 0; k < 10; k++) parts.push(P.sph(0.075, k % 3 ? 0xe8861c : 0xb85a12, { x: cx + Math.cos(k * 2.4) * 0.12, y: top.y - 0.55 - (k % 5) * 0.07, z: cz + Math.sin(k * 2.4) * 0.12, sy: 1.35 }, 5, 3));
  }
  return parts;
}
function palm(x, z, h, y0, lean, seed, solid, leaves, s = 1) {
  const t = palmTrunk(x, z, h, y0, lean);
  solid.push(...t.parts, ...dateBunches(t.top, seed)); leaves.push(...palmCrown(t.top, s, seed));
}
function bougainvillea(x, z, y0, r) {
  const p = [];
  for (let i = 0; i < 5; i++) { const a = i * 1.26; p.push(P.sph(r * (0.6 + (i % 2) * 0.2), i % 2 ? 0x3f9a3a : 0x2f8a34, { x: x + Math.cos(a) * r * 0.5, y: y0 + r * 0.55, z: z + Math.sin(a) * r * 0.5, sy: 0.8 }, 10, 7)); }
  for (let i = 0; i < 12; i++) { const a = i * 2.39, rr = r * (0.7 + (i % 4) * 0.1); p.push(P.sph(r * 0.17, i % 3 ? 0xe0338a : 0xf26bb0, { x: x + Math.cos(a) * rr, y: y0 + r * (0.5 + (i % 5) * 0.12), z: z + Math.sin(a) * rr }, 5, 4)); }
  return p;
}
function busStop(x, z, y0, side) {
  const d = -side;
  return [
    P.box(0.12, 2.6, 0.12, 0x4a4f5a, { x: x - d * 0.9, y: y0 + 1.3, z: z - 2.6 }), P.box(0.12, 2.6, 0.12, 0x4a4f5a, { x: x - d * 0.9, y: y0 + 1.3, z: z + 2.6 }),
    P.box(2.4, 0.16, 6.2, 0xf2f2f0, { x, y: y0 + 2.7, z, rz: d * 0.08 }), P.box(2.5, 0.06, 6.3, 0x1d9bf0, { x, y: y0 + 2.6, z, rz: d * 0.08 }),
    P.box(0.05, 2.0, 5.0, 0x9fd0ea, { x: x - d * 0.95, y: y0 + 1.25, z }),
    P.box(0.5, 0.1, 3.6, 0xa8642f, { x: x - d * 0.55, y: y0 + 0.5, z }), P.box(0.1, 0.5, 3.6, 0x4a4f5a, { x: x - d * 0.55, y: y0 + 0.25, z }),
    P.box(0.14, 2.0, 1.4, 0x0b8a4a, { x, y: y0 + 1.3, z: z + 2.9 }), P.box(0.16, 1.6, 1.1, 0xffd21f, { x, y: y0 + 1.35, z: z + 2.9 })
  ];
}
function lampParts(x, z, y0) {
  const parts = [P.cyl(0.32, 0.4, 0.5, 16, 0x7d858f, { x, y: y0 + 0.25, z }), P.cyl(0.11, 0.15, 9.5, 14, 0xa7aeb8, { x, y: y0 + 4.8, z })];
  for (const d of [-1, 1]) {
    parts.push(P.box(2.2, 0.1, 0.1, 0xa7aeb8, { x: x + d * 1.1, y: y0 + 9.4, z, rz: d * 0.12 }));
    parts.push(P.sph(0.32, 0xdfe4ea, { x: x + d * 2.15, y: y0 + 9.45, z, sy: 0.45, sz: 0.8 }, 14, 8), P.box(0.48, 0.05, 0.24, 0xfff4cf, { x: x + d * 2.15, y: y0 + 9.3, z }));
  }
  // green flag banner on the pole
  parts.push(P.box(0.05, 1.6, 0.85, 0x0b8a4a, { x: x + 0.12, y: y0 + 6.8, z }), P.box(0.06, 0.12, 0.6, 0xffffff, { x: x + 0.13, y: y0 + 6.6, z }));
  return parts;
}
function shrub(x, z, y0, r, col) { return [P.sph(r, col, { x, y: y0 + r * 0.6, z, sy: 0.75 }, 14, 10), P.sph(r * 0.7, col === 0x3f9a3a ? 0x58b84a : 0x3f9a3a, { x: x + r * 0.5, y: y0 + r * 0.5, z: z + r * 0.3, sy: 0.75 }, 12, 8)]; }

function buildSegmentGeos() {
  GEO.segTrack = planeXZ(8.6, SEG, 0, 0.02, -SEG / 2, 1, SEG / 10);
  const rw = RX - MX;
  const rR = planeXZ(rw, SEG, MX + rw / 2, 0.05, -SEG / 2, 1, SEG / 10), rL = planeXZ(rw, SEG, -MX - rw / 2, 0.05, -SEG / 2, 1, SEG / 10);
  const uvL = rL.attributes.uv; for (let i = 0; i < uvL.count; i++) uvL.setX(i, 1 - uvL.getX(i));
  GEO.segRoad = merge([rR, rL]);
  const mw = MX - PX - 0.5;
  GEO.segMedian = merge([planeXZ(mw, SEG, PX + 0.25 + mw / 2, 0.36, -SEG / 2, mw / 4, SEG / 4), planeXZ(mw, SEG, -PX - 0.25 - mw / 2, 0.36, -SEG / 2, mw / 4, SEG / 4)]);
  const sw = SX - RX;
  GEO.segWalk = merge([planeXZ(sw, SEG, RX + sw / 2, 0.26, -SEG / 2, sw / 4, SEG / 4), planeXZ(sw, SEG, -RX - sw / 2, 0.26, -SEG / 2, sw / 4, SEG / 4)]);
  const mk = (variant) => {
    const solid = [], leaves = [];
    for (const lx of [-2.6, 0, 2.6]) for (const r of [-0.72, 0.72]) {
      solid.push(P.box(0.14, 0.18, SEG, 0x8a94a3, { x: lx + r, y: 0.09, z: -SEG / 2 }));
      solid.push(P.box(0.16, 0.05, SEG, 0xf1f5f9, { x: lx + r, y: 0.2, z: -SEG / 2 }));
    }
    for (const s of [-1, 1]) {
      // median curbs
      solid.push(P.box(0.25, 0.36, SEG, 0xd8cfc0, { x: s * (PX + 0.13), y: 0.18, z: -SEG / 2 }), P.box(0.25, 0.36, SEG, 0xd8cfc0, { x: s * (MX - 0.13), y: 0.18, z: -SEG / 2 }));
      solid.push(P.box(0.12, 0.38, SEG, 0xffd21f, { x: s * (MX - 0.02), y: 0.19, z: -SEG / 2 }));
      solid.push(P.box(0.3, 0.26, SEG, 0xcfc4b2, { x: s * (RX + 0.15), y: 0.13, z: -SEG / 2 }));
      const mx = s * (PX + MX) / 2;
      for (let k = 0; k < 3; k++) {
        const z = -(k + 0.5) * (SEG / 3) + (variant ? 8 : 0);
        palm(mx, z, 6.0 + ((k * 7 + variant * 3 + (s > 0 ? 1 : 0)) % 4) * 0.6, 0.36, ((k + variant) % 3 - 1) * 0.05, k * 0.7 + s, solid, leaves);
        solid.push(...bougainvillea(mx + 0.4 * s, z - 7, 0.36, 0.6));
      }
      for (let k = 0; k < 3; k++) {
        const z = -(k + 0.5) * (SEG / 3) - (variant ? 6 : 0);
        palm(s * 20.4, z, 7.0 + (k % 3) * 0.7, 0.26, s * 0.04, k * 1.3 + variant, solid, leaves, 1.1);
      }
      solid.push(...lampParts(mx, -(variant ? 3 : 33), 0.36));
      if (variant === 1) solid.push(...busStop(s * 20.9, -26, 0.26, s));
      for (const hz of [-4, -44]) solid.push(P.box(0.9, 0.7, 6, 0x3f9a3a, { x: s * (RX + 1.0), y: 0.6, z: hz }), P.cyl(0.45, 0.45, 6, 12, 0x4aa844, { x: s * (RX + 1.0), y: 0.95, z: hz, rx: Math.PI / 2 }));
    }
    return { solid: merge(solid), leaves: merge(leaves) };
  };
  const a = mk(0), b = mk(1);
  GEO.segVC = [a.solid, b.solid]; GEO.segLeaves = [a.leaves, b.leaves];
  // elevated metro viaduct on the left side of the road
  const vx = -27, vy = 11;
  GEO.viaduct = merge([
    P.box(8.6, 1.2, SEG, 0xe9e2d4, { x: vx, y: vy, z: -SEG / 2 }),
    P.box(8.9, 0.45, SEG, 0x1d9bf0, { x: vx, y: vy - 0.75, z: -SEG / 2 }),
    P.box(0.35, 1.0, SEG, 0xd6cdbb, { x: vx - 4.3, y: vy + 1.05, z: -SEG / 2 }), P.box(0.35, 1.0, SEG, 0xd6cdbb, { x: vx + 4.3, y: vy + 1.05, z: -SEG / 2 }),
    ...[-15, -45].flatMap((z) => [P.cyl(0.95, 1.1, vy, 20, 0xe2dacb, { x: vx, y: vy / 2, z }), P.box(6.6, 1.1, 2.4, 0xe2dacb, { x: vx, y: vy - 1.0, z })]),
    ...[-2.6, -1.2, 1.2, 2.6].map((dx) => P.box(0.1, 0.12, SEG, 0x7b818c, { x: vx + dx, y: vy + 0.66, z: -SEG / 2 }))
  ]);
}
function buildEnvMaterials() {
  MAT.track = new THREE.MeshToonMaterial({ map: TEX.track, gradientMap: TOON_GRAD });
  MAT.road = new THREE.MeshToonMaterial({ map: TEX.asphalt, gradientMap: TOON_GRAD });
  MAT.median = new THREE.MeshToonMaterial({ map: TEX.median, gradientMap: TOON_GRAD });
  MAT.paver = new THREE.MeshToonMaterial({ map: TEX.paver, gradientMap: TOON_GRAD });
  TEX.sand.repeat.set(160, 160);
  MAT.sand = new THREE.MeshToonMaterial({ map: TEX.sand, gradientMap: TOON_GRAD });
  MAT.leaves = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: TOON_GRAD, side: THREE.DoubleSide });
  MAT.facade = {};
  for (const k of ['fGlassBlue', 'fGlassTeal', 'fGlassDark', 'fGlassBronze', 'fGlassSilver', 'fGlassSky']) MAT.facade[k] = new THREE.MeshLambertMaterial({ map: TEX[k] });
  MAT.roof = new THREE.MeshLambertMaterial({ color: 0xf2d2a6 });
  MAT.towerVC = new THREE.MeshLambertMaterial({ vertexColors: true });
}

/* shop block (used sparingly by the roadside) */
function makeStreetBuilding(design) {
  const { w, h, d, pal, shop, style } = design;
  const tex = facadeTexture(d, h, pal, shop, style);
  const mat = new THREE.MeshToonMaterial({ map: tex, gradientMap: TOON_GRAD, vertexColors: true });
  const box = new THREE.BoxGeometry(w, h, d);
  const ART = (u1) => [0, u1, 0.125, 1], PATCH = [0.05, 0.3, 0.02, 0.1];
  remapUV(box, [ART(1), ART(1), PATCH, PATCH, ART(Math.min(1, w / d)), ART(Math.min(1, w / d))]);
  box.translate(0, h / 2, 0);
  const parts = [tint(box, 0xffffff)];
  const det = [];
  for (const sx of [-1, 1]) {
    const fx = sx * (w / 2);
    const n = Math.max(3, Math.round(d / 1.5));
    for (let i = 0; i < n; i++) det.push(P.cone(0.5, 1.0, 4, pal.dark, { x: fx - sx * 0.3, y: h + 0.45, z: -d / 2 + (i + 0.5) * d / n, ry: Math.PI / 4 }));
    det.push(P.box(0.5, 0.35, d + 0.3, pal.trim, { x: fx - sx * 0.2, y: h, z: 0 }));
    const aw = Math.min(d * 0.66, 9.5), na = 8;
    const awCol = [0x0b9e4f, 0xe53935, 0x1d6fd1, 0xff8f00][shop[1].length % 4];
    for (let i = 0; i < na; i++) {
      const b = new THREE.BoxGeometry(1.5, 0.08, aw / na);
      xf(b, { rz: sx * 0.42 }); xf(b, { x: fx + sx * 0.68, y: 4.55, z: -aw / 2 + (i + 0.5) * aw / na });
      det.push(tint(b, i % 2 ? 0xffffff : awCol));
    }
  }
  for (const g of det) { uvConst(g, 0.9, 0.05); parts.push(g); }
  return new THREE.Mesh(merge(parts), mat);
}
function lowDesigns() {
  const out = [], styles = ['mash', 'arch', 'shut'];
  for (let i = 0; i < 14; i++) out.push({ w: rand(10, 13), h: rand(8.6, 13), d: rand(12, 21), pal: WALLS[(i * 3) % WALLS.length], shop: SHOPS[i % SHOPS.length], style: styles[(i * 2) % 3] });
  return out;
}
function streetDesigns() {
  const out = [], styles = ['mash', 'arch', 'shut'];
  for (let i = 0; i < 8; i++) out.push({ w: rand(12, 16), h: rand(10, 16), d: rand(16, 24), pal: WALLS[i % WALLS.length], shop: SHOPS[(i * 3) % SHOPS.length], style: styles[i % 3] });
  return out;
}

/* roadside pieces: villa compounds, mosques, billboards */
function makeVilla(seed) {
  const solid = [], leaves = [];
  const wall = [0xf1dfc0, 0xf6e9d2, 0xe9d0a8][seed % 3], trim = [0xc98e52, 0xb07c4c, 0xd09a5c][seed % 3];
  const W = 22, D = 24, wh = 2.8;
  for (const [x, z, w, d] of [[0, -D / 2, W, 0.4], [0, D / 2, W, 0.4], [-W / 2, 0, 0.4, D], [W / 2, 0, 0.4, D]]) {
    solid.push(P.box(w, wh, d, wall, { x, y: wh / 2, z }));
    const n = Math.round(Math.max(w, d) / 1.2);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      solid.push(P.cone(0.32, 0.6, 4, trim, { x: w > d ? x - w / 2 + t * w : x, y: wh + 0.3, z: w > d ? z : z - d / 2 + t * d, ry: Math.PI / 4 }));
    }
  }
  solid.push(P.box(3.2, 2.4, 0.5, 0x2f6b4f, { x: -W / 2 - 0.05, y: 1.2, z: 0, ry: Math.PI / 2 }));
  // house
  solid.push(P.box(13, 7, 11, wall, { x: 1, y: 3.5, z: -1 }), P.box(13.4, 0.5, 11.4, trim, { x: 1, y: 7.1, z: -1 }), P.box(7, 3.4, 7, wall, { x: 3, y: 8.9, z: -2 }));
  for (const [y, zz] of [[2, 4.6], [5.2, 4.6]]) for (const xx of [-3.5, 0, 3.5]) solid.push(P.box(1.4, 1.8, 0.2, 0x3f6f9e, { x: xx + 1, y, z: zz }));
  for (const y of [2, 5.2]) for (const zz of [-4, 0, 3]) solid.push(P.box(0.2, 1.8, 1.4, 0x3f6f9e, { x: -5.6, y, z: zz - 1 }));
  for (let i = 0; i < 10; i++) solid.push(P.cone(0.32, 0.6, 4, trim, { x: -5.3 + i * 1.35, y: 7.6, z: 4.5, ry: Math.PI / 4 }));
  palm(-7.5, -8, 7, 0, 0.06, seed, solid, leaves); palm(8, 8, 6.4, 0, -0.05, seed + 2, solid, leaves);
  solid.push(...shrub(-8, 8, 0, 1.0, 0x3f9a3a));
  const g = new THREE.Group();
  g.add(new THREE.Mesh(merge(solid), MAT.toon), new THREE.Mesh(merge(leaves), MAT.leaves));
  g.userData.len = D;
  return g;
}
function makeMosque(seed) {
  const solid = [];
  const wall = 0xf4ead8, trim = 0xc99a62, dome = seed % 2 ? 0xf7f4ee : 0x6ab08a;
  solid.push(P.box(24, 6, 24, wall, { y: 3 }), P.box(24.6, 0.6, 24.6, trim, { y: 6.2 }));
  for (let i = 0; i < 16; i++) { const t = (i + 0.5) / 16; for (const [x, z] of [[-12 + t * 24, 12.2], [-12 + t * 24, -12.2], [12.2, -12 + t * 24], [-12.2, -12 + t * 24]]) solid.push(P.cone(0.38, 0.7, 4, trim, { x, y: 6.8, z, ry: Math.PI / 4 })); }
  for (const xx of [-8, -4, 0, 4, 8]) { solid.push(P.box(1.8, 3.2, 0.3, 0x5b4a3a, { x: xx, y: 2.2, z: 12.05 }), P.cyl(0.9, 0.9, 0.3, 16, 0x5b4a3a, { x: xx, y: 3.8, z: 12.05, rx: Math.PI / 2 })); }
  for (const zz of [-8, -4, 0, 4, 8]) { solid.push(P.box(0.3, 3.2, 1.8, 0x5b4a3a, { x: -12.05, y: 2.2, z: zz }), P.cyl(0.9, 0.9, 0.3, 16, 0x5b4a3a, { x: -12.05, y: 3.8, z: zz, rz: Math.PI / 2 })); }
  solid.push(P.cyl(6.4, 6.4, 3, 32, wall, { y: 7.8 }), P.geo(new THREE.SphereGeometry(6.6, 36, 18, 0, TAU, 0, Math.PI / 2), dome, { y: 9.2, sy: 1.15 }));
  solid.push(P.cyl(0.18, 0.25, 1.6, 10, 0xd8a531, { y: 17.6 }), P.sph(0.4, 0xd8a531, { y: 18.6 }, 12, 10), P.tor(0.5, 0.1, 8, 16, Math.PI * 1.4, 0xd8a531, { y: 19.5, rz: 0.9 }));
  // minaret
  const mx = 9, mz = -9;
  solid.push(P.box(3.4, 10, 3.4, wall, { x: mx, y: 5, z: mz }), P.cyl(1.4, 1.5, 16, 16, wall, { x: mx, y: 18, z: mz }));
  solid.push(P.cyl(2.1, 1.6, 1, 16, trim, { x: mx, y: 24.6, z: mz }), P.cyl(1.25, 1.25, 4, 16, wall, { x: mx, y: 27.1, z: mz }), P.cyl(1.7, 1.7, 0.5, 16, trim, { x: mx, y: 29.3, z: mz }));
  solid.push(P.cone(1.3, 3.4, 16, dome, { x: mx, y: 31.2, z: mz }), P.tor(0.35, 0.08, 8, 14, Math.PI * 1.4, 0xd8a531, { x: mx, y: 33.4, z: mz, rz: 0.9 }));
  for (let i = 0; i < 4; i++) solid.push(P.box(0.5, 1.6, 0.2, 0x5b4a3a, { x: mx + Math.sin(i * Math.PI / 2) * 1.27, y: 27.3, z: mz + Math.cos(i * Math.PI / 2) * 1.27, ry: i * Math.PI / 2 }));
  const g = new THREE.Group(); g.add(new THREE.Mesh(merge(solid), MAT.toon)); g.userData.len = 26;
  return g;
}
const BILLBOARDS = [['أهلاً بكم في الرياض', 'Welcome to Riyadh', '#0b8a4a'], ['قهوة سعودية', 'Saudi coffee · fresh dates', '#c96a1e'], ['الرياض تقرأ', 'Riyadh reads · book fair', '#1d6fd1'], ['الدرعية', 'Visit Diriyah', '#8a4b2a']];
function makeBillboard(i) {
  const [ar, en, col] = BILLBOARDS[i % BILLBOARDS.length];
  const tex = canvasTex(1024, 384, (g, W, H) => {
    const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, col); gr.addColorStop(1, '#16213f');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,255,255,.1)'; for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(W * 0.85, H * 0.5, 40 + k * 40, 0, TAU); g.fill(); }
    textBlock(g, ar, W * 0.45, H * 0.4, `130px ${AR_FONT}`, '#ffffff');
    textBlock(g, en.toUpperCase(), W * 0.45, H * 0.78, `54px ${EN_FONT}`, '#ffd21f');
  }, false);
  const g = new THREE.Group();
  g.add(new THREE.Mesh(merge([P.cyl(0.35, 0.45, 9, 14, 0x7d858f, { x: -3.5, y: 4.5 }), P.cyl(0.35, 0.45, 9, 14, 0x7d858f, { x: 3.5, y: 4.5 }), P.box(13, 5, 0.4, 0x3d4652, { y: 10.5, z: 0.25 })]), MAT.toon));
  const b = new THREE.Mesh(new THREE.PlaneGeometry(12.6, 4.7), new THREE.MeshToonMaterial({ map: tex, gradientMap: TOON_GRAD }));
  b.position.set(0, 10.5, 0.02); g.add(b);
  g.userData.len = 10; g.userData.billboard = true;
  return g;
}

/* cars on the highway */
function profileGeo(pts, width, col, bevel = 0.07) {
  const sh = new THREE.Shape(); sh.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]);
  const g = new THREE.ExtrudeGeometry(sh, { depth: width - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 6 });
  g.rotateY(-Math.PI / 2); g.translate(width / 2 - bevel, 0, 0);
  return tint(g, col);
}
function makeAutoGeo(kind, col) {
  const p = [], glass = 0x1f3048, trim = 0x1c1c22, chrome = 0xd8dde3, suv = kind === 'suv';
  const W = suv ? 1.98 : 1.86, L2 = suv ? 2.45 : 2.35, belt = suv ? 1.22 : 1.02, roof = suv ? 2.02 : 1.55;
  p.push(profileGeo([[-L2, 0.38], [-L2, belt - 0.25], [-L2 + 0.25, belt], [L2 - 0.15, belt + 0.03], [L2, belt - 0.15], [L2, 0.38]], W, col));
  const wf = suv ? -1.0 : -0.75, wr = suv ? 2.25 : 1.35;
  p.push(profileGeo([[wf, belt], [wf + 0.55, roof - 0.04], [wr - 0.15, roof - 0.04], [wr, belt]], W - 0.14, glass, 0.04));
  p.push(profileGeo([[wf + 0.5, roof - 0.06], [wr - 0.12, roof - 0.06], [wr - 0.12, roof + 0.02], [wf + 0.5, roof + 0.02]], W - 0.1, col, 0.04));
  for (const x of [-1, 1]) {
    const xx = x * (W / 2 - 0.08);
    p.push(P.box(0.06, Math.hypot(0.55, roof - belt), 0.09, col, { x: xx, y: (belt + roof) / 2, z: wf + 0.28, rx: -Math.atan2(0.55, roof - belt) }));
    p.push(P.box(0.06, roof - belt, 0.14, col, { x: xx, y: (belt + roof) / 2, z: (wf + wr) / 2 }), P.box(0.06, roof - belt, 0.16, col, { x: xx, y: (belt + roof) / 2, z: wr - 0.1 }));
    p.push(P.box(0.05, 0.03, 0.5, trim, { x: x * (W / 2 + 0.01), y: belt - 0.28, z: wf + 0.9 }));
    p.push(P.box(0.18, 0.12, 0.08, col, { x: x * (W / 2 + 0.1), y: belt + 0.08, z: wf + 0.1 }), P.box(0.14, 0.03, 0.03, trim, { x: x * (W / 2 + 0.04), y: belt + 0.03, z: wf + 0.1 }));
    for (const z of [-L2 + 0.85, L2 - 0.85]) {
      p.push(P.tor(0.47, 0.06, 8, 24, Math.PI, trim, { x: x * (W / 2 - 0.02), y: 0.4, z, ry: Math.PI / 2 }));
      p.push(P.cyl(0.4, 0.4, 0.28, 28, 0x15151a, { x: x * (W / 2 - 0.14), y: 0.4, z, rz: Math.PI / 2 }));
      p.push(P.cyl(0.24, 0.24, 0.05, 24, chrome, { x: x * (W / 2 - 0.0), y: 0.4, z, rz: Math.PI / 2 }), P.cyl(0.07, 0.07, 0.07, 12, 0x6a6f78, { x: x * (W / 2 + 0.02), y: 0.4, z, rz: Math.PI / 2 }));
      for (let k = 0; k < 5; k++) { const ang = k * TAU / 5; p.push(P.box(0.03, 0.2, 0.05, 0x9aa1ad, { x: x * (W / 2 + 0.015), y: 0.4 + Math.cos(ang) * 0.12, z: z + Math.sin(ang) * 0.12, rx: -ang })); }
    }
  }
  // front: grille, lights, bumper, plate
  p.push(P.box(W - 0.5, 0.32, 0.06, trim, { y: belt - 0.38, z: -L2 - 0.02 }));
  for (let k = 0; k < 4; k++) p.push(P.box(W - 0.55, 0.025, 0.07, chrome, { y: belt - 0.5 + k * 0.08, z: -L2 - 0.04 }));
  for (const x of [-1, 1]) { p.push(P.box(0.38, 0.16, 0.08, 0xfff6d0, { x: x * (W / 2 - 0.3), y: belt - 0.2, z: -L2 - 0.02 }), P.box(0.4, 0.18, 0.06, chrome, { x: x * (W / 2 - 0.3), y: belt - 0.2, z: -L2 + 0.0 })); }
  p.push(P.box(W + 0.04, 0.2, 0.18, trim, { y: 0.48, z: -L2 }), P.box(0.5, 0.13, 0.03, 0xffffff, { y: 0.6, z: -L2 - 0.1 }));
  for (const x of [-1, 1]) p.push(P.box(0.32, 0.18, 0.06, 0xd0142c, { x: x * (W / 2 - 0.25), y: belt - 0.2, z: L2 + 0.02 }));
  p.push(P.box(W + 0.04, 0.2, 0.18, trim, { y: 0.48, z: L2 }), P.box(0.5, 0.13, 0.03, 0xffffff, { y: 0.66, z: L2 + 0.1 }));
  if (suv) for (const x of [-0.7, 0.7]) p.push(P.box(0.05, 0.05, 2.6, 0x9aa1ad, { x, y: roof + 0.12, z: (wf + wr) / 2 + 0.2 }), P.box(0.05, 0.1, 0.05, 0x9aa1ad, { x, y: roof + 0.06, z: wf + 0.8 }), P.box(0.05, 0.1, 0.05, 0x9aa1ad, { x, y: roof + 0.06, z: wr - 0.4 }));
  if (kind === 'taxi') p.push(P.box(0.8, 0.24, 0.34, 0xffd21f, { y: roof + 0.14, z: 0.3 }), P.box(1.9, 0.08, 4.4, 0x0b8a4a, { y: belt - 0.32 }));
  return merge(p);
}
const AUTO_COLORS = [0xf7f7f4, 0xf7f7f4, 0xf7f7f4, 0xe8e2d6, 0xb8bec6, 0x2a2a30, 0xd8c29a, 0x8a2433, 0x2c4a8a];
let AUTO_GEOS = [];
function buildAutoGeos() { AUTO_GEOS = []; for (const c of AUTO_COLORS) { AUTO_GEOS.push(makeAutoGeo('suv', c), makeAutoGeo('sedan', c)); } AUTO_GEOS.push(makeAutoGeo('taxi', 0xf7f7f4)); }

/* green sign gantry over both carriageways */
function makeGantry(signIdx) {
  const g = new THREE.Group();
  const col = 0x9aa1ad;
  g.add(new THREE.Mesh(merge([
    P.cyl(0.32, 0.4, 13, 16, col, { x: -RX - 0.6, y: 6.5 }), P.cyl(0.32, 0.4, 13, 16, col, { x: RX + 0.6, y: 6.5 }),
    P.box(2 * RX + 2, 0.45, 0.45, col, { y: 12.6 }), P.box(2 * RX + 2, 0.3, 0.3, col, { y: 11.1, z: 0.25 })
  ]), MAT.toon));
  for (const s of [-1, 1]) {
    const sg = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 2.6), new THREE.MeshToonMaterial({ map: signTex(signIdx + (s > 0 ? 1 : 0)), gradientMap: TOON_GRAD, transparent: true }));
    sg.position.set(s * 12.8, 11.9, 0.35); g.add(sg);
  }
  return g;
}
/* concrete overpass crossing the highway */
const BRIDGE_NAMES = [['الدائري الشمالي', 'Northern Ring Rd'], ['طريق العروبة', 'Al Urubah Rd'], ['طريق التحلية', 'Tahlia St'], ['طريق الملك عبدالله', 'King Abdullah Rd']];
function makeBridge(i) {
  const g = new THREE.Group();
  const [ar, en] = BRIDGE_NAMES[i % BRIDGE_NAMES.length];
  const D = 16, y0 = 11.4, y1 = 13.2;
  const face = new THREE.MeshToonMaterial({ map: bridgeTex(ar, en), gradientMap: TOON_GRAD });
  const plain = new THREE.MeshToonMaterial({ color: 0xe6d6bd, gradientMap: TOON_GRAD });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(110, y1 - y0, D), [plain, plain, plain, new THREE.MeshToonMaterial({ color: 0xa89a86, gradientMap: TOON_GRAD }), face, face]);
  deck.position.set(0, (y0 + y1) / 2, -D / 2); g.add(deck);
  const parts = [P.box(110, 1.0, 0.4, 0xd6c4a6, { y: y1 + 0.5, z: -0.2 }), P.box(110, 1.0, 0.4, 0xd6c4a6, { y: y1 + 0.5, z: -D + 0.2 })];
  for (const x of [-RX - 1.5, RX + 1.5, -40, 40]) { parts.push(P.cyl(1.1, 1.3, y0, 20, 0xd9cdb8, { x, y: y0 / 2, z: -D * 0.3 }), P.cyl(1.1, 1.3, y0, 20, 0xd9cdb8, { x, y: y0 / 2, z: -D * 0.7 }), P.box(3, 1, D * 0.8, 0xd9cdb8, { x, y: y0 - 0.5, z: -D / 2 })); }
  g.add(new THREE.Mesh(merge(parts), MAT.toon));
  const shade = new THREE.Mesh(new THREE.PlaneGeometry(2 * RX, D + 4), new THREE.MeshBasicMaterial({ color: 0x2a1a10, transparent: true, opacity: 0.16, depthWrite: false }));
  shade.rotation.x = -Math.PI / 2; shade.position.set(0, 0.4, -D / 2); shade.renderOrder = 1; g.add(shade);
  g.userData.len = D;
  return g;
}
/* background tower */
function makeTower(w, h, d, key, style) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(boxScaledUV(w, h, d, 16, 14), MAT.facade[key]); m.position.y = h / 2; g.add(m);
  const parts = [];
  if (style === 'crown') parts.push(P.box(w * 0.7, h * 0.06, d * 0.7, 0xdde6f0, { y: h + h * 0.03 }), P.cyl(0.3, 0.5, h * 0.18, 8, 0xffffff, { y: h + h * 0.14 }));
  else if (style === 'slant') { const s = new THREE.BoxGeometry(w, h * 0.12, d); xf(s, { y: h + h * 0.03, rz: 0.24 }); parts.push(tint(s, 0xbfe3ff)); }
  else parts.push(P.box(w * 0.4, 3, d * 0.4, 0xf2e6d2, { y: h + 1.5 }));
  g.add(new THREE.Mesh(merge(parts), MAT.towerVC));
  return g;
}
