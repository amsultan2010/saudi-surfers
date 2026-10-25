/* ---------- synthesized sound: SFX + a darbuka/hijaz street beat ---------- */
const AUD = { ctx: null, master: null, music: null, sfx: null, noise: null, muted: LS.get('muted', false), playing: false, step: 0, next: 0, timer: 0, jet: null, coinN: 0, coinT: 0 };
function audioInit() {
  if (AUD.ctx) { if (AUD.ctx.state === 'suspended') AUD.ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  const ctx = AUD.ctx = new AC();
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(ctx.destination);
  AUD.master = ctx.createGain(); AUD.master.gain.value = AUD.muted ? 0 : 0.9; AUD.master.connect(comp);
  AUD.music = ctx.createGain(); AUD.music.gain.value = 0.42; AUD.music.connect(AUD.master);
  AUD.sfx = ctx.createGain(); AUD.sfx.gain.value = 0.8; AUD.sfx.connect(AUD.master);
  const len = ctx.sampleRate; const b = ctx.createBuffer(1, len, ctx.sampleRate); const d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  AUD.noise = b;
}
function setMuted(m) { AUD.muted = m; LS.set('muted', m); if (AUD.master) AUD.master.gain.setTargetAtTime(m ? 0 : 0.9, AUD.ctx.currentTime, 0.05); }
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
function env(g, t, a, peak, dec, sus = 0.0001) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(Math.max(sus, 0.0001), t + a + dec); }
function osc(type, f0, f1, t, dur, peak, dest, a = 0.005) {
  const c = AUD.ctx, o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  env(g, t, a, peak, dur); o.connect(g); g.connect(dest || AUD.sfx); o.start(t); o.stop(t + a + dur + 0.05);
  return o;
}
function nz(t, dur, peak, type, f0, f1, q = 1, dest) {
  const c = AUD.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = AUD.noise; f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  env(g, t, 0.004, peak, dur); s.connect(f); f.connect(g); g.connect(dest || AUD.sfx);
  s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
}
const ok = () => AUD.ctx && AUD.ctx.state === 'running';
const SFX = {
  coin() {
    if (!ok()) return; const t = AUD.ctx.currentTime;
    if (t - AUD.coinT < 0.5) AUD.coinN = (AUD.coinN + 1) % 6; else AUD.coinN = 0; AUD.coinT = t;
    const up = [0, 2, 4, 5, 7, 9][AUD.coinN];
    osc('square', mtof(88 + up), 0, t, 0.05, 0.07); osc('triangle', mtof(88 + up), 0, t, 0.05, 0.12);
    osc('square', mtof(95 + up), 0, t + 0.055, 0.14, 0.06); osc('triangle', mtof(95 + up), 0, t + 0.055, 0.16, 0.12);
  },
  jump() { if (!ok()) return; const t = AUD.ctx.currentTime; nz(t, 0.2, 0.25, 'bandpass', 500, 2600, 1.2); osc('sine', 260, 520, t, 0.12, 0.12); },
  spring() { if (!ok()) return; const t = AUD.ctx.currentTime; const o = osc('sine', 180, 900, t, 0.3, 0.25); nz(t, 0.18, 0.15, 'bandpass', 800, 3000, 1); },
  roll() { if (!ok()) return; const t = AUD.ctx.currentTime; nz(t, 0.26, 0.28, 'bandpass', 2400, 380, 0.9); },
  whoosh() { if (!ok()) return; const t = AUD.ctx.currentTime; nz(t, 0.13, 0.16, 'bandpass', 1500, 700, 1.4); },
  land() { if (!ok()) return; const t = AUD.ctx.currentTime; osc('sine', 140, 55, t, 0.09, 0.22); nz(t, 0.06, 0.12, 'lowpass', 900, 200, 0.7); },
  stumble() { if (!ok()) return; const t = AUD.ctx.currentTime; osc('square', 190, 80, t, 0.18, 0.12); osc('sine', 110, 50, t, 0.2, 0.4); nz(t, 0.12, 0.25, 'lowpass', 1200, 200, 0.7); },
  crash() {
    if (!ok()) return; const t = AUD.ctx.currentTime;
    nz(t, 0.7, 0.6, 'lowpass', 2400, 120, 0.6); osc('sine', 95, 35, t, 0.6, 0.7);
    osc('square', 523, 400, t, 0.4, 0.05); osc('square', 761, 600, t + 0.01, 0.5, 0.04);
    if (AUD.music) AUD.music.gain.setTargetAtTime(0.12, t, 0.2);
  },
  whistle() {
    if (!ok()) return; const t = AUD.ctx.currentTime, c = AUD.ctx;
    for (let k = 0; k < 2; k++) {
      const o = c.createOscillator(), g = c.createGain(), l = c.createOscillator(), lg = c.createGain();
      const t0 = t + 0.05 + k * 0.32;
      o.type = 'sine'; o.frequency.value = 2750; l.frequency.value = 32; lg.gain.value = 140; l.connect(lg); lg.connect(o.frequency);
      env(g, t0, 0.01, 0.12, 0.24); o.connect(g); g.connect(AUD.sfx); o.start(t0); l.start(t0); o.stop(t0 + 0.32); l.stop(t0 + 0.32);
    }
  },
  horn() {
    if (!ok()) return; const t = AUD.ctx.currentTime, c = AUD.ctx;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1500; f.connect(AUD.sfx);
    for (const fr of [311, 370, 466]) { const o = c.createOscillator(), g = c.createGain(); o.type = 'sawtooth'; o.frequency.value = fr; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.05); g.gain.setValueAtTime(0.06, t + 0.55); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9); o.connect(g); g.connect(f); o.start(t); o.stop(t + 1); }
  },
  power() { if (!ok()) return; const t = AUD.ctx.currentTime; [72, 76, 79, 84, 88].forEach((m, i) => { osc('square', mtof(m), 0, t + i * 0.055, 0.1, 0.06); osc('triangle', mtof(m + 12), 0, t + i * 0.055, 0.12, 0.08); }); },
  screech() { if (!ok()) return; const t = AUD.ctx.currentTime; osc('sawtooth', 2600, 1300, t, 0.45, 0.04); osc('sine', 3200, 1700, t, 0.45, 0.06); },
  jetStart() {
    if (!ok() || AUD.jet) return; const c = AUD.ctx, t = c.currentTime;
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = AUD.noise; s.loop = true; f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 0.7;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.3);
    s.connect(f); f.connect(g); g.connect(AUD.sfx); s.start(t); AUD.jet = { s, g };
  },
  jetStop() { if (!AUD.jet) return; const t = AUD.ctx.currentTime; AUD.jet.g.gain.setTargetAtTime(0.0001, t, 0.15); AUD.jet.s.stop(t + 0.8); AUD.jet = null; }
};

/* music: 100 BPM, maqsum darbuka + kick/clap, hijaz-mode bass and lead */
const BPM = 100, STEP = 60 / BPM / 4;
const MEL = [[0, 69, 2], [2, 70, 1], [3, 69, 1], [4, 67, 2], [6, 66, 1], [7, 67, 1], [8, 69, 4], [12, 66, 1], [13, 67, 1], [14, 63, 1], [15, 62, 1],
  [16, 62, 2], [18, 66, 2], [20, 67, 1], [21, 69, 1], [22, 70, 2], [24, 69, 3], [28, 67, 1], [29, 66, 1], [30, 63, 2],
  [32, 74, 2], [34, 72, 1], [35, 70, 1], [36, 69, 2], [38, 70, 1], [39, 69, 1], [40, 67, 4], [44, 69, 1], [45, 70, 1], [46, 72, 2],
  [48, 70, 2], [50, 69, 1], [51, 67, 1], [52, 66, 2], [54, 63, 2], [56, 62, 6]];
const MEL2 = [[0, 74, 1], [1, 75, 1], [2, 74, 2], [6, 72, 1], [7, 70, 1], [8, 69, 2], [11, 70, 1], [12, 69, 1], [13, 67, 1], [14, 66, 2],
  [16, 67, 2], [18, 69, 2], [20, 70, 1], [21, 72, 1], [22, 74, 4], [28, 75, 1], [29, 74, 1], [30, 72, 2],
  [32, 69, 1], [33, 70, 1], [34, 69, 1], [35, 67, 1], [36, 66, 2], [38, 67, 2], [40, 63, 2], [42, 66, 2], [44, 67, 4],
  [48, 69, 2], [50, 67, 1], [51, 66, 1], [52, 63, 2], [54, 62, 2], [56, 62, 2], [58, 57, 2], [60, 62, 4]];
const BASS = [[0, 38, 2], [3, 38, 1], [6, 45, 1], [8, 38, 2], [11, 48, 1], [12, 46, 2], [14, 45, 2], [16, 38, 2], [19, 38, 1], [22, 45, 1], [24, 43, 2], [27, 42, 1], [28, 39, 2], [30, 38, 2]];
const PLUCK = [62, 66, 69, 74, 69, 66, 63, 66];
function kick(t) { osc('sine', 160, 42, t, 0.2, 0.9, AUD.music, 0.002); }
function clap(t) { nz(t, 0.13, 0.42, 'bandpass', 1700, 1200, 0.9, AUD.music); nz(t + 0.012, 0.09, 0.3, 'bandpass', 2100, 1500, 1, AUD.music); }
function hat(t, open) { nz(t, open ? 0.12 : 0.035, open ? 0.12 : 0.1, 'highpass', 7500, 0, 0.7, AUD.music); }
function doum(t) { osc('sine', 120, 70, t, 0.22, 0.45, AUD.music, 0.002); nz(t, 0.05, 0.12, 'lowpass', 600, 0, 0.6, AUD.music); }
function tek(t, soft) { nz(t, 0.045, soft ? 0.14 : 0.26, 'bandpass', 3600, 0, 3.5, AUD.music); }
function bass(t, m, len) {
  const c = AUD.ctx, o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
  o.type = 'square'; o.frequency.value = mtof(m); f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(240, t + len * STEP);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + len * STEP + 0.05);
  o.connect(f); f.connect(g); g.connect(AUD.music); o.start(t); o.stop(t + len * STEP + 0.1);
}
function lead(t, m, len) {
  const c = AUD.ctx, f = c.createBiquadFilter(), g = c.createGain(), l = c.createOscillator(), lg = c.createGain();
  f.type = 'lowpass'; f.frequency.value = 3000; f.Q.value = 2;
  l.frequency.value = 6; lg.gain.value = mtof(m) * 0.012; l.connect(lg);
  const d = len * STEP;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.085, t + 0.02); g.gain.setValueAtTime(0.07, t + Math.max(0.03, d - 0.04)); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.06);
  for (const [type, det] of [['sawtooth', 0], ['square', 6]]) {
    const o = c.createOscillator(); o.type = type; o.frequency.value = mtof(m); o.detune.value = det; lg.connect(o.frequency);
    o.connect(f); o.start(t); o.stop(t + d + 0.1);
  }
  // little grace-note slide into long notes, like a mizmar
  f.connect(g); g.connect(AUD.music); l.start(t); l.stop(t + d + 0.1);
}
function pluck(t, m) { osc('triangle', mtof(m), 0, t, 0.16, 0.12, AUD.music, 0.002); osc('sawtooth', mtof(m), 0, t, 0.06, 0.03, AUD.music, 0.002); }
function musicStep(i, t) {
  const st = i % 16, bar = Math.floor(i / 16), ph = bar % 8;
  if (st === 0 || st === 10 || (st === 7 && bar % 2)) kick(t);
  if (st === 4 || st === 12) clap(t);
  if (st % 2 === 0) hat(t, st === 14); else if (Math.random() < 0.3) hat(t + 0.005, false);
  if (st === 0 || st === 8) doum(t);
  if (st === 2 || st === 6 || st === 12 || st === 14) tek(t, st === 14);
  if (st === 15 && bar % 4 === 3) { tek(t, true); tek(t + STEP * 0.5, false); }
  const b2 = i % 32; for (const [s, m, l] of BASS) if (s === b2) bass(t, m, l);
  if (ph >= 1) { const mel = ph < 5 ? MEL : MEL2; const m4 = i % 64; for (const [s, m, l] of mel) if (s === m4) lead(t, m, l); }
  if (st % 4 === 2) pluck(t, PLUCK[(i >> 2) % PLUCK.length] + (ph >= 4 ? 12 : 0));
}
function musicStart() {
  if (!AUD.ctx) return;
  AUD.music.gain.cancelScheduledValues(AUD.ctx.currentTime); AUD.music.gain.setTargetAtTime(0.42, AUD.ctx.currentTime, 0.1);
  if (AUD.playing) return;
  AUD.playing = true; AUD.step = 0; AUD.next = AUD.ctx.currentTime + 0.08;
  clearInterval(AUD.timer);
  AUD.timer = setInterval(() => {
    if (!AUD.playing || !ok()) return;
    while (AUD.next < AUD.ctx.currentTime + 0.12) { musicStep(AUD.step, AUD.next); AUD.step++; AUD.next += STEP; }
  }, 25);
}
function musicStop() { AUD.playing = false; clearInterval(AUD.timer); }
function musicDuck(v) { if (AUD.music) AUD.music.gain.setTargetAtTime(v, AUD.ctx.currentTime, 0.2); }
