/* ---------- obstacles, coins, pickups and the pattern generator ---------- */
const OBJ = { trains: [], ramps: [], barriers: [], pickups: [] };
const POOL = { cars: {}, ramps: [], low: [], high: [], pickups: {} };
const LX = (l) => (l - 1) * DIM.LANE;
const trainLen = (n) => n * DIM.CAR_L + (n - 1) * DIM.CAR_GAP;

function acquireCar(line) {
  const p = POOL.cars[line] || (POOL.cars[line] = []);
  const c = p.pop() || (() => { const m = makeCar(line); castAll(m); scene.add(m); return m; })();
  c.visible = true; return c;
}
function releaseCar(line, c) { c.visible = false; POOL.cars[line].push(c); }
function acquire(list, make) { const m = list.pop() || (() => { const x = make(); castAll(x); scene.add(x); return x; })(); m.visible = true; return m; }

/* coins: one instanced mesh */
const COINS = { mesh: null, cap: 700, list: [], free: [], spin: 0 };
const _cm = new THREE.Matrix4(), _cq = new THREE.Quaternion(), _cp = new THREE.Vector3(), _cs = new THREE.Vector3(1, 1, 1), _up = new THREE.Vector3(0, 1, 0);
function initCoins() {
  COINS.mesh = new THREE.InstancedMesh(GEO.coin, MAT.coin, COINS.cap);
  COINS.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  COINS.mesh.frustumCulled = false; COINS.mesh.castShadow = true;
  scene.add(COINS.mesh);
  for (let i = 0; i < COINS.cap; i++) COINS.list.push({ i, alive: false, x: 0, y: 0, s: 0, pull: false });
  clearCoins();
}
function clearCoins() {
  COINS.free = [];
  for (const c of COINS.list) { c.alive = false; COINS.free.push(c); }
  COINS.mesh.count = 0;
}
function addCoin(x, y, s) {
  const c = COINS.free.pop(); if (!c) return;
  c.alive = true; c.x = x; c.y = y; c.s = s; c.pull = false;
}

/* sparkles when coins are collected */
const SPARK = [];
function initSparks() {
  for (let i = 0; i < 14; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0xffe066, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    sp.visible = false; scene.add(sp); SPARK.push({ sp, t: 1 });
  }
}
function spark(x, y, z, col) {
  const k = SPARK.find((p) => p.t >= 1) || SPARK[0];
  k.t = 0; k.sp.position.set(x, y, z); k.sp.visible = true; k.sp.material.color.set(col || 0xffe066);
}
function updateSparks(dt) {
  for (const k of SPARK) { if (k.t >= 1) continue; k.t += dt * 3.2; const s = 0.5 + k.t * 2.2; k.sp.scale.set(s, s, 1); k.sp.material.opacity = 1 - k.t; if (k.t >= 1) k.sp.visible = false; }
}

/* object spawners */
function addTrain(lane, s, nCars, opts = {}) {
  const line = opts.line || pick(LINES).id;
  const len = trainLen(nCars);
  const cars = [];
  for (let i = 0; i < nCars; i++) cars.push(acquireCar(line));
  const t = { lane, s, len, cars, line, v: opts.v || 0, horn: false };
  placeTrain(t);
  OBJ.trains.push(t);
  if (opts.ramp) {
    const r = acquire(POOL.ramps, makeRamp);
    r.position.set(LX(lane), 0, -(s - DIM.RAMP_L));
    OBJ.ramps.push({ lane, s: s - DIM.RAMP_L, mesh: r });
  }
  return t;
}
function placeTrain(t) {
  for (let i = 0; i < t.cars.length; i++) t.cars[i].position.set(LX(t.lane), 0, -(t.s + i * (DIM.CAR_L + DIM.CAR_GAP)));
}
function addBarrier(lane, s, type) {
  const m = acquire(type === 'low' ? POOL.low : POOL.high, () => makeBarrier(type));
  m.position.set(LX(lane), 0, -s);
  OBJ.barriers.push({ lane, s, type, mesh: m });
}
function addPickup(lane, s, y, type) {
  const p = POOL.pickups[type] || (POOL.pickups[type] = []);
  const m = acquire(p, () => makePickupMesh(type));
  m.position.set(LX(lane), y, -s);
  OBJ.pickups.push({ lane, s, y, type, mesh: m, taken: false });
}
function coinLine(lane, s0, n, step, y = 1.0) { for (let i = 0; i < n; i++) addCoin(LX(lane), y, s0 + i * step); }
function coinArc(lane, sc, base, peak) {
  for (let i = -3; i <= 3; i++) { const u = i / 3.4; addCoin(LX(lane), base + 0.9 + (peak) * (1 - u * u), sc + i * 2.1); }
}

function clearObjects() {
  for (const t of OBJ.trains) for (const c of t.cars) releaseCar(t.line, c);
  for (const r of OBJ.ramps) { r.mesh.visible = false; POOL.ramps.push(r.mesh); }
  for (const b of OBJ.barriers) { b.mesh.visible = false; (b.type === 'low' ? POOL.low : POOL.high).push(b.mesh); }
  for (const p of OBJ.pickups) { p.mesh.visible = false; POOL.pickups[p.type].push(p.mesh); }
  OBJ.trains = []; OBJ.ramps = []; OBJ.barriers = []; OBJ.pickups = [];
  clearCoins();
}
function cullObjects(ps) {
  const lim = ps - 25;
  OBJ.trains = OBJ.trains.filter((t) => { if (t.s + t.len < lim) { for (const c of t.cars) releaseCar(t.line, c); return false; } return true; });
  OBJ.ramps = OBJ.ramps.filter((r) => { if (r.s + DIM.RAMP_L < lim) { r.mesh.visible = false; POOL.ramps.push(r.mesh); return false; } return true; });
  OBJ.barriers = OBJ.barriers.filter((b) => { if (b.s < lim) { b.mesh.visible = false; (b.type === 'low' ? POOL.low : POOL.high).push(b.mesh); return false; } return true; });
  OBJ.pickups = OBJ.pickups.filter((p) => { if (p.s < lim || p.taken) { p.mesh.visible = false; POOL.pickups[p.type].push(p.mesh); return false; } return true; });
}

/* ---------- generator ---------- */
const GEN = { cursor: 0, reserved: [0, 0, 0], rows: 0, lastPow: 0 };
function genReset(s0) {
  clearObjects();
  GEN.cursor = s0 + 70; GEN.reserved = [0, 0, 0]; GEN.rows = 0; GEN.lastPow = s0 + 150;
  coinLine(1, s0 + 22, 10, 3);
}
function lanesFree(s) { return [0, 1, 2].filter((l) => GEN.reserved[l] <= s); }
function genUpdate(ps, speed, runT) {
  const d = clamp((speed - 18) / 15, 0, 1);
  while (GEN.cursor < ps + 320) {
    const s0 = GEN.cursor;
    const len = emitRow(s0, ps, speed, d, runT);
    const gap = Math.max(17, speed * lerp(1.45, 0.98, d)) * rand(0.9, 1.15);
    GEN.cursor = s0 + len + gap;
    GEN.rows++;
  }
}
function emitRow(s0, ps, speed, d, runT) {
  const free = lanesFree(s0);
  const early = GEN.rows < 3;
  const w = [
    ['coins', early ? 2 : 0.6], ['barriers', 2.2], ['trains', early ? 1 : 3], ['run', early ? 0 : 1.6],
    ['moving', GEN.rows < 6 || free.length < 3 ? 0 : 0.7 + d * 1.6], ['combo', early ? 0 : 1.8 + d]
  ];
  let tot = 0; for (const x of w) tot += x[1];
  let r = Math.random() * tot, kind = 'coins';
  for (const x of w) { r -= x[1]; if (r <= 0) { kind = x[0]; break; } }
  let len = 8;
  const usedLanes = new Set();
  if (kind === 'coins') {
    const l = pick(free); coinLine(l, s0, 8, 3); len = 24; usedLanes.add(-1);
  } else if (kind === 'barriers') {
    const n = d > 0.5 ? randi(2, 3) : randi(1, 3);
    const lanes = shuffle(free).slice(0, n);
    for (const l of lanes) { const tp = chance(0.5) ? 'low' : 'high'; addBarrier(l, s0, tp); usedLanes.add(l);
      if (chance(0.5)) { if (tp === 'low') coinArc(l, s0, 0, 1.4); else coinLine(l, s0 - 6, 5, 3, 0.6); } }
    const rest = free.filter((l) => !lanes.includes(l));
    if (rest.length) coinLine(pick(rest), s0 - 9, 6, 3);
    len = 6;
  } else if (kind === 'trains' || kind === 'combo') {
    const n = Math.min(free.length, kind === 'combo' ? 3 : randi(1, 2) + (chance(0.25 + d * 0.3) ? 1 : 0));
    const lanes = shuffle(free).slice(0, n);
    let maxEnd = 0;
    const rampLane = n === 3 || chance(0.4) ? pick(lanes) : -1;
    for (const l of lanes) {
      const cars = randi(1, 3), off = l === rampLane ? 0 : rand(0, 10), ramp = l === rampLane;
      const st = s0 + off + (ramp ? DIM.RAMP_L : 0);
      addTrain(l, st, cars, { ramp }); usedLanes.add(l);
      if (ramp) coinLine(l, st - DIM.RAMP_L + 1, Math.floor(trainLen(cars) / 3) + 2, 3, DIM.ROOF + 1.0);
      maxEnd = Math.max(maxEnd, st + trainLen(cars) - s0);
    }
    const rest = free.filter((l) => !lanes.includes(l));
    if (rest.length) {
      const l = rest[0];
      if (kind === 'combo' && maxEnd > 24) { const bs = s0 + rand(10, maxEnd - 8); const tp = chance(0.5) ? 'low' : 'high'; addBarrier(l, bs, tp); usedLanes.add(l); if (tp === 'low') coinArc(l, bs, 0, 1.4); }
      else coinLine(l, s0, Math.max(4, Math.floor(maxEnd / 3)), 3);
    }
    len = Math.max(10, maxEnd);
  } else if (kind === 'run') {
    // roof run: ramp, then a chain of trains with small hop gaps; neighbours keep you up top
    const l = pick(free);
    let s = s0 + DIM.RAMP_L, k = randi(2, 3);
    addTrain(l, s, randi(2, 3), { ramp: true }); usedLanes.add(l);
    let end = OBJ.trains[OBJ.trains.length - 1].s + OBJ.trains[OBJ.trains.length - 1].len;
    coinLine(l, s0 + 1, 3, 2.4, 1.6);
    for (let i = 1; i < k; i++) { const st = end + rand(2.2, 3.2); const t = addTrain(l, st, randi(1, 3)); end = st + t.len; }
    coinLine(l, s0 + DIM.RAMP_L + 2, Math.floor((end - s0 - DIM.RAMP_L) / 3.2), 3.2, DIM.ROOF + 1.0);
    for (const o of free.filter((x) => x !== l)) {
      if (chance(0.7)) { const st = s0 + rand(6, 16); const t = addTrain(o, st, randi(2, 4)); usedLanes.add(o); end = Math.max(end, st + t.len); }
    }
    len = end - s0;
  } else if (kind === 'moving') {
    const l = pick(free);
    const cars = randi(2, 3), vt = rand(9, 14) * (0.85 + d * 0.35);
    const ahead = s0 - ps;
    const sFront = ps + ahead * (1 + vt / Math.max(speed, 10));
    const t = addTrain(l, sFront, cars, { v: vt });
    GEN.reserved[l] = sFront + t.len + 12; usedLanes.add(l);
    const others = free.filter((x) => x !== l);
    const safe = pick(others);
    coinLine(safe, s0 - 6, 6, 3);
    const other = others.find((x) => x !== safe);
    if (other != null && chance(0.6)) { if (chance(0.5)) addTrain(other, s0 + rand(-4, 6), randi(1, 2)); else addBarrier(other, s0, chance(0.5) ? 'low' : 'high'); usedLanes.add(other); }
    len = 10 + t.len * 0.75;
  }
  // power-ups in a lane left clear in this row
  if (s0 > GEN.lastPow && chance(0.22)) {
    const clear = free.filter((l) => !usedLanes.has(l));
    if (clear.length) {
      const types = [['magnet', 3], ['sneakers', 2], ['jetpack', 1.6], ['x2', 2]];
      let tw = 0; for (const x of types) tw += x[1];
      let q = Math.random() * tw, tp = 'magnet'; for (const x of types) { q -= x[1]; if (q <= 0) { tp = x[0]; break; } }
      addPickup(pick(clear), s0 + len * 0.5, 1.3, tp); GEN.lastPow = s0 + 240;
    }
  }
  return len;
}
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
