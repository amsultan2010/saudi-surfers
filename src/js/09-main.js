/* ---------- game flow, input, HUD ---------- */
const $ = (q) => document.querySelector(q);
const G = { state: 'loading', last: 0, t: 0, introT: 0, best: LS.get('best', 0), bank: LS.get('bank', 0), hudT: 0, toastT: 0, flashT: 0, lastCoins: 0, lastMult: 1, perf: { acc: 0, n: 0, pr: 1.75 } };
const PW_META = {
  magnet: { badge: 'M', color: 'var(--m-red)' },
  sneakers: { badge: 'S', color: 'var(--m-green)' },
  jetpack: { badge: 'J', color: 'var(--m-orange)' },
  x2: { badge: '2x', color: 'var(--m-purple)' }
};
const PW_EL = {};
function buildHUD() {
  const box = $('#powers');
  for (const k in PW_META) {
    const m = PW_META[k];
    const el = document.createElement('div'); el.className = 'pw'; el.hidden = true;
    el.innerHTML = `<span class="pw-badge o" style="background:${m.color};-webkit-text-stroke:3px rgba(0,0,0,.45)">${m.badge}</span><span class="pw-bar"><span class="pw-fill" style="background:${m.color}"></span></span>`;
    box.appendChild(el); PW_EL[k] = { el, fill: el.querySelector('.pw-fill') };
  }
  updateMuteIcon();
}
function updateMuteIcon() { $('#muteWave').toggleAttribute('hidden', AUD.muted); $('#muteX').toggleAttribute('hidden', !AUD.muted); $('#btnMute').setAttribute('aria-label', AUD.muted ? 'Unmute sound' : 'Mute sound'); }
function bump(el) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
function hudUpdate(dt) {
  G.hudT -= dt;
  if (G.hudT > 0) return; G.hudT = 0.06;
  $('#score').textContent = Math.floor(PL.score).toLocaleString('en-US');
  if (PL.coins !== G.lastCoins) { $('#coins').textContent = PL.coins.toLocaleString('en-US'); bump($('#coins')); G.lastCoins = PL.coins; }
  const m = mult();
  if (m !== G.lastMult) { $('#multTxt').textContent = 'x' + m; bump($('#mult')); G.lastMult = m; }
  $('#mult').classList.toggle('hot', PL.pw.x2 > 0);
  for (const k in PW_EL) {
    const v = PL.pw[k]; PW_EL[k].el.hidden = !(v > 0);
    if (v > 0) PW_EL[k].fill.style.transform = `scaleX(${clamp(v / DUR[k], 0, 1)})`;
  }
  const nx = nextMarkInfo(PL.s);
  if (nx) { $('#nextTxt').innerHTML = `${nx.info.short} <b>${Math.max(0, Math.round(nx.s - 150 - PL.s))} m</b>`; $('#nextDot').style.background = nx.info.color; }
}
function toast(ar, en, bonus) {
  $('#toastAr').textContent = ar; $('#toastEn').textContent = en; $('#toastBonus').textContent = bonus; $('#toastBonus').hidden = !bonus;
  const t = $('#toast'); t.classList.remove('show'); void t.offsetWidth; t.classList.add('show'); G.toastT = 2.8;
}
function hudFlash(txt) { const f = $('#flash'); f.textContent = txt; f.classList.remove('show'); void f.offsetWidth; f.classList.add('show'); G.flashT = 1.0; }
window.onLandmark = (info) => {
  if (G.state !== 'run' && G.state !== 'intro') return;
  PL.baseMult = Math.min(PL.baseMult + 1, 30);
  toast(info.ar, info.en, `Landmark bonus · x${PL.baseMult}`);
  SFX.power();
};

/* flow */
function newRun() { resetPlayer(0); resetWorld(0); genReset(0); PL.camY = 0; refreshCoinMatrices(); G.lastCoins = -1; G.lastMult = 0; }
function toTitle() {
  newRun(); G.state = 'title';
  $('#title').hidden = false; $('#hud').hidden = true; $('#over').hidden = true; $('#pause').hidden = true;
  $('#bestTitle').textContent = G.best.toLocaleString('en-US'); $('#bankTitle').textContent = G.bank.toLocaleString('en-US');
  musicDuck(0.25);
}
function startRun(fresh) {
  audioInit(); musicStart();
  if (fresh) { newRun(); PL.faceY = 0; }
  G.state = 'intro'; G.introT = fresh ? 1 : 0;
  $('#title').hidden = true; $('#over').hidden = true; $('#pause').hidden = true; $('#hud').hidden = false;
  $('#toast').classList.remove('show');
  setTimeout(() => { SFX.screech(); SFX.whistle(); }, 150);
}
function gameOver() {
  G.state = 'over';
  const sc = Math.floor(PL.score), isBest = sc > G.best;
  if (isBest) { G.best = sc; LS.set('best', sc); }
  G.bank += PL.coins; LS.set('bank', G.bank);
  const caught = PL.cause === 'caught';
  $('#overAr').textContent = caught ? 'مسكتك!' : 'طحت!';
  $('#overEn').textContent = caught ? 'The police caught you' : PL.what === 'barrier' ? 'You hit a barrier' : 'You hit a metro train';
  $('#finalScore').textContent = sc.toLocaleString('en-US');
  $('#stCoins').textContent = PL.coins.toLocaleString('en-US');
  $('#stDist').textContent = Math.floor(PL.dist).toLocaleString('en-US') + ' m';
  $('#stMarks').textContent = WS.landmarksPassed;
  const bl = $('#bestLine'); bl.textContent = isBest ? 'New high score!' : 'Best ' + G.best.toLocaleString('en-US'); bl.classList.toggle('new', isBest);
  $('#over').hidden = false; $('#hud').hidden = true;
  setTimeout(() => { try { $('#btnAgain').focus({ preventScroll: true }); } catch (e) {} }, 50);
  musicDuck(0.18);
}
function pause() {
  if (G.state !== 'run' && G.state !== 'intro') return;
  G.prevState = G.state; G.state = 'paused'; $('#pause').hidden = false; musicStop(); SFX.jetStop();
}
function resume() {
  if (G.state !== 'paused') return;
  G.state = G.prevState || 'run'; $('#pause').hidden = true; G.last = performance.now(); musicStart();
  if (PL.pw.jetpack > 0) SFX.jetStart();
}

/* input */
function onKey(e) {
  const k = e.key;
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(k)) e.preventDefault();
  if (e.repeat) return;
  if (k === 'm' || k === 'M') { audioInit(); setMuted(!AUD.muted); updateMuteIcon(); return; }
  if (G.state === 'title') { if (k === 'Enter' || k === ' ' || k === 'ArrowUp') startRun(false); return; }
  if (G.state === 'over') { if (k === 'Enter' || k === ' ') startRun(true); return; }
  if (G.state === 'paused') { if (k === 'p' || k === 'P' || k === 'Escape' || k === 'Enter') resume(); return; }
  if (G.state !== 'run' && G.state !== 'intro') return;
  if (k === 'ArrowLeft' || k === 'a' || k === 'A') act('left');
  else if (k === 'ArrowRight' || k === 'd' || k === 'D') act('right');
  else if (k === 'ArrowUp' || k === 'w' || k === 'W') act('up');
  else if (k === 'ArrowDown' || k === 's' || k === 'S') act('down');
  else if (k === ' ') act('up');
  else if (k === 'p' || k === 'P' || k === 'Escape') pause();
}
const TOUCH = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
function buzz(ms) { try { if (TOUCH && navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }
const SW = { id: null, x: 0, y: 0, t: 0, used: false, lastTap: 0, n: 0 };
function onDown(e) {
  if (e.target.closest && e.target.closest('button, a')) return;
  if (G.state !== 'run' && G.state !== 'intro') return;
  SW.id = e.pointerId; SW.x = e.clientX; SW.y = e.clientY; SW.t = performance.now(); SW.used = false; SW.n = 0;
}
function onMove(e) {
  if (SW.id !== e.pointerId) return;
  const dx = e.clientX - SW.x, dy = e.clientY - SW.y;
  // first swipe fires after a short flick; a continued horizontal drag can switch a second lane
  const need = SW.used ? 52 : (TOUCH ? 14 : 24);
  if (Math.hypot(dx, dy) < need) return;
  if (SW.used && Math.abs(dx) < Math.abs(dy)) return;
  if (SW.n >= 2) return;
  SW.used = true; SW.n++; SW.x = e.clientX; SW.y = e.clientY;
  if (Math.abs(dx) > Math.abs(dy) * 0.9) act(dx < 0 ? 'left' : 'right'); else act(dy < 0 ? 'up' : 'down');
}
function onUp(e) {
  if (SW.id !== e.pointerId) return;
  SW.id = null;
  if (!SW.used && performance.now() - SW.t < 280) {
    if (TOUCH) { act(e.clientX < innerWidth / 2 ? 'left' : 'right'); return; } // tap a side of the screen to switch lanes
  }
}
function bindUI() {
  addEventListener('keydown', onKey, { passive: false });
  addEventListener('pointerdown', onDown); addEventListener('pointermove', onMove); addEventListener('pointerup', onUp); addEventListener('pointercancel', onUp);
  $('#title').addEventListener('click', (e) => { if (e.target.closest('button, a')) return; if (G.state === 'title') startRun(false); });
  $('#btnAgain').addEventListener('click', () => startRun(true));
  $('#btnHome').addEventListener('click', () => { SFX.jetStop(); toTitle(); });
  $('#btnPause').addEventListener('click', pause);
  $('#btnResume').addEventListener('click', resume);
  $('#btnQuit').addEventListener('click', () => { SFX.jetStop(); toTitle(); });
  $('#btnMute').addEventListener('click', (e) => { e.stopPropagation(); audioInit(); setMuted(!AUD.muted); updateMuteIcon(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  addEventListener('resize', onResize);
  document.addEventListener('contextmenu', (e) => e.preventDefault());
}
function onResize() { const w = innerWidth, h = innerHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); }

/* main loop */
function frame(now) {
  requestAnimationFrame(frame);
  let dt = (now - G.last) / 1000; G.last = now;
  if (!(dt > 0)) dt = 0.016; dt = Math.min(dt, 0.05);
  if (G.state === 'paused' || G.state === 'loading') { renderer.render(scene, camera); return; }
  G.t += dt;
  const st = G.state;
  if (st === 'title') {
    updateWorld(dt, PL.s, 260);
    updateActors(dt, G.t, 'title');
    updateCamera(dt, 'title', G.t);
  } else {
    if (st === 'intro') { G.introT += dt; if (G.introT > 0.9) G.state = 'run'; }
    updatePlayer(dt);
    genUpdate(PL.s, PL.speed, PL.runT);
    cullObjects(PL.s);
    updateWorld(dt, PL.s, PL.runT < 3 ? 260 : 14);
    updateActors(dt, G.t, 'run');
    updateCamera(dt, G.state === 'intro' ? 'intro' : 'run', G.t);
    if (st !== 'over') hudUpdate(dt);
    if (!PL.alive && st !== 'over' && PL.deadT > 1.3) gameOver();
  }
  for (const p of OBJ.pickups) { const inn = p.mesh.userData.inner; inn.rotation.y += dt * 2.6; inn.position.y = Math.sin(G.t * 3 + p.s) * 0.15; }
  updateSparks(dt);
  if (G.toastT > 0) { G.toastT -= dt; if (G.toastT <= 0) $('#toast').classList.remove('show'); }
  if (G.flashT > 0) { G.flashT -= dt; if (G.flashT <= 0) $('#flash').classList.remove('show'); }
  G.perf.acc += dt; G.perf.n++;
  if (G.perf.n >= 90) {
    const avg = G.perf.acc / G.perf.n; G.perf.acc = 0; G.perf.n = 0;
    const maxPr = Math.min(window.devicePixelRatio || 1, 1.75);
    if (avg > 0.026 && G.perf.pr > 0.75) { G.perf.pr = Math.max(0.75, G.perf.pr - 0.25); renderer.setPixelRatio(G.perf.pr); }
    else if (avg < 0.0175 && G.perf.pr < maxPr) { G.perf.pr = Math.min(maxPr, G.perf.pr + 0.25); renderer.setPixelRatio(G.perf.pr); }
  }
  renderer.render(scene, camera);
}

async function boot(data) {
  if (data && typeof data.best === 'number') G.best = Math.max(G.best, data.best);
  if (data && typeof data.bank === 'number') G.bank = Math.max(G.bank, data.bank);
  try {
    await Promise.race([Promise.all(['40px Lalezar', "40px 'Lilita One'"].map((f) => document.fonts.load(f))), new Promise((r) => setTimeout(r, 1800))]);
  } catch (e) {}
  buildTextures(); buildRoadTextures(); buildBaseMaterials(); buildSharedGeos(); buildSegmentGeos(); buildEnvMaterials();
  initRenderer($('#game'));
  G.perf.pr = renderer.getPixelRatio();
  buildWorld(); initCoins(); initSparks(); initActors();
  buildHUD(); bindUI(); onResize();
  if (TOUCH) {
    document.querySelector('.hints').innerHTML = '<span>Swipe or tap left/right to switch</span><span>Swipe ↑ jump</span><span>Swipe ↓ roll</span>';
    G.perf.pr = Math.min(G.perf.pr, 1.25); renderer.setPixelRatio(G.perf.pr);
  }
  toTitle();

  camera.position.set(1.6, 2.5, -5.6); camera.lookAt(-0.9, 2.6, 30);
  G.last = performance.now();
  requestAnimationFrame(frame);
  window.claude?.hot?.snapshot?.(() => ({ best: G.best, bank: G.bank }));
}
window.claude?.hot?.ready ? window.claude.hot.ready(boot) : boot(window.claude?.hot?.data ?? {});
