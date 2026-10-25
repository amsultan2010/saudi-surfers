'use strict';
/* ---------- math + helpers ---------- */
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const chance = (p) => Math.random() < p;
const smooth = (t) => t * t * (3 - 2 * t);
const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));
const moveTo = (a, b, step) => (Math.abs(b - a) <= step ? b : a + Math.sign(b - a) * step);

const LS = {
  get(k, d) { try { const v = localStorage.getItem('rr_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('rr_' + k, JSON.stringify(v)); } catch (e) {} }
};

/* ---------- geometry building (vertex coloured, mergeable) ---------- */
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
function xf(g, t) {
  if (!t) return g;
  _e.set(t.rx || 0, t.ry || 0, t.rz || 0);
  _q.setFromEuler(_e);
  _v.set(t.x || 0, t.y || 0, t.z || 0);
  _s.set(t.sx == null ? 1 : t.sx, t.sy == null ? 1 : t.sy, t.sz == null ? 1 : t.sz);
  _m4.compose(_v, _q, _s);
  g.applyMatrix4(_m4);
  return g;
}
function tint(g, color) {
  if (g.index) g = g.toNonIndexed();
  const c = new THREE.Color(color);
  const n = g.attributes.position.count;
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return g;
}
// part constructors: colour + transform
const P = {
  box: (w, h, d, col, t) => xf(tint(new THREE.BoxGeometry(w, h, d), col), t),
  cyl: (rt, rb, h, seg, col, t) => xf(tint(new THREE.CylinderGeometry(rt, rb, h, seg), col), t),
  sph: (r, col, t, ws = 10, hs = 8) => xf(tint(new THREE.SphereGeometry(r, ws, hs), col), t),
  cone: (r, h, seg, col, t) => xf(tint(new THREE.ConeGeometry(r, h, seg), col), t),
  tor: (r, tube, rs, ts, arc, col, t) => xf(tint(new THREE.TorusGeometry(r, tube, rs, ts, arc), col), t),
  geo: (g, col, t) => xf(tint(g, col), t)
};
function merge(list) {
  list = list.map((g) => (g.index ? g.toNonIndexed() : g));
  let total = 0;
  for (const g of list) total += g.attributes.position.count;
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), col = new Float32Array(total * 3), uv = new Float32Array(total * 2);
  let o = 0;
  for (const g of list) {
    const n = g.attributes.position.count;
    pos.set(g.attributes.position.array, o * 3);
    if (g.attributes.normal) nor.set(g.attributes.normal.array, o * 3);
    if (g.attributes.color) col.set(g.attributes.color.array, o * 3); else col.fill(1, o * 3, (o + n) * 3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2);
    o += n;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.computeBoundingSphere();
  return out;
}

/* ---------- materials ---------- */
const TOON_GRAD = (() => {
  const d = new Uint8Array([112, 112, 112, 255, 160, 160, 160, 255, 205, 205, 205, 255, 240, 240, 240, 255]);
  const t = new THREE.DataTexture(d, 4, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true;
  return t;
})();
const NIGHT_MATS = []; // materials whose emissive brightens at night: {m, base}
function toonVC(opts = {}) { return new THREE.MeshToonMaterial(Object.assign({ vertexColors: true, gradientMap: TOON_GRAD }, opts)); }
function lambVC(opts = {}) { return new THREE.MeshLambertMaterial(Object.assign({ vertexColors: true }, opts)); }
function nightGlow(m, strength = 1) { NIGHT_MATS.push({ m, s: strength }); return m; }

/* ---------- canvas textures ---------- */
function canvasTex(w, h, draw, repeat = true) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}
function noise(g, w, h, n, colors, a0 = 0.5, s0 = 1, s1 = 3) {
  for (let i = 0; i < n; i++) {
    g.globalAlpha = a0 * Math.random() + 0.15;
    g.fillStyle = colors[(Math.random() * colors.length) | 0];
    const s = s0 + Math.random() * (s1 - s0);
    g.fillRect(Math.random() * w, Math.random() * h, s, s);
  }
  g.globalAlpha = 1;
}
// Box with UVs scaled to real metres so a repeating facade texture keeps its window size.
function boxScaledUV(w, h, d, unitX, unitY) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]]; // +x -x +y -y +z -z
  for (let f = 0; f < 6; f++) {
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      if (f === 2 || f === 3) { uv.setXY(i, uv.getX(i) * 0.02, uv.getY(i) * 0.02); continue; }
      uv.setXY(i, uv.getX(i) * dims[f][0] / unitX, uv.getY(i) * dims[f][1] / unitY);
    }
  }
  uv.needsUpdate = true;
  return g;
}
function textBlock(g, txt, x, y, font, color, align = 'center', stroke = null, sw = 0) {
  g.font = font; g.textAlign = align; g.textBaseline = 'middle';
  if (stroke) { g.lineWidth = sw; g.strokeStyle = stroke; g.lineJoin = 'round'; g.strokeText(txt, x, y); }
  g.fillStyle = color; g.fillText(txt, x, y);
}
