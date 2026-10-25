/* ---------- characters: the runner in a thobe, the Saudi police officer, his falcon ---------- */
const limb = (r0, r1, len, col, seg = 20) => [P.cyl(r1, r0, len, seg, col, { y: -len / 2 }), P.sph(r0, col, { y: 0 }, seg, 14), P.sph(r1, col, { y: -len }, seg, 14)];
const lathe = (pts, col, t, seg = 36) => { if (pts[0][1] > pts[pts.length - 1][1]) pts = pts.slice().reverse(); return P.geo(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg), col, t); };
function handParts(r, skin, side, y, glove) {
  const c = glove || skin, p = [P.sph(r * 1.0, c, { y: y - 0.06, sx: 0.85, sz: 0.62 }, 18, 14)];
  for (let i = 0; i < 4; i++) {
    const fx = (i - 1.5) * r * 0.42;
    p.push(P.cyl(r * 0.2, r * 0.22, r * 0.8, 10, c, { x: fx, y: y - 0.06 - r * 1.05, z: -r * 0.12, rx: 0.45 }), P.sph(r * 0.21, c, { x: fx, y: y - 0.06 - r * 1.42, z: -r * 0.32 }, 10, 8));
  }
  p.push(P.cyl(r * 0.22, r * 0.25, r * 0.7, 10, c, { x: -side * r * 0.75, y: y - 0.08, z: -r * 0.35, rz: side * 0.7, rx: 0.4 }));
  return p;
}
function eyeParts(x, y, z, iris, s = 1) {
  return [
    P.sph(0.07 * s, 0xffffff, { x, y, z, sz: 0.55 }, 20, 16),
    P.sph(0.042 * s, iris, { x, y: y - 0.004, z: z - 0.03 * s, sz: 0.5 }, 16, 12),
    P.sph(0.024 * s, 0x0a0606, { x, y: y - 0.004, z: z - 0.042 * s, sz: 0.5 }, 12, 10),
    P.sph(0.011 * s, 0xffffff, { x: x + 0.014, y: y + 0.016, z: z - 0.05 * s }, 8, 6)
  ];
}
function buildRig(o) {
  const M = MAT.toon;
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const hips = new THREE.Group(); hips.position.y = o.hipY; body.add(hips);
  hips.add(new THREE.Mesh(merge(o.hipParts), M));
  const torso = new THREE.Group(); torso.position.y = 0.1; hips.add(torso);
  torso.add(new THREE.Mesh(merge(o.torsoParts), M));
  const head = new THREE.Group(); head.position.y = o.neckY; torso.add(head);
  head.add(new THREE.Mesh(merge(o.headParts), M));
  const arm = (side) => {
    const sh = new THREE.Group(); sh.position.set(side * o.shX, o.shY, 0); torso.add(sh);
    sh.add(new THREE.Mesh(merge(limb(o.armR, o.armR * 0.9, o.upLen, o.sleeve)), M));
    const el = new THREE.Group(); el.position.y = -o.upLen; sh.add(el);
    el.add(new THREE.Mesh(merge([...limb(o.armR * 0.9, o.armR * 0.82, o.loLen, o.lowerArm),
      P.tor(o.armR * 0.85, o.armR * 0.16, 8, 24, TAU, o.cuff || o.lowerArm, { y: -o.loLen + 0.02, rx: Math.PI / 2 }),
      ...handParts(o.armR * 0.95, o.skin, side, -o.loLen - 0.02)]), M));
    return { sh, el };
  };
  const leg = (side) => {
    const hp = new THREE.Group(); hp.position.set(side * o.legX, -0.04, 0); hips.add(hp);
    hp.add(new THREE.Mesh(merge(limb(o.legR, o.legR * 0.92, o.thLen, o.pants)), M));
    const kn = new THREE.Group(); kn.position.y = -o.thLen; hp.add(kn);
    kn.add(new THREE.Mesh(merge([...limb(o.legR * 0.92, o.legR * 0.82, o.shLen, o.pantsLow), ...o.foot(-o.shLen)]), M));
    return { hp, kn };
  };
  return { root, body, hips, torso, head, aL: arm(-1), aR: arm(1), lL: leg(-1), lR: leg(1), o };
}

function makeRunner() {
  const skin = 0xd29a6a, white = 0xfbfbf7, shade = 0xdde1e7, sandal = 0x6e3b1d, strap = 0x8f5129;
  const rig = buildRig({
    hipY: 1.0, pants: white, pantsLow: white, skin, sleeve: white, lowerArm: white, cuff: 0xeef0f3,
    legX: 0.12, legR: 0.105, thLen: 0.44, shLen: 0.44,
    shX: 0.33, shY: 0.52, armR: 0.085, upLen: 0.3, loLen: 0.27, neckY: 0.62,
    foot: (y) => [
      lathe([[0.0, -0.02], [0.1, -0.02], [0.11, 0.06], [0.0, 0.07]], white, { y: y + 0.0, sz: 0.85 }),
      P.sph(0.085, skin, { y: y - 0.05, z: -0.06, sx: 1.05, sy: 0.55, sz: 1.9 }, 20, 14),
      ...[-0.045, -0.015, 0.015, 0.045].map((tx, i) => P.sph(0.022, skin, { x: tx, y: y - 0.065, z: -0.21 + Math.abs(i - 1.5) * 0.012 }, 8, 6)),
      P.cyl(0.13, 0.13, 0.045, 28, sandal, { y: y - 0.1, z: -0.07, sz: 1.8, sx: 0.85 }),
      P.cyl(0.125, 0.125, 0.02, 28, 0x4a2610, { y: y - 0.125, z: -0.07, sz: 1.8, sx: 0.85 }),
      P.tor(0.085, 0.024, 8, 20, Math.PI, strap, { y: y - 0.08, z: -0.12, sx: 1.12 }),
      P.tor(0.085, 0.024, 8, 20, Math.PI, strap, { y: y - 0.08, z: 0.0, sx: 1.12 }),
      P.tor(0.03, 0.01, 6, 12, TAU, 0xc89b5a, { y: y - 0.05, z: -0.12 })
    ],
    hipParts: [
      lathe([[0, 0.12], [0.27, 0.12], [0.29, 0.02], [0.32, -0.2], [0.355, -0.44], [0.38, -0.56], [0.0, -0.56]], white, { sz: 0.78 }),
      P.box(0.012, 0.6, 0.012, shade, { x: 0.3, y: -0.24, rz: -0.08 }), P.box(0.012, 0.6, 0.012, shade, { x: -0.3, y: -0.24, rz: 0.08 })
    ],
    torsoParts: [
      lathe([[0, 0], [0.28, 0], [0.3, 0.2], [0.32, 0.44], [0.29, 0.56], [0.16, 0.65], [0.11, 0.72], [0, 0.72]], white, { sz: 0.7 }),
      P.box(0.04, 0.32, 0.015, shade, { y: 0.48, z: -0.222 }),
      ...[0.6, 0.53, 0.46, 0.39].map((y) => P.sph(0.014, 0xbfc4cc, { y, z: -0.232 }, 8, 6)),
      P.cyl(0.118, 0.12, 0.07, 28, white, { y: 0.73 }), P.tor(0.118, 0.012, 6, 28, TAU, shade, { y: 0.765, rx: Math.PI / 2 }),
      P.box(0.12, 0.11, 0.015, shade, { x: -0.15, y: 0.44, z: -0.214 }), P.box(0.12, 0.015, 0.02, 0xc9ccd2, { x: -0.15, y: 0.495, z: -0.218 })
    ],
    headParts: [
      P.cyl(0.08, 0.09, 0.14, 20, skin, { y: 0.02 }),
      P.sph(0.27, skin, { y: 0.23, sy: 1.04 }, 40, 30),
      P.sph(0.062, skin, { x: -0.27, y: 0.22, sx: 0.55 }, 14, 10), P.sph(0.062, skin, { x: 0.27, y: 0.22, sx: 0.55 }, 14, 10),
      P.sph(0.035, 0xb8794f, { x: -0.285, y: 0.22, sx: 0.4 }, 10, 8), P.sph(0.035, 0xb8794f, { x: 0.285, y: 0.22, sx: 0.4 }, 10, 8),
      ...eyeParts(-0.095, 0.26, -0.215, 0x5a3a22), ...eyeParts(0.095, 0.26, -0.215, 0x5a3a22),
      P.tor(0.06, 0.012, 6, 16, Math.PI * 0.8, 0x2a1a12, { x: -0.098, y: 0.315, z: -0.24, rz: 0.3 }), P.tor(0.06, 0.012, 6, 16, Math.PI * 0.8, 0x2a1a12, { x: 0.098, y: 0.315, z: -0.24, rz: 0.3 }),
      P.sph(0.042, 0xc58a5c, { y: 0.2, z: -0.265, sy: 1.15, sz: 0.9 }, 14, 12),
      P.tor(0.058, 0.013, 8, 18, Math.PI, 0x8a3a2a, { y: 0.14, z: -0.245, rz: Math.PI }),
      P.sph(0.05, 0xe8a07a, { x: -0.16, y: 0.18, z: -0.2, sz: 0.4 }, 10, 8), P.sph(0.05, 0xe8a07a, { x: 0.16, y: 0.18, z: -0.2, sz: 0.4 }, 10, 8)
    ]
  });
  // shemagh: crown, folded brim over the forehead, drape down the back and shoulders; double igal with cords
  const sh = merge([
    P.geo(new THREE.SphereGeometry(0.292, 40, 20, 0, TAU, 0, Math.PI * 0.5), 0xffffff, { y: 0.26, sy: 1.06 }),
    P.geo(new THREE.CylinderGeometry(0.297, 0.33, 0.46, 40, 3, true, -Math.PI * 0.6, Math.PI * 1.2), 0xffffff, { y: 0.04 }),
    P.geo(new THREE.TorusGeometry(0.29, 0.03, 8, 40, Math.PI * 1.3), 0xffffff, { y: 0.34, rx: Math.PI / 2, rz: -Math.PI * 0.15 + Math.PI }),
    P.geo(new THREE.CylinderGeometry(0.31, 0.36, 0.2, 40, 1, true, -Math.PI * 0.75, Math.PI * 1.5), 0xffffff, { y: -0.24 })
  ]);
  rig.head.add(new THREE.Mesh(sh, MAT.shemagh));
  rig.head.add(new THREE.Mesh(merge([
    P.tor(0.228, 0.032, 14, 48, TAU, 0x141418, { y: 0.43, rx: Math.PI / 2 }), P.tor(0.228, 0.032, 14, 48, TAU, 0x141418, { y: 0.485, rx: Math.PI / 2 }),
    P.cyl(0.012, 0.012, 0.4, 8, 0x141418, { x: -0.04, y: 0.25, z: 0.25, rx: 0.15 }), P.cyl(0.012, 0.012, 0.4, 8, 0x141418, { x: 0.04, y: 0.25, z: 0.25, rx: 0.15 }),
    P.sph(0.03, 0x141418, { x: -0.04, y: 0.05, z: 0.28 }, 10, 8), P.sph(0.03, 0x141418, { x: 0.04, y: 0.05, z: 0.28 }, 10, 8)
  ]), MAT.toon));
  const tails = new THREE.Group(); tails.position.set(0, -0.3, 0.3); rig.head.add(tails);
  const tailGeo = new THREE.PlaneGeometry(0.42, 0.24, 4, 6); tailGeo.translate(0, -0.12, 0);
  const t1 = new THREE.Mesh(tailGeo, MAT.shemagh); tails.add(t1); rig.tails = [t1];
  // jetpack
  const jp = new THREE.Group();
  jp.add(new THREE.Mesh(merge([
    P.cyl(0.14, 0.14, 0.62, 24, 0xff9a1f, { x: -0.15 }), P.cyl(0.14, 0.14, 0.62, 24, 0xff9a1f, { x: 0.15 }),
    P.sph(0.14, 0xff9a1f, { x: -0.15, y: 0.31 }, 24, 14), P.sph(0.14, 0xff9a1f, { x: 0.15, y: 0.31 }, 24, 14),
    P.tor(0.142, 0.02, 6, 24, TAU, 0xffffff, { x: -0.15, y: 0.1, rx: Math.PI / 2 }), P.tor(0.142, 0.02, 6, 24, TAU, 0xffffff, { x: 0.15, y: 0.1, rx: Math.PI / 2 }),
    P.cone(0.11, 0.17, 20, 0x55555f, { x: -0.15, y: -0.38, rx: Math.PI }), P.cone(0.11, 0.17, 20, 0x55555f, { x: 0.15, y: -0.38, rx: Math.PI })
  ]), MAT.toon));
  const flames = [];
  for (const fx of [-0.15, 0.15]) {
    const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0xff8a1e, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    f.position.set(fx, -0.62, 0); f.scale.set(0.5, 0.9, 1); jp.add(f); flames.push(f);
  }
  jp.position.set(0, 0.32, 0.27); jp.visible = false; rig.torso.add(jp);
  rig.jetpack = jp; rig.flames = flames;
  rig.springs = [];
  for (const L of [rig.lL, rig.lR]) {
    const s = new THREE.Mesh(merge([0, 1, 2].map((k) => P.tor(0.1, 0.028, 10, 20, TAU, 0xc0c6cf, { y: -0.6 - k * 0.05, rx: Math.PI / 2 }))), MAT.toon);
    s.visible = false; L.kn.add(s); rig.springs.push(s);
  }
  const shd = new THREE.Mesh(GEO.shadow, MAT.shadow); shd.scale.set(1.2, 1, 1.4); shd.renderOrder = 1; rig.shadow = shd;
  rig.body.scale.setScalar(1.15);
  return rig;
}

function makeGuard() {
  // Saudi police: khaki uniform, black beret with gold badge, sunglasses, black duty belt, green rank slides
  const skin = 0xb37c52, khaki = 0xc8b27f, khakiDk = 0xa6905c, beret = 0x1b1b20, gold = 0xe0b84a, blk = 0x141418;
  const rig = buildRig({
    hipY: 1.02, pants: khakiDk, pantsLow: khakiDk, skin, sleeve: khaki, lowerArm: khaki, cuff: khakiDk,
    legX: 0.15, legR: 0.12, thLen: 0.44, shLen: 0.44,
    shX: 0.42, shY: 0.54, armR: 0.1, upLen: 0.32, loLen: 0.3, neckY: 0.66,
    foot: (y) => [
      lathe([[0, -0.02], [0.12, -0.02], [0.125, 0.1], [0, 0.11]], blk, { y: y - 0.02 }),
      P.sph(0.12, blk, { y: y - 0.06, z: -0.08, sx: 1.0, sy: 0.65, sz: 1.75 }, 20, 14),
      P.cyl(0.13, 0.13, 0.05, 28, 0x070709, { y: y - 0.12, z: -0.07, sz: 1.65 }),
      ...[0, 1, 2].map((k) => P.box(0.1, 0.012, 0.012, 0x3a3a44, { y: y + 0.0 - k * 0.025, z: -0.17 + k * 0.035 }))
    ],
    hipParts: [
      lathe([[0, 0.12], [0.33, 0.12], [0.34, 0.0], [0.3, -0.12], [0, -0.12]], khakiDk, { sz: 0.8 }),
      P.cyl(0.345, 0.345, 0.1, 40, blk, { y: 0.13, sz: 0.82 }),
      P.box(0.11, 0.08, 0.03, gold, { y: 0.13, z: -0.29 }), P.box(0.06, 0.04, 0.035, blk, { y: 0.13, z: -0.3 }),
      P.box(0.13, 0.24, 0.16, blk, { x: 0.33, y: -0.02, z: 0.03 }), P.box(0.14, 0.06, 0.17, 0x22222a, { x: 0.33, y: 0.09, z: 0.03 }),
      P.box(0.1, 0.12, 0.08, blk, { x: -0.3, y: 0.06, z: 0.12 }), P.box(0.09, 0.1, 0.06, blk, { x: 0.12, y: 0.06, z: 0.28 })
    ],
    torsoParts: [
      lathe([[0, 0], [0.33, 0], [0.37, 0.22], [0.37, 0.46], [0.33, 0.58], [0.16, 0.68], [0.12, 0.74], [0, 0.74]], khaki, { sz: 0.78 }),
      P.sph(0.3, khaki, { y: 0.16, z: -0.1, sz: 0.85 }, 28, 20),
      P.box(0.035, 0.5, 0.02, khakiDk, { y: 0.35, z: -0.29 }),
      ...[0.58, 0.48, 0.38, 0.28, 0.18].map((y) => P.sph(0.016, 0x8a7646, { y, z: -0.3 }, 8, 6)),
      P.box(0.15, 0.13, 0.025, khakiDk, { x: -0.17, y: 0.44, z: -0.272 }), P.box(0.15, 0.13, 0.025, khakiDk, { x: 0.17, y: 0.44, z: -0.272 }),
      P.box(0.155, 0.05, 0.03, khaki, { x: -0.17, y: 0.5, z: -0.278 }), P.box(0.155, 0.05, 0.03, khaki, { x: 0.17, y: 0.5, z: -0.278 }),
      P.sph(0.013, 0x8a7646, { x: -0.17, y: 0.49, z: -0.296 }, 6, 4), P.sph(0.013, 0x8a7646, { x: 0.17, y: 0.49, z: -0.296 }, 6, 4),
      P.box(0.13, 0.035, 0.02, blk, { x: 0.18, y: 0.56, z: -0.285 }), P.box(0.1, 0.06, 0.02, gold, { x: -0.18, y: 0.57, z: -0.285 }),
      P.box(0.12, 0.04, 0.22, 0x1f7a3c, { x: -0.31, y: 0.63 }), P.box(0.12, 0.04, 0.22, 0x1f7a3c, { x: 0.31, y: 0.63 }),
      ...[-0.31, 0.31].flatMap((x) => [P.sph(0.022, gold, { x, y: 0.66, z: -0.05, sy: 0.5 }, 8, 6), P.sph(0.022, gold, { x, y: 0.66, z: 0.04, sy: 0.5 }, 8, 6)]),
      P.cone(0.07, 0.12, 4, khaki, { x: -0.07, y: 0.68, z: -0.15, rx: -2.4, ry: 0.4 }), P.cone(0.07, 0.12, 4, khaki, { x: 0.07, y: 0.68, z: -0.15, rx: -2.4, ry: -0.4 }),
      P.tor(0.13, 0.035, 10, 28, TAU, khaki, { y: 0.72, rx: Math.PI / 2 }),
      P.box(0.07, 0.13, 0.05, blk, { x: -0.25, y: 0.6, z: -0.2 }), P.cyl(0.008, 0.008, 0.1, 6, blk, { x: -0.23, y: 0.71, z: -0.2 })
    ],
    headParts: [
      P.cyl(0.1, 0.11, 0.14, 20, skin, { y: 0.02 }),
      P.sph(0.28, skin, { y: 0.23 }, 40, 30),
      P.sph(0.062, skin, { x: -0.28, y: 0.22, sx: 0.55 }, 14, 10), P.sph(0.062, skin, { x: 0.28, y: 0.22, sx: 0.55 }, 14, 10),
      P.box(0.46, 0.035, 0.035, 0x0b0b0e, { y: 0.29, z: -0.25 }),
      P.sph(0.078, 0x101622, { x: -0.1, y: 0.255, z: -0.25, sz: 0.45 }, 18, 14), P.sph(0.078, 0x101622, { x: 0.1, y: 0.255, z: -0.25, sz: 0.45 }, 18, 14),
      P.sph(0.02, 0x8fb4d8, { x: -0.12, y: 0.28, z: -0.285 }, 8, 6), P.sph(0.02, 0x8fb4d8, { x: 0.08, y: 0.28, z: -0.285 }, 8, 6),
      P.box(0.02, 0.02, 0.3, 0x0b0b0e, { x: -0.27, y: 0.27, z: -0.1 }), P.box(0.02, 0.02, 0.3, 0x0b0b0e, { x: 0.27, y: 0.27, z: -0.1 }),
      P.sph(0.05, 0xa66d45, { y: 0.19, z: -0.28, sy: 1.2 }, 14, 12),
      P.tor(0.08, 0.025, 8, 18, Math.PI, 0x1a1210, { y: 0.15, z: -0.255, rz: Math.PI }),
      P.sph(0.2, 0x1a1210, { y: 0.06, z: -0.1, sy: 0.6, sz: 0.85 }, 24, 16),
      P.sph(0.3, beret, { x: 0.05, y: 0.44, sy: 0.36, rz: -0.25 }, 36, 18),
      P.tor(0.27, 0.035, 12, 40, TAU, beret, { y: 0.4, rx: Math.PI / 2 }),
      P.cyl(0.06, 0.06, 0.02, 20, gold, { x: -0.15, y: 0.47, z: -0.23, rx: Math.PI / 2 - 0.3 }), P.sph(0.03, 0x1f7a3c, { x: -0.15, y: 0.47, z: -0.245, sz: 0.4 }, 8, 6)
    ]
  });
  const sh = new THREE.Mesh(GEO.shadow, MAT.shadow); sh.scale.set(1.6, 1, 1.8); sh.renderOrder = 1; rig.shadow = sh;
  rig.body.scale.setScalar(1.08);
  return rig;
}

/* saker falcon: layered feathers, jointed wings, fanned tail */
function makeFalcon() {
  const g = new THREE.Group();
  const brown = 0x8a5a33, dark = 0x5a3820, cream = 0xf1e4c8, yel = 0xffc21f;
  const body = [
    lathe([[0.0, -0.75], [0.12, -0.6], [0.26, -0.25], [0.3, 0.05], [0.24, 0.3], [0.14, 0.45], [0.0, 0.5]], brown, { rx: -Math.PI / 2, sx: 1, sy: 0.85 }, 28),
    P.sph(0.24, cream, { y: -0.06, z: -0.1, sx: 0.95, sy: 0.75, sz: 1.2 }, 24, 16),
    P.sph(0.2, brown, { y: 0.12, z: -0.52 }, 28, 20), P.sph(0.17, cream, { y: 0.05, z: -0.6 }, 20, 14),
    P.sph(0.05, 0x111111, { x: -0.11, y: 0.17, z: -0.63 }, 12, 10), P.sph(0.05, 0x111111, { x: 0.11, y: 0.17, z: -0.63 }, 12, 10),
    P.tor(0.05, 0.012, 6, 14, TAU, yel, { x: -0.115, y: 0.17, z: -0.63, ry: Math.PI / 2 }), P.tor(0.05, 0.012, 6, 14, TAU, yel, { x: 0.115, y: 0.17, z: -0.63, ry: Math.PI / 2 }),
    P.sph(0.05, yel, { y: 0.12, z: -0.7 }, 12, 10),
    P.cone(0.055, 0.16, 12, 0x3a3a40, { y: 0.07, z: -0.78, rx: -Math.PI / 2 - 0.5 }),
    P.box(0.04, 0.12, 0.04, yel, { x: -0.08, y: -0.24, z: 0.05, rx: 0.6 }), P.box(0.04, 0.12, 0.04, yel, { x: 0.08, y: -0.24, z: 0.05, rx: 0.6 })
  ];
  for (let i = 0; i < 7; i++) {
    const a = (i - 3) * 0.16;
    const f = new THREE.BoxGeometry(0.11, 0.025, 0.55); f.translate(0, 0, 0.27);
    xf(f, { rx: 0.08, ry: a }); xf(f, { y: 0.0, z: 0.42 });
    body.push(tint(f, i % 2 ? brown : dark));
  }
  for (let i = 0; i < 18; i++) body.push(P.sph(0.022, dark, { x: (i % 6 - 2.5) * 0.06, y: -0.12 - Math.floor(i / 6) * 0.04, z: -0.22 + Math.floor(i / 6) * 0.12, sz: 0.4 }, 6, 4));
  g.add(new THREE.Mesh(merge(body), MAT.toon));
  const wing = (side) => {
    const inner = new THREE.Group(); inner.position.set(side * 0.2, 0.1, -0.08); g.add(inner);
    const ip = [P.box(0.6, 0.06, 0.48, brown, { x: side * 0.3 })];
    for (let k = 0; k < 5; k++) ip.push(P.box(0.13, 0.025, 0.42, k % 2 ? dark : brown, { x: side * (0.08 + k * 0.12), y: -0.03, z: 0.3, rx: 0.05 }));
    inner.add(new THREE.Mesh(merge(ip), MAT.toon));
    const outer = new THREE.Group(); outer.position.x = side * 0.6; inner.add(outer);
    const op = [P.box(0.5, 0.05, 0.4, brown, { x: side * 0.25 })];
    for (let k = 0; k < 6; k++) {
      const f = new THREE.BoxGeometry(0.1, 0.022, 0.58); f.translate(0, 0, 0.26);
      xf(f, { ry: side * (0.35 + k * 0.14) }); xf(f, { x: side * (0.3 + k * 0.05), y: -0.02, z: 0.0 });
      op.push(tint(f, k % 2 ? dark : 0x6b4426));
    }
    outer.add(new THREE.Mesh(merge(op), MAT.toon));
    return { inner, outer };
  };
  const L = wing(-1), R = wing(1);
  g.userData.wL = L.inner; g.userData.wR = R.inner; g.userData.wL2 = L.outer; g.userData.wR2 = R.outer;
  return g;
}

function poseRig(r, phase, mode, t, k = 1) {
  const s = Math.sin(phase), c = Math.cos(phase);
  const set = (o, x, y, z) => { o.rotation.set(x || 0, y || 0, z || 0); };
  r.body.position.set(0, 0, 0); r.body.rotation.set(0, 0, 0);
  if (mode === 'run') {
    set(r.lL.hp, s * 0.95 * k); set(r.lR.hp, -s * 0.95 * k);
    set(r.lL.kn, -Math.max(0, -c) * 1.4 * k - 0.15); set(r.lR.kn, -Math.max(0, c) * 1.4 * k - 0.15);
    set(r.aL.sh, -s * 1.0 * k, 0, -0.15); set(r.aR.sh, s * 1.0 * k, 0, 0.15);
    set(r.aL.el, 1.2); set(r.aR.el, 1.2);
    r.hips.position.y = r.o.hipY + Math.abs(c) * 0.08;
    set(r.torso, 0.2 + Math.abs(s) * 0.05, s * 0.12);
    set(r.head, -0.12);
  } else if (mode === 'jump') {
    set(r.lL.hp, 1.2); set(r.lR.hp, 0.25); set(r.lL.kn, -1.7); set(r.lR.kn, -0.8);
    set(r.aL.sh, 2.7, 0, -0.35); set(r.aR.sh, -0.6, 0, 0.6); set(r.aL.el, 0.3); set(r.aR.el, 1.1);
    r.hips.position.y = r.o.hipY; set(r.torso, 0.1); set(r.head, 0.1);
  } else if (mode === 'roll') {
    set(r.lL.hp, 2.0); set(r.lR.hp, 2.0); set(r.lL.kn, -2.4); set(r.lR.kn, -2.4);
    set(r.aL.sh, 1.6, 0, -0.2); set(r.aR.sh, 1.6, 0, 0.2); set(r.aL.el, 1.6); set(r.aR.el, 1.6);
    set(r.torso, 0.9); set(r.head, 0.4);
    r.body.position.y = 0.55; r.hips.position.y = 0.02; r.body.rotation.x = -t * TAU * 1.6;
  } else if (mode === 'fly') {
    set(r.lL.hp, 0.3 + s * 0.15); set(r.lR.hp, 0.2 - s * 0.15); set(r.lL.kn, -0.5); set(r.lR.kn, -0.6);
    set(r.aL.sh, -0.3, 0, -0.6); set(r.aR.sh, -0.3, 0, 0.6); set(r.aL.el, 0.6); set(r.aR.el, 0.6);
    r.hips.position.y = r.o.hipY; set(r.torso, 0.35); set(r.head, -0.3);
  } else if (mode === 'fall') {
    set(r.lL.hp, -0.4); set(r.lR.hp, 0.3); set(r.lL.kn, -0.3); set(r.lR.kn, -0.6);
    set(r.aL.sh, -2.4, 0, -0.6); set(r.aR.sh, -2.2, 0, 0.6); set(r.aL.el, 0.2); set(r.aR.el, 0.2);
    r.hips.position.y = r.o.hipY; set(r.torso, -0.4); set(r.head, -0.3);
  } else if (mode === 'dance') {
    const b = Math.sin(t * 7), b2 = Math.sin(t * 3.5);
    set(r.lL.hp, 0.1 + Math.max(0, b) * 0.5); set(r.lR.hp, 0.1 + Math.max(0, -b) * 0.5); set(r.lL.kn, -Math.max(0, b) * 0.8); set(r.lR.kn, -Math.max(0, -b) * 0.8);
    set(r.aL.sh, 0.3 + b * 0.6, 0, -0.5 - b2 * 0.4); set(r.aR.sh, 0.3 - b * 0.6, 0, 0.5 - b2 * 0.4); set(r.aL.el, 1.2); set(r.aR.el, 1.2);
    r.hips.position.y = r.o.hipY + Math.abs(b) * 0.06; set(r.torso, 0.05, b2 * 0.3, b * 0.08); set(r.head, 0, b2 * 0.3, -b * 0.1);
  } else {
    const b = Math.sin(t * 2.2);
    set(r.lL.hp, 0.05); set(r.lR.hp, -0.05); set(r.lL.kn, -0.05); set(r.lR.kn, -0.05);
    set(r.aL.sh, 0.1, 0, -0.15 - b * 0.04); set(r.aR.sh, 0.1, 0, 0.15 + b * 0.04); set(r.aL.el, 0.3); set(r.aR.el, 0.3);
    r.hips.position.y = r.o.hipY + b * 0.015; set(r.torso, 0.02 + b * 0.02); set(r.head, 0, Math.sin(t * 0.7) * 0.3);
  }
}
function flapTails(r, t, speed) {
  if (!r.tails) return;
  const a = 0.4 + Math.min(1, speed / 25) * 0.7;
  r.tails[0].rotation.set(-a + Math.sin(t * 17) * 0.2, 0, Math.sin(t * 11) * 0.15);
}
