/* ---------- runner physics, collisions, power-ups, guard, camera ---------- */
const PHY = { G: 50, JUMP: Math.sqrt(2 * 50 * 2.3), SNEAK: Math.sqrt(2 * 50 * 5.0), ROLL_T: 0.62, LAT: 23, HW: 0.32, JET_Y: 8.3 };
const DUR = { magnet: 12, sneakers: 12, jetpack: 9, x2: 15 };
const PL = {};
let RIG, GUARD, FALCON;

function initActors() {
  RIG = makeRunner(); scene.add(RIG.root); castAll(RIG.root, false);
  GUARD = makeGuard(); scene.add(GUARD.root); castAll(GUARD.root, false);
  FALCON = makeFalcon(); FALCON.scale.setScalar(0.9); scene.add(FALCON); castAll(FALCON, false);
}
function resetPlayer(s0) {
  Object.assign(PL, {
    s: s0, prevS: s0, x: 0, prevX: 0, y: 0, vy: 0, lane: 1, prevLane: 1, grounded: true, groundY: 0, support: 0,
    rolling: 0, jumpBuf: 0, rollBuf: 0, speed: 0, phase: 0, alive: true, deadT: 0, stumbleT: 0, invulnT: 0,
    pw: { magnet: 0, sneakers: 0, jetpack: 0, x2: 0 }, coins: 0, score: 0, dist: 0, baseMult: 1,
    runT: 0, what: '', gDist: 2.2, gX: 0, camX: 0, camY: 0, shake: 0, cause: '', jetCoinS: 0, jetLane: 1, lean: 0, landT: 0, faceY: 0
  });
}
function mult() { return PL.baseMult * (PL.pw.x2 > 0 ? 2 : 1); }

/* actions */
function act(a) {
  if (!PL.alive) return;
  if (a === 'left' || a === 'right') {
    const nl = PL.lane + (a === 'left' ? -1 : 1);
    if (nl < 0 || nl > 2) { if (PL.pw.jetpack <= 0) { PL.shake = 0.22; PL.lean = (nl < 0 ? 0.25 : -0.25); SFX.land(); } return; }
    PL.prevLane = PL.lane; PL.lane = nl; SFX.whoosh();
  } else if (a === 'up') {
    if (PL.pw.jetpack > 0) return;
    if (PL.grounded) doJump(); else PL.jumpBuf = 0.16;
  } else if (a === 'down') {
    if (PL.pw.jetpack > 0) return;
    if (!PL.grounded) { PL.vy = Math.min(PL.vy, -34); PL.rollBuf = 0.35; SFX.roll(); }
    else { PL.rolling = PHY.ROLL_T; SFX.roll(); }
  }
}
function doJump() {
  PL.vy = PL.pw.sneakers > 0 ? PHY.SNEAK : PHY.JUMP; PL.grounded = false; PL.rolling = 0; PL.jumpBuf = 0;
  if (PL.pw.sneakers > 0) SFX.spring(); else SFX.jump();
}
function stumble(why) {
  if (PL.invulnT > 0) return;
  if (PL.stumbleT > 0) { caught(); return; }
  PL.stumbleT = 3.4; PL.shake = Math.max(PL.shake, 0.35); SFX.stumble(); SFX.whistle(); if (window.buzz) buzz(60);
}
function caught() { die('caught'); }
function crash(why) {
  if (PL.invulnT > 0) return;
  PL.what = why;
  die('crash');
}
function die(cause) {
  if (!PL.alive) return;
  PL.alive = false; PL.cause = cause; PL.deadT = 0; PL.shake = 0.7; PL.rolling = 0;
  if (cause === 'crash') { PL.speed = 0; PL.s -= 0.5; }
  if (cause === 'crash') SFX.crash(); else SFX.stumble();
  if (window.buzz) buzz([80, 40, 120]);
  SFX.whistle();
}

/* support height under the runner: train roofs and ramps */
function supportAt(s, x) {
  let sup = 0;
  for (const t of OBJ.trains) {
    if (Math.abs(x - LX(t.lane)) < 1.3 && s >= t.s - 0.15 && s <= t.s + t.len + 0.15) sup = Math.max(sup, DIM.ROOF);
  }
  for (const r of OBJ.ramps) {
    if (Math.abs(x - LX(r.lane)) < 1.3 && s >= r.s && s <= r.s + DIM.RAMP_L) sup = Math.max(sup, DIM.ROOF * (s - r.s) / DIM.RAMP_L);
  }
  return sup;
}
function onRampAt(s, x) { for (const r of OBJ.ramps) if (Math.abs(x - LX(r.lane)) < 1.3 && s >= r.s - 0.5 && s <= r.s + DIM.RAMP_L) return true; return false; }

function updatePlayer(dt) {
  const P_ = PL;
  if (!P_.alive) {
    P_.deadT += dt; P_.speed = damp(P_.speed, 0, 6, dt); P_.s += P_.speed * dt;
    if (!P_.grounded) { P_.vy -= PHY.G * dt; P_.y += P_.vy * dt; if (P_.y <= P_.support) { P_.y = P_.support; P_.grounded = true; } }
    P_.gDist = damp(P_.gDist, 1.2, 3, dt);
    return;
  }
  P_.runT += dt;
  const target = (TOUCH ? 16.5 + 13 * (1 - Math.exp(-P_.runT / 140)) : 18 + 15 * (1 - Math.exp(-P_.runT / 110)));
  P_.speed = damp(P_.speed, target, 2.5, dt);
  P_.prevS = P_.s; P_.prevX = P_.x;
  P_.s += P_.speed * dt;
  P_.dist = P_.s;
  P_.score += P_.speed * dt * mult();
  // moving trains
  for (const t of OBJ.trains) {
    t.prevS = t.s;
    if (t.v) { t.s -= t.v * dt; placeTrain(t); if (!t.horn && t.s - P_.s < 150 && t.s > P_.s) { t.horn = true; SFX.horn(); } }
  }
  // lateral
  P_.x = moveTo(P_.x, LX(P_.lane), PHY.LAT * dt);
  // timers
  for (const k in P_.pw) if (P_.pw[k] > 0) { P_.pw[k] -= dt; if (P_.pw[k] <= 0) { P_.pw[k] = 0; powerEnded(k); } }
  if (P_.stumbleT > 0) P_.stumbleT -= dt;
  if (P_.invulnT > 0) P_.invulnT -= dt;
  if (P_.rolling > 0) P_.rolling -= dt;
  if (P_.jumpBuf > 0) P_.jumpBuf -= dt;
  if (P_.rollBuf > 0) P_.rollBuf -= dt;
  // vertical
  const sup = supportAt(P_.s, P_.x);
  P_.support = sup;
  if (P_.pw.jetpack > 0) {
    P_.y = damp(P_.y, PHY.JET_Y, 3.5, dt); P_.vy = 0; P_.grounded = false; P_.groundY = P_.y;
    jetCoins();
  } else {
    if (P_.grounded) {
      if (sup >= P_.y - 0.05 && sup <= P_.y + 0.7) P_.y = sup;
      else if (sup > P_.y + 0.7 && onRampAt(P_.s, P_.x)) P_.y = sup;
      else if (sup < P_.y - 0.05) { P_.grounded = false; P_.vy = onRampAt(P_.s, P_.x) ? 0 : 0; }
    }
    if (!P_.grounded) {
      P_.vy -= PHY.G * dt; P_.y += P_.vy * dt;
      if (P_.vy <= 0 && P_.y <= sup) {
        P_.y = sup; P_.vy = 0; P_.grounded = true; P_.groundY = sup; P_.landT = 0.18; SFX.land();
        if (P_.rollBuf > 0) { P_.rolling = PHY.ROLL_T; P_.rollBuf = 0; }
        if (P_.jumpBuf > 0) doJump();
      }
    } else P_.groundY = P_.y;
  }
  collide();
  pickups();
  coinsUpdate(dt);
  // guard chase distance
  const want = P_.runT < 2.6 ? 2.4 : P_.stumbleT > 0 ? 1.75 : 40;
  P_.gDist = damp(P_.gDist, want, want > 10 ? 0.6 : 7, dt);
}
function collide() {
  const P_ = PL, h = P_.rolling > 0 ? 0.9 : 1.75;
  if (P_.pw.jetpack > 0) return;
  const s0 = P_.prevS - 0.3, s1 = P_.s + 0.3;
  for (const t of OBJ.trains) {
    const lx = LX(t.lane);
    if (Math.abs(P_.x - lx) >= 1.25 + PHY.HW) continue;
    if (!(s1 > t.s && P_.s - 0.3 < t.s + t.len)) continue;
    if (P_.y >= DIM.ROOF - 0.05) continue;
    if (P_.invulnT > 0) { P_.y = DIM.ROOF; P_.vy = 0; P_.grounded = true; continue; }
    const wasX = Math.abs(P_.prevX - lx) < 1.25 + PHY.HW;
    const wasFront = P_.prevS + 0.3 <= (t.prevS != null ? t.prevS : t.s) + 0.05;
    if (!wasX && !wasFront) { P_.lane = P_.prevLane; P_.x = P_.prevX; stumble('side'); return; }
    if (!wasX) { P_.lane = P_.prevLane; P_.x = P_.prevX; stumble('side'); return; }
    if (P_.y >= DIM.ROOF - 0.9) { P_.y = DIM.ROOF; P_.vy = 0; P_.grounded = true; P_.groundY = DIM.ROOF; continue; }
    crash('train'); return;
  }
  for (const b of OBJ.barriers) {
    const lx = LX(b.lane);
    if (Math.abs(P_.x - lx) >= 1.15 + PHY.HW) continue;
    if (!(s1 > b.s - 0.25 && s0 < b.s + 0.25)) continue;
    const hit = b.type === 'low' ? P_.y < 1.05 : (P_.y + h > 1.25 && P_.y < 3.1);
    if (!hit) continue;
    if (P_.invulnT > 0) continue;
    const wasX = Math.abs(P_.prevX - lx) < 1.15 + PHY.HW;
    if (!wasX) { P_.lane = P_.prevLane; P_.x = P_.prevX; stumble('side'); return; }
    crash('barrier'); return;
  }
}
function pickups() {
  const P_ = PL;
  for (const p of OBJ.pickups) {
    if (p.taken) continue;
    if (Math.abs(P_.x - LX(p.lane)) > 1.1) continue;
    if (!(P_.s + 1.0 > p.s && P_.prevS - 1.0 < p.s)) continue;
    if (Math.abs(P_.y + 0.9 - p.y) > 2.2) continue;
    p.taken = true; p.mesh.visible = false;
    {
      PL.pw[p.type] = DUR[p.type];
      if (p.type === 'jetpack') { PL.jetCoinS = PL.s + 8; PL.jetLane = PL.lane; PL.rolling = 0; SFX.jetStart(); }
    }
    SFX.power();
    spark(LX(p.lane), p.y, -p.s, 0xffffff);
  }
}
function powerEnded(k) {
  if (k === 'jetpack') { PL.invulnT = 2.0; PL.grounded = false; PL.vy = 0; SFX.jetStop(); }
}
function jetCoins() {
  // trail of sky coins while flying
  while (PL.jetCoinS < PL.s + 90 && PL.pw.jetpack > 1.2) {
    if (chance(0.06)) PL.jetLane = clamp(PL.jetLane + (chance(0.5) ? -1 : 1), 0, 2);
    addCoin(LX(PL.jetLane), PHY.JET_Y + 0.9, PL.jetCoinS);
    PL.jetCoinS += 2.6;
  }
}
const _tmpV = new THREE.Vector3();
function coinsUpdate(dt) {
  const P_ = PL, mag = P_.pw.magnet > 0;
  COINS.spin += dt * 4;
  _cq.setFromAxisAngle(_up, COINS.spin);
  const py = P_.y + 0.95;
  let n = 0;
  for (const c of COINS.list) {
    if (!c.alive) continue;
    const ds = c.s - P_.s;
    if (ds < -12) { kill(c); continue; }
    if (mag && ds < 22 && ds > -2 && Math.abs(c.x - P_.x) < 10) c.pull = true;
    if (c.pull) {
      c.x = damp(c.x, P_.x, 12, dt); c.y = damp(c.y, py, 12, dt); c.s = damp(c.s, P_.s + 0.3, 12, dt);
    }
    const dx = Math.abs(c.x - P_.x), dy = Math.abs(c.y - py);
    const hitS = c.s > P_.prevS - 0.7 && c.s < P_.s + 0.8;
    if (dx < 0.95 && dy < 1.35 && hitS) {
      P_.coins++; P_.score += 5 * mult(); SFX.coin(); spark(c.x, c.y, -c.s); kill(c); continue;
    }
    if (ds < 230) {
      _cp.set(c.x, c.y, -c.s); _cm.compose(_cp, _cq, _cs); COINS.mesh.setMatrixAt(n++, _cm);
    }
  }
  COINS.mesh.count = n; COINS.mesh.instanceMatrix.needsUpdate = true;
}
function kill(c) { c.alive = false; COINS.free.push(c); }
function refreshCoinMatrices() {
  _cq.setFromAxisAngle(_up, COINS.spin); let n = 0;
  for (const c of COINS.list) { if (!c.alive || c.s - PL.s > 230) continue; _cp.set(c.x, c.y, -c.s); _cm.compose(_cp, _cq, _cs); COINS.mesh.setMatrixAt(n++, _cm); }
  COINS.mesh.count = n; COINS.mesh.instanceMatrix.needsUpdate = true;
}

/* visuals for the actors and camera */
function updateActors(dt, t, mode) {
  const P_ = PL, R = RIG;
  const z = -P_.s;
  R.root.position.set(P_.x, P_.y, z);
  P_.lean = damp(P_.lean, (LX(P_.lane) - P_.x) * 0.16, 12, dt);
  let pose = 'idle';
  if (mode === 'title') { P_.faceY = damp(P_.faceY, 0.25, 3, dt); pose = 'dance'; }
  else {
    P_.faceY = damp(P_.faceY, 0, 8, dt);
    if (!P_.alive) pose = 'fall';
    else if (P_.pw.jetpack > 0 || (P_.invulnT > 1.6 && !P_.grounded)) pose = 'fly';
    else if (P_.rolling > 0) pose = 'roll';
    else if (!P_.grounded) pose = 'jump';
    else pose = 'run';
  }
  P_.phase += dt * (P_.speed * 0.5 + 2);
  poseRig(R, P_.phase, pose, pose === 'roll' ? 1 - P_.rolling / PHY.ROLL_T : t, 1);
  R.root.rotation.set(0, P_.faceY, -P_.lean);
  if (!P_.alive) { R.body.rotation.x = Math.min(P_.deadT * 3, 1.25); R.body.position.y = 0.1; }
  if (P_.landT > 0) { P_.landT -= dt; R.hips.position.y -= P_.landT * 0.5; }
  flapTails(R, t, P_.speed);
  R.jetpack.visible = P_.pw.jetpack > 0;
  for (const f of R.flames) { const k = 0.8 + Math.random() * 0.5; f.scale.set(0.45 * k, 0.95 * k, 1); }
  for (const s of R.springs) s.visible = P_.pw.sneakers > 0;
  // blink when invulnerable
  R.root.visible = !(P_.invulnT > 0 && P_.alive && Math.floor(t * 14) % 2 === 0);
  // guard + falcon
  const g = GUARD;
  P_.gX = damp(P_.gX, P_.x + (P_.lane === 2 ? -0.55 : 0.55), 5, dt);
  const gs = P_.s - P_.gDist;
  const gVisible = mode !== 'title' && P_.gDist < 4.2;
  g.root.visible = gVisible; FALCON.visible = gVisible;
  if (gVisible) {
    const gy = supportAt(gs, P_.gX);
    g.root.position.set(P_.gX, gy, -gs); g.root.rotation.set(0, 0, 0);
    poseRig(g, P_.phase * 0.95 + 1.3, P_.alive || P_.gDist > 1.4 ? 'run' : 'idle', t, 1.1);
    if (!P_.alive && P_.gDist < 1.6) { g.aL.sh.rotation.x = -1.6; g.aR.sh.rotation.x = -1.6; }
    FALCON.position.set(P_.gX + 2.4 * Math.sign(Math.sin(t * 0.4) + 0.001) + Math.sin(t * 1.3) * 0.6, gy + 3.1 + Math.sin(t * 2.1) * 0.3, -(gs + 1.2));
    const fl = Math.sin(t * 13) * 0.6, fl2 = Math.sin(t * 13 - 0.7) * 0.5; FALCON.userData.wL.rotation.z = fl; FALCON.userData.wR.rotation.z = -fl; FALCON.userData.wL2.rotation.z = fl2; FALCON.userData.wR2.rotation.z = -fl2;
    FALCON.rotation.set(0.1, 0, Math.sin(t * 1.3) * 0.2);
  }
}
function updateCamera(dt, mode, t) {
  const P_ = PL;
  const asp = camera.aspect, port = asp < 1;
  const baseFov = port ? 62 : 54;
  if (mode === 'title') {
    // in front of the runner, looking back down the street (Subway Surfers style start screen)
    const tx = port ? 0.9 : 1.6, ty = port ? 2.7 : 2.5, tz = -(P_.s + (port ? 6.4 : 5.6));
    camera.position.set(damp(camera.position.x, tx, 3, dt), damp(camera.position.y, ty, 3, dt), damp(camera.position.z, tz, 3, dt));
    camera.lookAt(port ? 0.2 : -0.9, port ? 2.5 : 2.6, -(P_.s - 30));
    camera.fov = damp(camera.fov, port ? 64 : 50, 3, dt);
  } else {
    P_.camX = damp(P_.camX, P_.x * 0.92, 9, dt);
    const refY = P_.pw.jetpack > 0 ? P_.y - 1.4 : P_.groundY + Math.max(0, P_.y - P_.groundY) * 0.3;
    P_.camY = damp(P_.camY, refY, 4.5, dt);
    const back = port ? 7.9 : 7.8, up = port ? 5.3 : 5.1;
    let cx = P_.camX, cy = P_.camY + up, cz = -(P_.s - back);
    if (P_.shake > 0) { P_.shake = Math.max(0, P_.shake - dt); const a = P_.shake * 0.5; cx += (Math.random() - 0.5) * a; cy += (Math.random() - 0.5) * a; }
    if (mode === 'intro') {
      // swing from the front of the runner round to behind him
      const k = smooth(clamp(G.introT / 0.9, 0, 1));
      const ang = Math.PI * (1 - k);
      const r = lerp(port ? 6.4 : 5.6, back, k);
      camera.position.set(cx + Math.sin(ang) * r * 0.35, lerp(2.6, cy, k), -(P_.s + Math.cos(ang) * -r) );
    } else camera.position.set(cx, cy, cz);
    camera.lookAt(P_.camX, P_.camY + 1.0, -(P_.s + 13));
    camera.fov = damp(camera.fov, baseFov + (P_.pw.jetpack > 0 ? 5 : 0) + (P_.speed - 18) * 0.12, 3, dt);
  }
  camera.updateProjectionMatrix();
}
