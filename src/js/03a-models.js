/* ---------- gameplay models: metro cars, ramps, barriers, coins, pickups ---------- */
const MAT = {};
const DIM = { LANE: 2.6, CAR_L: 13, CAR_GAP: 0.5, TRAIN_W: 2.5, ROOF: 3.4, RAMP_L: 7.5, PLAT: 0.45, STREET: 0.45 };
function buildBaseMaterials() {
  MAT.toon = toonVC();
  MAT.lamb = lambVC();
  MAT.train = {};
  for (const L of LINES) MAT.train[L.id] = new THREE.MeshToonMaterial({ map: TEX.train[L.id], gradientMap: TOON_GRAD });
  MAT.coin = new THREE.MeshToonMaterial({ map: TEX.coin, gradientMap: TOON_GRAD, emissive: 0x6a3a00, emissiveIntensity: 0.6 });
  MAT.lowBoard = new THREE.MeshToonMaterial({ map: TEX.lowBoard, gradientMap: TOON_GRAD });
  MAT.stripeYK = new THREE.MeshToonMaterial({ map: TEX.stripeYK, gradientMap: TOON_GRAD });
  MAT.duck = new THREE.MeshToonMaterial({ map: TEX.duckSign, gradientMap: TOON_GRAD });
  TEX.shemagh.repeat.set(3, 3); MAT.shemagh = new THREE.MeshToonMaterial({ map: TEX.shemagh, gradientMap: TOON_GRAD, side: THREE.DoubleSide });
  MAT.shadow = new THREE.MeshBasicMaterial({ map: TEX.shadow, transparent: true, depthWrite: false });
  MAT.glow = new THREE.SpriteMaterial({ map: TEX.glow, color: 0xffd36b, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
}
function remapUV(g, faces) {
  const uv = g.attributes.uv;
  for (let f = 0; f < 6; f++) {
    const [u0, u1, v0, v1] = faces[f];
    for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, u0 + uv.getX(i) * (u1 - u0), v0 + uv.getY(i) * (v1 - v0)); }
  }
  uv.needsUpdate = true; return g;
}
const GEO = {};
function roofDome(w, len, h, col, y, z) {
  const g = new THREE.CylinderGeometry(w / 2, w / 2, len, 14, 1, false, Math.PI / 2, Math.PI);
  g.rotateX(Math.PI / 2); g.scale(1, h / (w / 2), 1); g.translate(0, y, z);
  return tint(g, col);
}
/* metro car details: rounded corners, headlights, wipers, couplers, bogies, roof units, gangway */
function carDetailGeo(L, y0, top, lc, ld) {
  const u = [
    P.box(2.1, 0.45, L - 0.8, 0x34343f, { y: 0.24, z: -L / 2 }),
    roofDome(2.5, L - 0.1, 0.3, 0x9aa2b0, top, -L / 2),
    P.box(2.56, 0.1, L - 0.2, 0xd8dee6, { y: top - 0.02, z: -L / 2 }),
    P.box(0.06, 0.06, L - 0.3, 0x7d8592, { x: -1.24, y: top + 0.06, z: -L / 2 }), P.box(0.06, 0.06, L - 0.3, 0x7d8592, { x: 1.24, y: top + 0.06, z: -L / 2 })
  ];
  for (const z of [0, -L]) {
    const f = z === 0 ? 1 : -1;
    for (const x of [-1.25, 1.25]) u.push(P.cyl(0.13, 0.13, top - y0, 16, lc, { x: x * 0.97, y: (top + y0) / 2, z: z - f * 0.1 }));
    u.push(P.cyl(0.13, 0.13, 2.3, 16, lc, { y: top - 0.05, z: z - f * 0.1, rz: Math.PI / 2 }));
    for (const x of [-0.82, 0.82]) {
      u.push(P.cyl(0.19, 0.19, 0.08, 24, 0x2a2a33, { x, y: 1.02, z: z + f * 0.02, rx: Math.PI / 2 }));
      u.push(P.cyl(0.14, 0.14, 0.1, 24, f > 0 ? 0xfff6c2 : 0xff3b30, { x, y: 1.02, z: z + f * 0.04, rx: Math.PI / 2 }));
      u.push(P.tor(0.17, 0.02, 8, 24, TAU, 0xdfe4ea, { x, y: 1.02, z: z + f * 0.06 }));
    }
    u.push(P.box(0.04, 0.6, 0.03, 0x1b1b22, { x: -0.5, y: 2.05, z: z + f * 0.02, rz: 0.5 }), P.box(0.04, 0.6, 0.03, 0x1b1b22, { x: 0.55, y: 2.05, z: z + f * 0.02, rz: -0.5 }));
    u.push(P.box(2.3, 0.12, 0.08, ld, { y: 0.5, z: z + f * 0.03 }));
    u.push(P.cyl(0.11, 0.13, 0.4, 14, 0x2a2a33, { y: 0.48, z: z + f * 0.2, rx: Math.PI / 2 }), P.box(0.4, 0.25, 0.14, 0x3a3a44, { y: 0.48, z: z + f * 0.42 }));
  }
  for (let k = 0; k < 6; k++) u.push(P.box(1.8 - (k % 2) * 0.12, 2.3, 0.07, k % 2 ? 0x2a2a33 : 0x45454f, { y: 1.75, z: -L - 0.04 - k * 0.07 }));
  for (const zc of [-L * 0.27, -L * 0.73]) {
    u.push(P.box(1.3, 0.16, 2.0, 0x8e95a3, { y: top + 0.25, z: zc }), P.cyl(0.3, 0.3, 1.8, 24, 0xb3bac6, { y: top + 0.45, z: zc, rx: Math.PI / 2 }));
    for (let g = 0; g < 5; g++) u.push(P.box(1.0, 0.02, 0.06, 0x5d6370, { y: top + 0.76, z: zc - 0.6 + g * 0.3 }));
  }
  for (const zb of [-2.15, -L + 2.15]) {
    u.push(P.box(2.2, 0.3, 2.6, 0x41414d, { y: 0.42, z: zb }));
    for (const x of [-0.95, 0.95]) for (const dz of [-0.6, 0.6]) u.push(P.cyl(0.08, 0.08, 0.3, 10, 0xff9a1f, { x, y: 0.55, z: zb + dz }));
    for (const dz of [-0.75, 0.75]) {
      u.push(P.cyl(0.32, 0.32, 2.3, 24, 0x22222a, { y: 0.32, z: zb + dz, rz: Math.PI / 2 }));
      for (const x of [-1.16, 1.16]) u.push(P.cyl(0.2, 0.2, 0.04, 20, 0xc0c6cf, { x, y: 0.32, z: zb + dz, rz: Math.PI / 2 }), P.cyl(0.06, 0.06, 0.06, 10, 0x55555f, { x: x * 1.02, y: 0.32, z: zb + dz, rz: Math.PI / 2 }));
    }
  }
  return merge(u);
}
function buildSharedGeos() {
  const L = DIM.CAR_L, y0 = 0.45, top = 3.1;
  const SIDE = [0, 1, 0.5, 1], FRONT = [0, 0.25, 0, 0.5], ROOF = [0.25, 0.375, 0, 0.5];
  const body = new THREE.BoxGeometry(DIM.TRAIN_W, top - y0, L);
  remapUV(body, [SIDE, SIDE, ROOF, ROOF, FRONT, FRONT]);
  body.translate(0, y0 + (top - y0) / 2, -L / 2);
  GEO.carBody = body;
  GEO.carUnder = {};
  for (const LN of LINES) GEO.carUnder[LN.id] = carDetailGeo(L, y0, top, new THREE.Color(LN.c).getHex(), new THREE.Color(LN.dk).getHex());
  const ang = Math.atan2(DIM.ROOF, DIM.RAMP_L), hyp = Math.hypot(DIM.ROOF, DIM.RAMP_L);
  GEO.ramp = merge([
    P.box(2.4, 0.22, hyp, 0x9a6a3e, { y: DIM.ROOF / 2 - 0.08, z: -DIM.RAMP_L / 2, rx: ang }),
    ...[0.2, 0.35, 0.5, 0.65, 0.8].map((t) => P.box(2.42, 0.06, 0.3, 0x7a4e2a, { y: DIM.ROOF * t + 0.05, z: -DIM.RAMP_L * t, rx: ang })),
    P.box(0.16, 0.36, hyp, 0xffc21f, { x: -1.2, y: DIM.ROOF / 2 + 0.04, z: -DIM.RAMP_L / 2, rx: ang }),
    P.box(0.16, 0.36, hyp, 0xffc21f, { x: 1.2, y: DIM.ROOF / 2 + 0.04, z: -DIM.RAMP_L / 2, rx: ang }),
    P.box(0.22, DIM.ROOF * 0.5, 0.22, 0x6b4426, { x: -1.0, y: DIM.ROOF * 0.25, z: -DIM.RAMP_L * 0.5 }),
    P.box(0.22, DIM.ROOF * 0.5, 0.22, 0x6b4426, { x: 1.0, y: DIM.ROOF * 0.25, z: -DIM.RAMP_L * 0.5 }),
    P.box(0.22, DIM.ROOF - 0.1, 0.22, 0x6b4426, { x: -1.0, y: (DIM.ROOF - 0.1) / 2, z: -DIM.RAMP_L + 0.2 }),
    P.box(0.22, DIM.ROOF - 0.1, 0.22, 0x6b4426, { x: 1.0, y: (DIM.ROOF - 0.1) / 2, z: -DIM.RAMP_L + 0.2 })
  ]);
  const legs = [];
  for (const x of [-1.0, 1.0]) for (const dz of [0.14, -0.14]) legs.push(P.cyl(0.06, 0.07, 1.05, 12, 0x4a4a58, { x, y: 0.5, z: dz, rx: dz > 0 ? -0.2 : 0.2 }));
  for (const x of [-1.0, 1.0]) legs.push(P.box(0.18, 0.12, 0.8, 0x2e2e38, { x, y: 0.06 }), P.cyl(0.06, 0.06, 0.18, 12, 0x2e2e38, { x, y: 0.06, z: 0.4, rz: Math.PI / 2 }), P.cyl(0.06, 0.06, 0.18, 12, 0x2e2e38, { x, y: 0.06, z: -0.4, rz: Math.PI / 2 }));
  for (const x of [-0.95, 0.95]) legs.push(P.cyl(0.17, 0.19, 0.16, 24, 0x2b2b35, { x, y: 1.13, rx: Math.PI / 2 }), P.cyl(0.13, 0.13, 0.18, 24, 0xffd21f, { x, y: 1.13, rx: Math.PI / 2 }),
    P.sph(0.07, 0xfffbe0, { x: x - 0.03, y: 1.17, z: 0.1 }, 10, 8), P.tor(0.16, 0.025, 8, 24, TAU, 0x8a8f99, { x, y: 1.13, z: 0.08 }));
  GEO.lowFrame = merge(legs);
  GEO.lowBoard = new THREE.BoxGeometry(2.45, 0.6, 0.14); GEO.lowBoard.translate(0, 0.72, 0);
  const hf = [];
  for (const x of [-1.22, 1.22]) {
    for (let k = 0; k < 6; k++) hf.push(P.cyl(0.11, 0.11, 0.5, 16, k % 2 ? 0xffffff : 0xff3b30, { x, y: 0.25 + 0.5 * k + 0.05 }));
    hf.push(P.cyl(0.34, 0.38, 0.16, 24, 0x3a3a44, { x, y: 0.08 }), P.cyl(0.13, 0.13, 0.08, 16, 0x2b2b35, { x, y: 3.12 }),
      P.sph(0.19, 0xff3b30, { x, y: 3.28 }, 18, 14), P.cyl(0.21, 0.21, 0.05, 18, 0x2b2b35, { x, y: 3.47 }));
  }
  hf.push(P.box(0.08, 0.08, 0.3, 0x2b2b35, { x: -1.0, y: 1.9, z: -0.02 }), P.box(0.08, 0.08, 0.3, 0x2b2b35, { x: 1.0, y: 1.9, z: -0.02 }));
  GEO.highFrame = merge(hf);
  GEO.highSign = new THREE.BoxGeometry(2.3, 1.05, 0.14); GEO.highSign.translate(0, 1.9, 0);
  GEO.highBar = new THREE.BoxGeometry(2.7, 0.36, 0.2); GEO.highBar.translate(0, 2.65, 0);
  // coin: star faces toward the camera; rim mapped to the gold edge of the texture
  const coin = new THREE.CylinderGeometry(0.44, 0.44, 0.13, 36, 1);
  const cuv = coin.attributes.uv, nSide = 37 * 2;
  for (let i = 0; i < nSide; i++) cuv.setXY(i, 0.01, 0.5);
  coin.rotateX(Math.PI / 2);
  const rim = new THREE.TorusGeometry(0.445, 0.055, 10, 40);
  const ruv = rim.attributes.uv; for (let i = 0; i < ruv.count; i++) ruv.setXY(i, 0.01, 0.5);
  GEO.coin = merge([coin, rim]);
  GEO.shadow = new THREE.PlaneGeometry(1, 1); GEO.shadow.rotateX(-Math.PI / 2);
}
function makeCar(lineId) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(GEO.carBody, MAT.train[lineId]));
  g.add(new THREE.Mesh(GEO.carUnder[lineId], MAT.toon));
  return g;
}
function makeRamp() { return new THREE.Mesh(GEO.ramp, MAT.toon); }
function makeBarrier(type) {
  const g = new THREE.Group();
  if (type === 'low') { g.add(new THREE.Mesh(GEO.lowFrame, MAT.toon)); g.add(new THREE.Mesh(GEO.lowBoard, MAT.lowBoard)); }
  else { g.add(new THREE.Mesh(GEO.highFrame, MAT.toon)); g.add(new THREE.Mesh(GEO.highSign, MAT.duck)); g.add(new THREE.Mesh(GEO.highBar, MAT.stripeYK)); }
  return g;
}

/* pickups */
function makePickupMesh(type) {
  const g = new THREE.Group();
  const inner = new THREE.Group(); g.add(inner);
  let parts = [];
  if (type === 'magnet') {
    parts = [P.tor(0.42, 0.15, 8, 16, Math.PI, 0xff2d2d, { rz: Math.PI }), P.box(0.3, 0.32, 0.3, 0xff2d2d, { x: -0.42, y: 0.12 }), P.box(0.3, 0.32, 0.3, 0xff2d2d, { x: 0.42, y: 0.12 }),
      P.box(0.31, 0.18, 0.31, 0xeef2f6, { x: -0.42, y: 0.36 }), P.box(0.31, 0.18, 0.31, 0xeef2f6, { x: 0.42, y: 0.36 })];
  } else if (type === 'sneakers') {
    parts = [P.box(0.42, 0.14, 0.86, 0xffffff, { y: -0.2 }), P.box(0.4, 0.32, 0.6, 0x3cc45a, { y: 0.02, z: 0.1 }), P.box(0.4, 0.22, 0.32, 0x3cc45a, { y: -0.04, z: -0.26 }),
      P.box(0.42, 0.07, 0.3, 0xffd21f, { y: 0.2, z: 0.2 }), P.tor(0.15, 0.045, 6, 12, TAU, 0xc0c6cf, { y: -0.36, rx: Math.PI / 2 }), P.tor(0.15, 0.045, 6, 12, TAU, 0xc0c6cf, { y: -0.47, rx: Math.PI / 2 })];
  } else if (type === 'jetpack') {
    parts = [P.cyl(0.2, 0.2, 0.84, 12, 0xff9a1f, { x: -0.22 }), P.cyl(0.2, 0.2, 0.84, 12, 0xff9a1f, { x: 0.22 }), P.sph(0.2, 0xff9a1f, { x: -0.22, y: 0.42 }), P.sph(0.2, 0xff9a1f, { x: 0.22, y: 0.42 }),
      P.cone(0.15, 0.24, 10, 0x55555f, { x: -0.22, y: -0.53, rx: Math.PI }), P.cone(0.15, 0.24, 10, 0x55555f, { x: 0.22, y: -0.53, rx: Math.PI }), P.box(0.54, 0.54, 0.14, 0xc0c6cf, { z: 0.16 })];
  }
  if (type === 'x2') {
    const tex = canvasTex(128, 128, (c) => {
      c.fillStyle = '#a35ce0'; c.beginPath(); c.arc(64, 64, 58, 0, TAU); c.fill(); c.lineWidth = 9; c.strokeStyle = '#fff'; c.stroke();
      textBlock(c, '2X', 64, 68, `62px ${EN_FONT}`, '#ffd21f', 'center', '#26203a', 10);
    }, false);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true })); sp.scale.set(1.3, 1.3, 1); inner.add(sp);
  } else inner.add(new THREE.Mesh(merge(parts), MAT.toon));
  const halo = new THREE.Sprite(MAT.glow); halo.scale.set(2.6, 2.6, 1); halo.position.z = 0.3; g.add(halo);
  g.userData.inner = inner;
  return g;
}
