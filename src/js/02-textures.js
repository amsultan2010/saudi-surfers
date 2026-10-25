/* ---------- procedural textures (bright cartoon palette) ---------- */
const LINES = [
  { id: 1, name: 'Blue', c: '#1d9bf0', dk: '#0f6fb3', dest: 'OLAYA' },
  { id: 2, name: 'Red', c: '#ff4b3e', dk: '#c42a22', dest: 'KING SAUD UNI' },
  { id: 3, name: 'Orange', c: '#ff9a1f', dk: '#d06a00', dest: 'JEDDAH RD' },
  { id: 4, name: 'Yellow', c: '#ffcc1a', dk: '#d79a00', dest: 'AIRPORT' },
  { id: 5, name: 'Green', c: '#3cc45a', dk: '#23903c', dest: 'NATIONAL MUSEUM' },
  { id: 6, name: 'Purple', c: '#a35ce0', dk: '#7535ad', dest: 'KAFD' }
];
const AR_FONT = "'Lalezar','Geeza Pro','Noto Kufi Arabic',sans-serif";
const EN_FONT = "'Lilita One','Arial Rounded MT Bold','Trebuchet MS',sans-serif";
const TEX = {};

function drawTrainSide(g, W, H, L) {
  g.fillStyle = L.c; g.fillRect(0, 0, W, H);
  g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(0, 0, W, H * 0.12);
  g.fillStyle = L.dk; g.fillRect(0, H * 0.8, W, H * 0.2);
  g.fillStyle = '#ffffff'; g.fillRect(0, H * 0.66, W, H * 0.07);
  // windows
  for (let x = 30; x < W - 60; x += 120) {
    if (Math.abs(x + 45 - W * 0.25) < 90 || Math.abs(x + 45 - W * 0.75) < 90) continue;
    g.fillStyle = '#ffffff'; roundRect(g, x - 5, H * 0.17 - 5, 100, H * 0.4 + 10, 14); g.fill();
    g.fillStyle = '#2f6db5'; roundRect(g, x, H * 0.17, 90, H * 0.4, 10); g.fill();
    g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.moveTo(x + 10, H * 0.55); g.lineTo(x + 40, H * 0.19); g.lineTo(x + 58, H * 0.19); g.lineTo(x + 28, H * 0.55); g.fill();
  }
  // doors
  for (const dx of [0.25, 0.75]) {
    const x = dx * W;
    g.fillStyle = '#dfe6ee'; roundRect(g, x - 72, H * 0.1, 144, H * 0.84, 12); g.fill();
    g.strokeStyle = '#ffd21f'; g.lineWidth = 7; g.stroke();
    g.fillStyle = '#2f6db5'; roundRect(g, x - 58, H * 0.18, 48, H * 0.38, 8); g.fill(); roundRect(g, x + 10, H * 0.18, 48, H * 0.38, 8); g.fill();
    g.fillStyle = '#9aa7b6'; g.fillRect(x - 2, H * 0.1, 4, H * 0.84);
  }
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(W * 0.5, H * 0.38, 30, 0, TAU); g.fill();
  textBlock(g, String(L.id), W * 0.5, H * 0.39, `40px ${EN_FONT}`, L.dk);
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, 0, 8, H); g.fillRect(W - 8, 0, 8, H);
}
function drawTrainFront(g, W, H, L) {
  g.fillStyle = L.c; g.fillRect(0, 0, W, H);
  g.fillStyle = L.dk; g.fillRect(0, H * 0.8, W, H * 0.2);
  g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(0, 0, W, H * 0.1);
  // two big windscreens
  for (const x of [0.07, 0.53]) {
    g.fillStyle = '#ffffff'; roundRect(g, W * x - 5, H * 0.13 - 5, W * 0.4 + 10, H * 0.34 + 10, 14); g.fill();
    g.fillStyle = '#3d7fd0'; roundRect(g, W * x, H * 0.13, W * 0.4, H * 0.34, 10); g.fill();
    g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.moveTo(W * (x + 0.04), H * 0.44); g.lineTo(W * (x + 0.16), H * 0.15); g.lineTo(W * (x + 0.23), H * 0.15); g.lineTo(W * (x + 0.11), H * 0.44); g.fill();
  }
  g.fillStyle = '#1b1b24'; roundRect(g, W * 0.18, H * 0.52, W * 0.64, H * 0.1, 6); g.fill();
  textBlock(g, L.dest, W * 0.5, H * 0.575, `20px ${EN_FONT}`, '#ffb02e');
  g.fillStyle = '#fff6c2'; g.beginPath(); g.arc(W * 0.5, H * 0.72, 16, 0, TAU); g.fill();
  g.strokeStyle = '#555'; g.lineWidth = 5; g.stroke();
  for (const lx of [0.14, 0.86]) { g.fillStyle = '#ff3b2f'; g.beginPath(); g.arc(W * lx, H * 0.72, 11, 0, TAU); g.fill(); }
  g.fillStyle = '#2a2a33'; g.fillRect(W * 0.3, H * 0.86, W * 0.4, H * 0.08);
}
function drawTrainRoof(g, W, H) {
  g.fillStyle = '#8e95a3'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#a9b0bc'; g.fillRect(0, 0, W * 0.18, H); g.fillRect(W * 0.82, 0, W * 0.18, H);
  g.fillStyle = '#5d6370';
  for (let y = 18; y < H; y += 60) { roundRect(g, W * 0.32, y, W * 0.36, 26, 6); g.fill(); }
}
function roundRect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + h - r);
  g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
}

function buildTextures() {
  // Track bed: 8.6 m across (u) x 10 m along (v): warm gravel, chunky wooden sleepers
  TEX.track = canvasTex(512, 512, (g, W, H) => {
    g.fillStyle = '#b98266'; g.fillRect(0, 0, W, H);
    noise(g, W, H, 9000, ['#a06a52', '#cf9c80', '#94604a', '#dcb096', '#ad785f'], 0.7, 1.5, 4);
    const pxm = W / 8.6, pvm = H / 10;
    for (const lx of [-2.6, 0, 2.6]) {
      const cu = (lx + 4.3) * pxm;
      g.fillStyle = 'rgba(120,60,35,.22)'; g.fillRect(cu - 1.35 * pxm, 0, 2.7 * pxm, H);
      for (let k = 0; k < 14; k++) {
        const v = (k + 0.5) * (H / 14);
        g.fillStyle = 'rgba(70,30,15,.45)'; g.fillRect(cu - 1.25 * pxm + 3, v - 0.17 * pvm + 5, 2.5 * pxm, 0.36 * pvm);
        g.fillStyle = '#80492c'; g.fillRect(cu - 1.25 * pxm, v - 0.17 * pvm, 2.5 * pxm, 0.34 * pvm);
        g.fillStyle = '#a2643f'; g.fillRect(cu - 1.25 * pxm, v - 0.17 * pvm, 2.5 * pxm, 0.1 * pvm);
        g.fillStyle = 'rgba(60,25,10,.4)'; for (let q = 0; q < 3; q++) g.fillRect(cu - 1.1 * pxm + q * 0.8 * pxm, v - 0.02 * pvm, 0.5 * pxm, 3);
      }
    }
  });
  // Platform paving (tile = 4 m)
  TEX.paver = canvasTex(256, 256, (g, W, H) => {
    g.fillStyle = '#e59f6e'; g.fillRect(0, 0, W, H);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      g.fillStyle = (r + c) % 2 ? '#f7c99a' : '#f2b884'; g.fillRect(c * 64 + 3, r * 64 + 3, 58, 58);
      g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(c * 64 + 3, r * 64 + 3, 58, 6);
    }
  });
  // Metro car atlas per line: side (top half), front (bottom-left), roof (bottom strip)
  TEX.train = {};
  for (const L of LINES) {
    TEX.train[L.id] = canvasTex(1024, 512, (g) => {
      g.save(); drawTrainSide(g, 1024, 256, L); g.restore();
      g.save(); g.translate(0, 256); drawTrainFront(g, 256, 256, L); g.restore();
      g.save(); g.translate(256, 256); drawTrainRoof(g, 128, 256); g.restore();
    }, false);
  }
  // Coin face: gold with an embossed star
  TEX.coin = canvasTex(128, 128, (g, W, H) => {
    const gr = g.createRadialGradient(50, 44, 6, 64, 64, 64); gr.addColorStop(0, '#fff3a0'); gr.addColorStop(0.55, '#ffcc1f'); gr.addColorStop(1, '#f39a00');
    g.fillStyle = '#e88a00'; g.fillRect(0, 0, W, H);
    g.fillStyle = gr; g.beginPath(); g.arc(64, 64, 62, 0, TAU); g.fill();
    g.strokeStyle = '#ffe36b'; g.lineWidth = 6; g.beginPath(); g.arc(64, 64, 48, 0, TAU); g.stroke();
    const star = (r1, r2, col) => { g.fillStyle = col; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? r2 : r1; g.lineTo(64 + Math.cos(a) * r, 66 + Math.sin(a) * r); } g.closePath(); g.fill(); };
    star(34, 15, '#e08600'); star(30, 13, '#ffd84a');
  }, false);
  // Barriers
  TEX.lowBoard = canvasTex(256, 96, (g, W, H) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#ff2d2d';
    for (let x = -64; x < W + 64; x += 64) { g.beginPath(); g.moveTo(x, H); g.lineTo(x + 32, H * 0.2); g.lineTo(x + 64, H); g.lineTo(x + 46, H); g.lineTo(x + 32, H * 0.55); g.lineTo(x + 18, H); g.fill(); }
    g.fillRect(0, 0, W, H * 0.16);
    g.strokeStyle = '#7a1010'; g.lineWidth = 6; g.strokeRect(3, 3, W - 6, H - 6);
  });
  TEX.stripeYK = canvasTex(256, 64, (g, W, H) => {
    g.fillStyle = '#ffd21f'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#26203a'; for (let x = -H; x < W + H; x += 64) { g.beginPath(); g.moveTo(x, H); g.lineTo(x + 32, H); g.lineTo(x + 32 + H, 0); g.lineTo(x + H, 0); g.fill(); }
  });
  TEX.duckSign = canvasTex(256, 128, (g, W, H) => {
    g.fillStyle = '#ff3b30'; roundRect(g, 4, 4, W - 8, H - 8, 18); g.fill();
    g.strokeStyle = '#ffffff'; g.lineWidth = 8; g.stroke();
    textBlock(g, 'انخفض', W * 0.5, H * 0.38, `52px ${AR_FONT}`, '#ffffff');
    textBlock(g, '▼ DUCK ▼', W * 0.5, H * 0.76, `30px ${EN_FONT}`, '#ffffff');
  }, false);
  TEX.shemagh = canvasTex(64, 64, (g, W, H) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#e0162b'; for (let i = 0; i < 8; i++) { g.fillRect(i * 8 + 3, 0, 2, H); g.fillRect(0, i * 8 + 3, W, 2); }
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) g.fillRect(i * 8 + 2, j * 8 + 2, 4, 4);
  });
  TEX.shadow = canvasTex(64, 64, (g) => {
    const gr = g.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, 'rgba(60,20,10,.5)'); gr.addColorStop(1, 'rgba(60,20,10,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  }, false);
  TEX.glow = canvasTex(128, 128, (g) => {
    const gr = g.createRadialGradient(64, 64, 4, 64, 64, 63); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,245,210,.8)'); gr.addColorStop(1, 'rgba(255,220,150,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  }, false);
  // Tower glass (shared by background towers)
  const glass = (key, base, hi, frame) => {
    TEX[key] = canvasTex(256, 256, (g, W, H) => {
      const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, hi); gr.addColorStop(0.55, base); gr.addColorStop(1, hi);
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.moveTo(0, H * 0.7); g.lineTo(W * 0.5, 0); g.lineTo(W * 0.72, 0); g.lineTo(0, H); g.fill();
      g.fillStyle = frame;
      for (let i = 0; i <= 8; i++) g.fillRect(i * 32 - 2, 0, 4, H);
      for (let r = 0; r < 4; r++) g.fillRect(0, r * 64 + 56, W, 8);
    });
  };
  glass('fGlassBlue', '#4aa3e8', '#a9dcff', '#e9f6ff');
  glass('fGlassTeal', '#2fc0b4', '#a2f0e6', '#effffb');
  glass('fGlassDark', '#3a5d92', '#7fa6d8', '#dfeaff');
  glass('fGlassBronze', '#d9a35a', '#ffe0a8', '#fff3dc');
  glass('fGlassSilver', '#9fb2c8', '#eef4fa', '#ffffff');
  glass('fGlassSky', '#7fc0ee', '#e6f6ff', '#ffffff');
  for (const k of ['fGlassBlue', 'fGlassTeal', 'fGlassDark', 'fGlassBronze', 'fGlassSilver', 'fGlassSky']) TEX[k + 'N'] = TEX[k];
}

/* near-street building facade: art in the top 7/8, flat wall patch in the bottom 1/8 */
const SHOPS = [['قهوة', 'COFFEE'], ['تمور', 'DATES'], ['بقالة', 'GROCERY'], ['شاورما', 'SHAWARMA'], ['حلويات', 'SWEETS'], ['عطور', 'PERFUME'],
  ['جوالات', 'MOBILES'], ['مخبز', 'BAKERY'], ['كرك', 'KARAK TEA'], ['بخور', 'OUD'], ['مطعم', 'RESTAURANT'], ['عصير', 'JUICE']];
const WALLS = [
  { wall: '#f6c48a', trim: '#d9894a', dark: '#b8693a' },
  { wall: '#ef8d68', trim: '#c95f43', dark: '#9e4530' },
  { wall: '#fbe3bd', trim: '#dcae70', dark: '#b78845' },
  { wall: '#f6a6a0', trim: '#d57471', dark: '#a95250' },
  { wall: '#ffd27a', trim: '#e59f2e', dark: '#b8781a' },
  { wall: '#f3b37c', trim: '#c97c47', dark: '#9c5a2e' },
  { wall: '#a8dccf', trim: '#5fb3a1', dark: '#3c8a79' }
];
const SIGN_COLS = ['#0b8a4a', '#1d6fd1', '#e53935', '#7b3fbf', '#ff8f00', '#00897b'];
function facadeTexture(wM, hM, pal, shop, style) {
  const W = 512, H = 512, AH = 448;
  return canvasTex(W, H, (g) => {
    g.fillStyle = pal.wall; g.fillRect(0, 0, W, H);
    const pm = W / wM, py = AH / hM;
    // ground floor shop (4.5 m)
    const gf = 4.5 * py;
    g.fillStyle = pal.trim; g.fillRect(0, AH - gf - 10, W, 12);
    const doorW = Math.min(W * 0.62, 9 * pm), dx = (W - doorW) / 2;
    g.fillStyle = '#3b2a3f'; g.fillRect(dx, AH - gf + 0.9 * py, doorW, gf - 0.9 * py);
    g.fillStyle = '#ffd98a'; g.fillRect(dx + 8, AH - gf + 1.2 * py, doorW - 16, (gf - 1.2 * py) * 0.55);
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(dx + 8, AH - gf + 1.2 * py, doorW - 16, 6);
    for (let k = 1; k < 4; k++) { g.fillStyle = '#8d5a3b'; g.fillRect(dx + k * doorW / 4 - 2, AH - gf + 1.2 * py, 4, gf - 1.2 * py); }
    // shop sign
    const sc = SIGN_COLS[(shop.length + wM | 0) % SIGN_COLS.length];
    g.fillStyle = sc; roundRect(g, dx - 4, AH - gf - 6 + 0.05 * py, doorW + 8, 0.95 * py, 10); g.fill();
    g.strokeStyle = '#ffffff'; g.lineWidth = 5; g.stroke();
    textBlock(g, shop[0], W / 2 - doorW * 0.18, AH - gf + 0.42 * py, `${Math.min(64, 0.8 * py) | 0}px ${AR_FONT}`, '#ffffff');
    textBlock(g, shop[1], W / 2 + doorW * 0.26, AH - gf + 0.48 * py, `${Math.min(34, 0.42 * py) | 0}px ${EN_FONT}`, '#ffe066');
    // upper floors
    const floors = Math.max(1, Math.floor((hM - 4.5 - 1.2) / 3.4));
    const bays = Math.max(2, Math.round(wM / 3.4));
    for (let f = 0; f < floors; f++) {
      const y0 = AH - gf - (f + 1) * 3.4 * py;
      g.fillStyle = 'rgba(0,0,0,.06)'; g.fillRect(0, y0 + 3.2 * py, W, 4);
      for (let b = 0; b < bays; b++) {
        const cx = (b + 0.5) * W / bays, ww = Math.min(1.5 * pm, W / bays * 0.6), wh = 2.0 * py, wy = y0 + 0.7 * py;
        if (style === 'mash' && (b + f) % 2 === 0) {
          g.fillStyle = '#7a4524'; roundRect(g, cx - ww * 0.65, wy - 6, ww * 1.3, wh + 14, 6); g.fill();
          g.strokeStyle = '#c98a4f'; g.lineWidth = 3;
          for (let k = -wh; k < ww * 1.3; k += 10) { g.beginPath(); g.moveTo(cx - ww * 0.65 + k, wy); g.lineTo(cx - ww * 0.65 + k + wh, wy + wh); g.stroke(); g.beginPath(); g.moveTo(cx - ww * 0.65 + k + wh, wy); g.lineTo(cx - ww * 0.65 + k, wy + wh); g.stroke(); }
          g.fillStyle = '#5b3018'; g.fillRect(cx - ww * 0.7, wy + wh + 2, ww * 1.4, 10);
        } else if (style === 'arch') {
          g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(cx - ww / 2 - 6, wy + wh + 4); g.lineTo(cx - ww / 2 - 6, wy + ww / 2); g.arc(cx, wy + ww / 2, ww / 2 + 6, Math.PI, 0); g.lineTo(cx + ww / 2 + 6, wy + wh + 4); g.fill();
          g.fillStyle = '#3f86d6'; g.beginPath(); g.moveTo(cx - ww / 2, wy + wh); g.lineTo(cx - ww / 2, wy + ww / 2); g.arc(cx, wy + ww / 2, ww / 2, Math.PI, 0); g.lineTo(cx + ww / 2, wy + wh); g.fill();
          g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(cx - ww / 2 + 5, wy + ww / 2, 6, wh - ww / 2 - 4);
        } else {
          g.fillStyle = pal.dark; g.fillRect(cx - ww / 2 - 6, wy - 6, ww + 12, wh + 12);
          g.fillStyle = '#2f73c4'; g.fillRect(cx - ww / 2, wy, ww, wh);
          g.fillStyle = '#25a18e'; g.fillRect(cx - ww / 2 - 14, wy, 12, wh); g.fillRect(cx + ww / 2 + 2, wy, 12, wh);
          g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(cx - ww / 2 + 4, wy + 4, ww * 0.3, 6);
        }
      }
    }
    // Najdi frieze under the parapet
    const ty = AH - gf - floors * 3.4 * py - 2;
    g.fillStyle = pal.trim; g.fillRect(0, 0, W, Math.max(ty, 8));
    g.fillStyle = pal.dark;
    for (let x = 0; x < W; x += 28) { g.beginPath(); g.moveTo(x, ty); g.lineTo(x + 14, ty - 18); g.lineTo(x + 28, ty); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(0, ty, W, 4);
    noise(g, W, AH, 900, ['rgba(0,0,0,.05)', 'rgba(255,255,255,.08)'], 0.5, 1, 3);
    g.fillStyle = pal.wall; g.fillRect(0, AH, W, H - AH);
  }, false);
}

const SIGN_TEXTS = [
  ['طريق الملك فهد', 'King Fahd Rd'], ['العليا', 'Olaya'], ['المركز المالي', 'KAFD'], ['الدائري الشمالي', 'Northern Ring Rd'],
  ['طريق العروبة', 'Al Urubah Rd'], ['طريق التخصصي', 'Takhassusi St'], ['الدرعية', 'Diriyah'], ['مطار الملك خالد', 'KKIA Airport']
];
function signTex(i) {
  const [ar, en] = SIGN_TEXTS[i % SIGN_TEXTS.length];
  return canvasTex(1024, 320, (g, W, H) => {
    g.fillStyle = '#0d8a4a'; roundRect(g, 6, 6, W - 12, H - 12, 34); g.fill();
    g.strokeStyle = '#ffffff'; g.lineWidth = 14; roundRect(g, 24, 24, W - 48, H - 48, 24); g.stroke();
    textBlock(g, ar, W * 0.5, H * 0.38, `118px ${AR_FONT}`, '#ffffff');
    textBlock(g, en.toUpperCase(), W * 0.5, H * 0.74, `64px ${EN_FONT}`, '#ffe066');
  }, false);
}
function bridgeTex(ar, en) {
  return canvasTex(1024, 128, (g, W, H) => {
    g.fillStyle = '#f2b06a'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#c66a2c';
    for (let x = 0; x < W; x += 28) { g.beginPath(); g.moveTo(x, H * 0.24); g.lineTo(x + 14, 4); g.lineTo(x + 28, H * 0.24); g.fill(); }
    g.fillStyle = '#0d8a4a'; roundRect(g, W * 0.28, H * 0.32, W * 0.44, H * 0.58, 12); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 5; g.stroke();
    textBlock(g, ar + '  ·  ' + en.toUpperCase(), W * 0.5, H * 0.62, `40px ${EN_FONT}`, '#fff');
  }, false);
}

/* ---------- open-road and landmark textures ---------- */
function buildRoadTextures() {
  // 3-lane road 11 m wide (u) x 10 m (v); inner edge at u=0
  TEX.asphalt = canvasTex(512, 512, (g, W, H) => {
    g.fillStyle = '#76767f'; g.fillRect(0, 0, W, H);
    noise(g, W, H, 9000, ['#6a6a73', '#83838b', '#8d8c92', '#5f5f68'], 0.5, 1, 3);
    const pxm = W / 11, pvm = H / 10;
    g.fillStyle = '#ffd21f'; g.fillRect(0.3 * pxm, 0, 0.18 * pxm, H);
    g.fillStyle = '#f7f7f2'; g.fillRect(10.5 * pxm, 0, 0.18 * pxm, H);
    for (const u of [3.65, 7.3]) g.fillRect(u * pxm - 3, 1 * pvm, 0.16 * pxm, 3 * pvm);
    g.fillStyle = 'rgba(0,0,0,.07)'; for (const u of [1.2, 4.9, 8.5]) g.fillRect(u * pxm, 0, 1.0 * pxm, H);
  });
  TEX.sand = canvasTex(256, 256, (g, W, H) => {
    g.fillStyle = '#cfa874'; g.fillRect(0, 0, W, H);
    noise(g, W, H, 6000, ['#c29a66', '#d9b88a', '#b8905e', '#e0c49a'], 0.6, 1, 3);
  });
  TEX.median = canvasTex(256, 256, (g, W, H) => {
    g.fillStyle = '#4f9a3c'; g.fillRect(0, 0, W, H);
    noise(g, W, H, 5000, ['#3f8a32', '#62ad49', '#2f7a2a', '#79bf58'], 0.7, 1, 4);
  });
  // Kingdom Centre: silver glass reflecting the sky, darker toward the base
  TEX.kingdom = canvasTex(512, 1024, (g, W, H) => {
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, '#dfe9f2'); gr.addColorStop(0.3, '#b9cbdc'); gr.addColorStop(0.55, '#f0d3b0'); gr.addColorStop(0.75, '#8fa6bd'); gr.addColorStop(1, '#4f6278');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const gx = g.createLinearGradient(0, 0, W, 0); gx.addColorStop(0, 'rgba(40,60,90,.35)'); gx.addColorStop(0.45, 'rgba(255,255,255,.18)'); gx.addColorStop(0.55, 'rgba(255,255,255,.32)'); gx.addColorStop(1, 'rgba(40,60,90,.4)');
    g.fillStyle = gx; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,255,255,.22)'; for (let x = 0; x < W; x += 8) g.fillRect(x, 0, 1, H);
    g.fillStyle = 'rgba(30,40,60,.18)'; for (let y = 0; y < H; y += 6) g.fillRect(0, y, W, 1);
  });
  // Al Faisaliah: horizontal aluminium louvres with big X braces on each face (one face per quarter)
  TEX.faisaliah = canvasTex(1024, 1024, (g, W, H) => {
    g.fillStyle = '#c9c6bd'; g.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 9) { g.fillStyle = (y / 9) % 2 ? '#8f969f' : '#e3ded2'; g.fillRect(0, y, W, 5); }
    const fw = W / 4;
    g.strokeStyle = '#f4f1ea'; g.lineWidth = 9;
    for (let f = 0; f < 4; f++) {
      const x0 = f * fw;
      for (let k = 0; k < 5; k++) {
        const y0 = H - (k + 1) * H / 5, y1 = H - k * H / 5;
        g.beginPath(); g.moveTo(x0 + 6, y1); g.lineTo(x0 + fw / 2, y0); g.lineTo(x0 + fw - 6, y1); g.stroke();
        g.beginPath(); g.moveTo(x0 + fw / 2, y0); g.lineTo(x0 + fw / 2, y1); g.stroke();
      }
      g.fillStyle = '#eeeae1'; g.fillRect(x0, 0, 10, H); g.fillRect(x0 + fw - 10, 0, 10, H);
    }
  });
  // PIF tower: dark glass with large diamond tracery
  TEX.pif = canvasTex(512, 1024, (g, W, H) => {
    const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, '#2b3f5c'); gr.addColorStop(0.5, '#5a7896'); gr.addColorStop(1, '#2b3f5c');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,255,255,.08)'; for (let y = 0; y < H; y += 8) g.fillRect(0, y, W, 2);
    g.strokeStyle = '#c9d6e3'; g.lineWidth = 6;
    const dh = H / 4;
    for (let k = 0; k < 4; k++) { const y0 = k * dh; g.beginPath(); g.moveTo(W / 2, y0); g.lineTo(W, y0 + dh / 2); g.lineTo(W / 2, y0 + dh); g.lineTo(0, y0 + dh / 2); g.closePath(); g.stroke(); }
  });
  TEX.lattice = canvasTex(256, 512, (g, W, H) => {
    g.fillStyle = '#5e7a96'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#f5f3ee';
    for (let y = 0; y < H; y += 32) for (let x = 0; x < W; x += 32) {
      const o = (y / 32) % 2 ? 16 : 0;
      g.fillRect(x + o, y, 22, 6); g.fillRect(x + o, y, 6, 26); if (Math.random() < 0.5) g.fillRect(x + o + 10, y + 12, 18, 8);
    }
  });
  TEX.fins = canvasTex(256, 256, (g, W, H) => {
    g.fillStyle = '#7d6b57'; g.fillRect(0, 0, W, H);
    for (let x = 0; x < W; x += 16) { g.fillStyle = '#e6d6bd'; g.fillRect(x, 0, 9, H); g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(x + 9, 0, 2, H); }
  });
  TEX.majdoul = canvasTex(512, 512, (g, W, H) => {
    const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, '#5b9fd6'); gr.addColorStop(0.5, '#a9d4f2'); gr.addColorStop(1, '#4a8cc6');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 16) { g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(0, y, W, 4); }
  });
}
