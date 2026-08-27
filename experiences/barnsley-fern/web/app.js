/* Barnsley's Fern: an ambient visualization for Footron displays.
 *
 * The chaos game. One point, four affine maps, and a weighted die: each
 * throw picks a map, the map moves the point, the landing spot is marked.
 * A few million throws in, the marks are a fern. Points are tinted by the
 * map that placed them, so the self-similarity is visible in the color:
 * the two big leaflets are entire ferns squashed into one leaf.
 */

const QS = (typeof location !== 'undefined' && location.search) || '';
const PREFILL = /[?&]prefill/.test(QS);

const cv = document.getElementById('c');
const ctx = cv.getContext('2d');

let W = 0, H = 0, DPR = 1;

/* ---------- shared helpers ---------- */

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function fmt(n) {
  return Math.round(n).toLocaleString('en-US');
}

/* ---------- the four maps ---------- */
/* Each map is  (x, y) -> (a*x + b*y + e,  c*x + d*y + f)  and is applied with
 * probability p. These are Barnsley's original coefficients: f2 shrinks the
 * whole fern and tips it slightly, f3 and f4 fold a whole fern into the two
 * bottom leaflets, and f1 -- one throw in a hundred -- is the stem. */

const BASE = [
  { key: 'f₁', name: 'Stem',          p: 0.01, m: [ 0.00,  0.00,  0.00, 0.16, 0, 0.00], rgb: [ 96,  72,  40] },
  { key: 'f₂', name: 'Whole fern, shrunk', p: 0.85, m: [ 0.85,  0.04, -0.04, 0.85, 0, 1.60], rgb: [ 26,  94,  60] },
  { key: 'f₃', name: 'Left leaflet',  p: 0.07, m: [ 0.20, -0.26,  0.23, 0.22, 0, 1.60], rgb: [ 17, 106, 128] },
  { key: 'f₄', name: 'Right leaflet', p: 0.07, m: [-0.15,  0.28,  0.26, 0.24, 0, 0.44], rgb: [169, 118,  31] },
];

const TARGET = 7000000;   // points before the picture is called finished
const RATE = 178000;      // points plotted per second while it draws
const SKETCH = 26000;     // points drawn immediately while a knob is dragged

const F = {
  maps: null, cum: null,
  gw: 0, gh: 0, fw: 0, fh: 0, ink: null, img: null, data: null, off: null, offCtx: null,
  tag: null, touched: null, frame: 0, drawStart: 0, flat: null, rgbf: null,
  xmin: 0, xspan: 1, ymin: 0, yspan: 1,
  rect: { x: 0, y: 0, w: 1, h: 1 }, iw: 1, ih: 1,
  x: 0, y: 0, total: 0, per: [0, 0, 0, 0], maxC: 1,
  refLog: 1, refAt: 1, owed: 0, done: false,
  walk: { x: 0, y: 0, mi: 1, t: 0, trail: [] },
};

/* The knobs. Rather than 24 loose numbers, each map is reached through the
 * handful of parameters that change the plant: how far the shrink-map turns,
 * how hard it shrinks, how the two leaflets are twisted and sized, and how
 * often the die picks the body over the leaflets. Every knob is applied to
 * Barnsley's matrix, so the legend shows the real coefficients moving. */

const KNOBS = [
  { key: 'turn2', label: 'Stem curl', note: 'turns f\u2082',
    min: -18, max: 18, step: 0.25, def: 0,
    show: v => (v >= 0 ? '+' : '\u2212') + Math.abs(v).toFixed(2) + '\u00b0' },
  { key: 'scale2', label: 'Shrink', note: 'scales f\u2082 \u2014 how many leaflets fit',
    min: 0.88, max: 1.09, step: 0.002, def: 1,
    show: v => (0.85085 * v).toFixed(3) + '\u00d7' },
  { key: 'twistLeaf', label: 'Leaflet twist', note: 'turns f\u2083 and f\u2084',
    min: -50, max: 50, step: 0.5, def: 0,
    show: v => (v >= 0 ? '+' : '\u2212') + Math.abs(v).toFixed(1) + '\u00b0' },
  { key: 'scaleLeaf', label: 'Leaflet size', note: 'scales f\u2083 and f\u2084',
    min: 0.5, max: 1.7, step: 0.01, def: 1,
    show: v => v.toFixed(2) + '\u00d7' },
  { key: 'p2', label: 'Dice weight', note: 'odds of f\u2082 against the leaflets',
    min: 0.62, max: 0.94, step: 0.002, def: 0.85,
    show: v => 'p = ' + v.toFixed(2) },
];

const PAR = {};
KNOBS.forEach(k => { PAR[k.key] = k.def; });

function resetParams() { KNOBS.forEach(k => { PAR[k.key] = k.def; }); }

function randomParams() {
  KNOBS.forEach(k => {
    // pull toward the middle of each range so a random plant still reads as a fern
    const t = (Math.random() + Math.random() + Math.random()) / 3;
    const v = k.min + t * (k.max - k.min);
    PAR[k.key] = Math.round(v / k.step) * k.step;
  });
}

// rotate a linear part by theta and scale it. Rotation leaves the singular
// values alone, so as long as the scale stays inside its slider the map is
// still a contraction and the walk still converges to something.
function bend(m, deg, scale) {
  const th = deg * Math.PI / 180, cs = Math.cos(th), sn = Math.sin(th);
  const [a, b, c, d, e, f] = m;
  return [
    scale * (cs * a - sn * c), scale * (cs * b - sn * d),
    scale * (sn * a + cs * c), scale * (sn * b + cs * d),
    e, f,
  ];
}

// Barnsley's four maps as bent by the current knob settings.
function makeMaps() {
  const leaf = (1 - BASE[0].p - PAR.p2) / 2;
  return BASE.map((src, i) => {
    let m = src.m, p = src.p;
    if (i === 1) { m = bend(m, PAR.turn2, PAR.scale2); p = PAR.p2; }
    else if (i >= 2) { m = bend(m, PAR.twistLeaf, PAR.scaleLeaf); p = leaf; }
    return { key: src.key, name: src.name, p: p, m: m.slice(), rgb: src.rgb };
  });
}

function paramsAreDefault() {
  return KNOBS.every(k => Math.abs(PAR[k.key] - k.def) < 1e-9);
}

function pickMap(maps, cum) {
  const r = Math.random();
  let i = 0;
  while (i < 3 && r >= cum[i]) i++;
  return i;
}

// Where does this set of maps actually live? Sampled, so bent coefficients
// still get framed correctly instead of running off the sheet.
function measure(maps, cum, samples) {
  let x = 0, y = 0, xlo = 1e9, xhi = -1e9, ylo = 1e9, yhi = -1e9;
  for (let i = 0; i < (samples || 30000); i++) {
    const m = maps[pickMap(maps, cum)].m;
    const nx = m[0] * x + m[1] * y + m[4];
    y = m[2] * x + m[3] * y + m[5];
    x = nx;
    if (i < 30) continue;
    if (x < xlo) xlo = x; if (x > xhi) xhi = x;
    if (y < ylo) ylo = y; if (y > yhi) yhi = y;
  }
  const px = (xhi - xlo) * 0.03, py = (yhi - ylo) * 0.02;
  return { xmin: xlo - px, xspan: (xhi - xlo) + 2 * px, ymin: ylo - py, yspan: (yhi - ylo) + 2 * py };
}

/* ---------- accumulation buffer ---------- */
/* Four counts per pixel -- one per map -- tone-mapped to ink. The counts are
 * interleaved (stride 4) so a pixel's four numbers share a cache line, which
 * matters when a fresh draw touches millions of cold pixels.
 *
 * Only pixels touched this frame are re-shaded, and only the box they moved
 * inside is uploaded. The whole buffer is re-shaded when the densest pixel
 * outgrows the normalization it was drawn with.
 *
 * The grid is allocated once per window size and never on a knob change: a
 * bent fern gets a different sub-rectangle of the same buffer, and one `tag`
 * per pixel carries both "written during this draw" and "written this frame",
 * so restarting a draw costs a counter bump instead of five array-wide fills.
 */

function allocGrid() {
  const diag = Math.hypot(W * BAND.w, H * BAND.h) * DPR;
  const gw = Math.max(32, Math.min(1200, Math.round(diag * 0.62)));
  const gh = Math.max(64, Math.min(2000, Math.round(diag)));
  if (gw === F.gw && gh === F.gh) return;
  F.gw = gw; F.gh = gh;
  const n = gw * gh;
  F.ink = new Float32Array(n * 4);
  F.tag = new Int32Array(n);
  F.touched = new Int32Array(262144);
  F.off = document.createElement('canvas');
  F.off.width = gw; F.off.height = gh;
  F.offCtx = F.off.getContext('2d');
  F.img = F.offCtx.createImageData(gw, gh);
  F.data = F.img.data;
  F.frame = 0; F.drawStart = 0;
}

/* The fern is tilted: it grows out of the lower left towards the upper right,
 * in a block at the middle of the sheet, with the writing in the corners
 * around it. BAND is that block as a fraction of the window -- the buffer, the
 * screen box and the CSS that keeps the text clear of it all read from the
 * same numbers. ROT is the tilt, clockwise from upright, so 0 stands the fern
 * up and 90 lays it on its side. */
const BAND = { top: 0.185, h: 0.63, w: 0.46 };
const ROT = 46;
const ROT_C = Math.cos(ROT * Math.PI / 180);
const ROT_S = Math.sin(ROT * Math.PI / 180);

/* Screen box for the tilted fern, plus the largest sub-rectangle of the grid
 * with the same shape. The fern is still rasterized upright -- only the
 * compositing and the walk overlay know about the tilt -- so this sizes the
 * upright picture (iw x ih) such that its rotated bounding box fits the block.
 * Called on every reset; allocates nothing. */
function layout() {
  const boxH = H * BAND.h, boxW = W * BAND.w;
  const c = Math.abs(ROT_C), sn = Math.abs(ROT_S);
  // upright, the fern is ih tall and iw = ih * (xspan/yspan) wide
  let ih = 1, iw = F.xspan / F.yspan;
  // ... and tilted it needs this much room, so scale to whichever axis binds
  const bw = iw * c + ih * sn, bh = iw * sn + ih * c;
  const k = Math.min(boxW / bw, boxH / bh);
  iw *= k; ih *= k;
  F.iw = iw; F.ih = ih;
  F.rect = {
    x: W * 0.5 - bw * k / 2,
    y: H * BAND.top + (boxH - bh * k) / 2,
    w: bw * k, h: bh * k,
  };

  const aspect = iw / ih;            // buffer is still upright: xspan / yspan
  let fh = F.gh, fw = Math.round(F.gh * aspect);
  if (fw > F.gw) { fw = F.gw; fh = Math.round(F.gw / aspect); }
  F.fw = Math.max(8, fw); F.fh = Math.max(8, fh);
}

/* The ink curve depends only on a pixel's total count, so it lives in a table:
 * lutA is the alpha, lutK the darkening. Rebuilt whenever the normalization
 * moves, which is far rarer than the millions of pixel shades between. */
const LUTN = 8192;
const lutA = new Float32Array(LUTN + 1);
const lutK = new Float32Array(LUTN + 1);

function buildLut(refLog) {
  F.refLog = refLog;
  for (let c = 0; c <= LUTN; c++) {
    let t = Math.log1p(c) / refLog;
    if (t > 1) t = 1;
    lutA[c] = (0.12 + 0.88 * Math.pow(t, 0.72)) * 255;
    lutK[c] = 1 - 0.3 * t;   // ink deepens where the walk keeps coming back
  }
  lutA[0] = 0;
}

function shade(i) {
  const o = i * 4;
  const D = F.data;
  if (F.tag[i] < F.drawStart) { D[o + 3] = 0; return; }   // left over from an earlier draw
  const A = F.ink;
  const c0 = A[o], c1 = A[o + 1], c2 = A[o + 2], c3 = A[o + 3];
  const c = c0 + c1 + c2 + c3;
  if (c === 0) { D[o + 3] = 0; return; }
  const q = c < LUTN ? c : LUTN;
  const k = lutK[q] / c;    // fold the 1/c average into the darkening
  const C = F.rgbf;
  D[o] = (c0 * C[0] + c1 * C[3] + c2 * C[6] + c3 * C[9]) * k;
  D[o + 1] = (c0 * C[1] + c1 * C[4] + c2 * C[7] + c3 * C[10]) * k;
  D[o + 2] = (c0 * C[2] + c1 * C[5] + c2 * C[8] + c3 * C[11]) * k;
  D[o + 3] = lutA[q];
}

// nothing is plotted yet, so a memset beats re-shading every pixel
function clearImage() {
  F.refAt = 96;                 // high enough that a knob-drag sketch never re-shades
  buildLut(Math.log1p(48));
  F.data.fill(0);
  F.offCtx.putImageData(F.img, 0, 0);
}

// Re-shade the whole fern box after the normalization moves. The body is
// inlined rather than calling shade() a million times: at this size the
// per-pixel property loads cost more than the arithmetic does.
function shadeAll() {
  F.refAt = F.maxC;
  buildLut(Math.log1p(Math.max(6, F.maxC * 0.5)));
  const gw = F.gw, fw = F.fw, fh = F.fh;
  const D = F.data, A = F.ink, tag = F.tag, start = F.drawStart, C = F.rgbf;
  for (let y = 0; y < fh; y++) {
    const row = y * gw;
    for (let x = 0; x < fw; x++) {
      const i = row + x, o = i * 4;
      if (tag[i] < start) { D[o + 3] = 0; continue; }
      const c0 = A[o], c1 = A[o + 1], c2 = A[o + 2], c3 = A[o + 3];
      const c = c0 + c1 + c2 + c3;
      if (c === 0) { D[o + 3] = 0; continue; }
      const q = c < LUTN ? c : LUTN;
      const k = lutK[q] / c;
      D[o] = (c0 * C[0] + c1 * C[3] + c2 * C[6] + c3 * C[9]) * k;
      D[o + 1] = (c0 * C[1] + c1 * C[4] + c2 * C[7] + c3 * C[10]) * k;
      D[o + 2] = (c0 * C[2] + c1 * C[5] + c2 * C[8] + c3 * C[11]) * k;
      D[o + 3] = lutA[q];
    }
  }
  F.offCtx.putImageData(F.img, 0, 0);
}

// Plot n points of the walk into the counts, then re-shade what moved.
function plot(n) {
  const gw = F.gw, fw = F.fw, fh = F.fh;
  const kx = fw / F.xspan, ky = fh / F.yspan;
  const xmin = F.xmin, ymin = F.ymin;
  const M = F.flat, cum0 = F.cum[0], cum1 = F.cum[1], cum2 = F.cum[2];
  const A = F.ink;
  const tag = F.tag, start = F.drawStart;
  const touched = F.touched, cap = touched.length;
  const mark = ++F.frame;
  let x = F.x, y = F.y, nt = 0, maxC = F.maxC;
  let p0 = 0, p1 = 0, p2 = 0, p3 = 0;

  for (let s = 0; s < n; s++) {
    const r = Math.random();
    const mi = r < cum0 ? 0 : r < cum1 ? 1 : r < cum2 ? 2 : 3;
    const b = mi * 6;
    const nx = M[b] * x + M[b + 1] * y + M[b + 4];
    y = M[b + 2] * x + M[b + 3] * y + M[b + 5];
    x = nx;

    const px = ((x - xmin) * kx) | 0;
    const py = (fh - (y - ymin) * ky) | 0;
    if (px < 0 || px >= fw || py < 0 || py >= fh) continue;
    const i = py * gw + px;
    const o = i * 4;
    const t = tag[i];
    if (t < start) {                  // first touch of this pixel this draw
      A[o] = 0; A[o + 1] = 0; A[o + 2] = 0; A[o + 3] = 0;
      tag[i] = mark;
      if (nt < cap) touched[nt++] = i;
    } else if (t !== mark) {
      tag[i] = mark;
      if (nt < cap) touched[nt++] = i;
    }
    A[o + mi]++;
    if (mi === 0) p0++; else if (mi === 1) p1++; else if (mi === 2) p2++; else p3++;
    const tot = A[o] + A[o + 1] + A[o + 2] + A[o + 3];
    if (tot > maxC) maxC = tot;
  }

  F.x = x; F.y = y; F.total += n; F.maxC = maxC;
  F.per[0] += p0; F.per[1] += p1; F.per[2] += p2; F.per[3] += p3;

  if (F.maxC > F.refAt * 1.18) {
    shadeAll();
  } else {
    // re-shade only what moved, and upload only the box it moved inside
    let x0 = gw, x1 = -1, y0 = fh, y1 = -1;
    for (let k = 0; k < nt; k++) {
      const i = touched[k];
      shade(i);
      const py = (i / gw) | 0, px = i - py * gw;
      if (px < x0) x0 = px; if (px > x1) x1 = px;
      if (py < y0) y0 = py; if (py > y1) y1 = py;
    }
    if (x1 >= 0) F.offCtx.putImageData(F.img, 0, 0, x0, y0, x1 - x0 + 1, y1 - y0 + 1);
  }
}

function reset(quick) {
  F.maps = makeMaps();
  F.cum = [];
  let acc = 0;
  for (let i = 0; i < 4; i++) { acc += F.maps[i].p; F.cum.push(acc); }
  F.cum[3] = 1;

  F.flat = new Float64Array(24);
  F.rgbf = new Float64Array(12);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 6; j++) F.flat[i * 6 + j] = F.maps[i].m[j];
    for (let j = 0; j < 3; j++) F.rgbf[i * 3 + j] = F.maps[i].rgb[j];
  }

  const b = measure(F.maps, F.cum, quick ? 3500 : 30000);
  F.xmin = b.xmin; F.xspan = b.xspan; F.ymin = b.ymin; F.yspan = b.yspan;

  layout();
  F.drawStart = F.frame + 1;   // every tag below this is from an earlier draw
  F.total = 0; F.per = [0, 0, 0, 0]; F.maxC = 1; F.owed = 0; F.done = false;
  F.x = 0; F.y = 0;
  for (let i = 0; i < 40; i++) {       // let the walk fall onto the attractor
    const m = F.maps[pickMap(F.maps, F.cum)].m;
    const nx = m[0] * F.x + m[1] * F.y + m[4];
    F.y = m[2] * F.x + m[3] * F.y + m[5];
    F.x = nx;
  }
  F.walk = { x: F.x, y: F.y, mi: 1, t: 0, trail: [] };
  clearImage();
  buildLegend();
  syncKnobs();
  setCaption(paramsAreDefault() ? CAPTION_DRAW : CAPTION_BENT);
  if (quick) plot(SKETCH);   // a thin fern right away, so a drag tracks

  if (PREFILL) {
    for (let k = 0; k < 28; k++) plot(TARGET / 28);
    F.done = true;
    setCaption(paramsAreDefault() ? CAPTION_DONE : CAPTION_BENT);
  }
}

/* ---------- the visible walk ---------- */
/* The same chaos game, slowed to a few throws a second, so the mechanism
 * behind the millions of points is watchable. */

const WALK_RATE = 5.4;
const TRAIL = 26;

function stepWalk(dt) {
  const w = F.walk;
  w.t += dt * WALK_RATE;
  while (w.t >= 1) {
    w.t -= 1;
    const mi = pickMap(F.maps, F.cum);
    const m = F.maps[mi].m;
    const nx = m[0] * w.x + m[1] * w.y + m[4];
    w.y = m[2] * w.x + m[3] * w.y + m[5];
    w.x = nx;
    w.mi = mi;
    w.trail.push({ x: w.x, y: w.y, mi: mi });
    if (w.trail.length > TRAIL) w.trail.shift();
  }
}

/* Fern coordinates to screen: place the point on the upright picture, offset
 * from its center, then turn that offset by the tilt. Same transform the
 * composite uses, so the walk lands on the ink. */
const offOf = (x, y) => [
  ((x - F.xmin) / F.xspan - 0.5) * F.iw,
  (0.5 - (y - F.ymin) / F.yspan) * F.ih,
];
const sxOf = (x, y) => {
  const o = offOf(x, y);
  return F.rect.x + F.rect.w * 0.5 + o[0] * ROT_C - o[1] * ROT_S;
};
const syOf = (x, y) => {
  const o = offOf(x, y);
  return F.rect.y + F.rect.h * 0.5 + o[0] * ROT_S + o[1] * ROT_C;
};

function drawWalk() {
  const tr = F.walk.trail;
  if (!tr.length) return;
  const unit = Math.max(1, F.iw / 260);
  ctx.save();
  ctx.lineCap = 'round';
  for (let k = 1; k < tr.length; k++) {
    const age = k / tr.length;                    // 0 oldest, 1 newest
    const a = tr[k - 1], b = tr[k];
    ctx.strokeStyle = 'rgba(29,43,35,' + (0.05 + 0.14 * age).toFixed(3) + ')';
    ctx.lineWidth = unit * (0.35 + 0.5 * age);
    ctx.beginPath();
    ctx.moveTo(sxOf(a.x, a.y), syOf(a.x, a.y));
    ctx.lineTo(sxOf(b.x, b.y), syOf(b.x, b.y));
    ctx.stroke();
  }
  for (let k = 0; k < tr.length; k++) {
    const age = (k + 1) / tr.length;
    const p = tr[k], c = F.maps[p.mi].rgb;
    ctx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (0.10 + 0.75 * age * age).toFixed(3) + ')';
    ctx.beginPath();
    ctx.arc(sxOf(p.x, p.y), syOf(p.x, p.y), unit * (0.7 + 1.9 * age), 0, Math.PI * 2);
    ctx.fill();
  }

  // name the map that just fired, held clear of the fern's body
  const head = tr[tr.length - 1];
  const m = F.maps[head.mi];
  const hx = sxOf(head.x, head.y), hy = syOf(head.x, head.y);
  const size = clamp(F.iw * 0.062, 11, 30);
  // push the name out sideways from the fern's spine, in the tilted frame
  const out = (head.x - F.xmin) / F.xspan < 0.5 ? -1 : 1;
  const lx = clamp(hx + out * ROT_C * size * 1.3, size * 3, W - size * 3);
  const ly = clamp(hy + out * ROT_S * size * 1.3, size * 2, H - size * 2);
  ctx.font = size.toFixed(1) + 'px Georgia, "Times New Roman", serif';
  ctx.textAlign = out * ROT_C >= 0 ? 'left' : 'right';
  ctx.textBaseline = 'middle';
  ctx.strokeStyle = 'rgba(251,250,246,0.9)';
  ctx.lineWidth = size * 0.34;
  ctx.lineJoin = 'round';
  const label = m.key + '  ' + (m.p * 100).toFixed(0) + '%';
  ctx.strokeText(label, lx, ly);
  ctx.fillStyle = 'rgba(' + m.rgb[0] + ',' + m.rgb[1] + ',' + m.rgb[2] + ',0.95)';
  ctx.fillText(label, lx, ly);
  ctx.restore();
}

/* ---------- HUD ---------- */

const CAPTION_DRAW =
  'Every point is colored by the rule that put it there. Watch the ' +
  '<b>teal</b> and <b>amber</b> gather: those two rules each fold an entire ' +
  'fern into one bottom leaflet, and the green rule folds the fern into ' +
  'itself, one leaflet up, forever.';

const CAPTION_DONE =
  'Nothing here knows what a leaf is. Four matrices, twenty-four numbers, and ' +
  'a die — and the same shape appears every time, from any starting point. ' +
  'The teal leaflet is the whole fern, rotated and shrunk. So is the amber one. ' +
  'So is everything above them.';

const CAPTION_BENT =
  'These are no longer Barnsley\'s numbers. The maps are still contractions, ' +
  'so the walk still settles onto <b>something</b> \u2014 it just is not the ' +
  'fern any more. Every plant here is four matrices and a die, and the ' +
  'coefficients doing it are listed above.';

const roBig = document.getElementById('ro-big');
const roSub = document.getElementById('ro-sub');
const capEl = document.getElementById('caption');
const legendEl = document.getElementById('legend');

let capNow = '';
function setCaption(html) {
  if (capNow === html) return;
  capNow = html;
  capEl.innerHTML = html;
}

function num(v) {
  const s = v.toFixed(2);
  return s === '0.00' ? '0' : s.replace('0.', '.').replace('-0.', '-.');
}

function buildLegend() {
  legendEl.innerHTML = F.maps.map((m, i) => {
    const c = 'rgb(' + m.rgb.join(',') + ')';
    const q = m.m;
    return '<div class="card">' +
      '<div class="swatch" style="background:' + c + '"></div>' +
      '<div class="mat">' +
        '<span>' + num(q[0]) + '</span><span>' + num(q[1]) + '</span><span class="plus">+' + num(q[4]) + '</span>' +
        '<span>' + num(q[2]) + '</span><span>' + num(q[3]) + '</span><span class="plus">+' + num(q[5]) + '</span>' +
      '</div>' +
      '<div class="meta">' +
        '<div class="name" style="color:' + c + '">' + m.key + ' &middot; ' + m.name + '</div>' +
        '<div class="odds">p = ' + m.p.toFixed(2) + ' &middot; <i id="sh' + i + '">&mdash;</i> of points</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

const knobsEl = document.getElementById('knobs');

function buildKnobs() {
  knobsEl.innerHTML =
    '<div class="knob-head" id="knob-head">Drag a knob. The matrices to the right are what actually moves.</div>' +
    KNOBS.map(k =>
      '<div class="knob">' +
        '<div class="ktop"><span class="klabel">' + k.label + '</span>' +
        '<span class="kval" id="kv-' + k.key + '"></span></div>' +
        '<input type="range" id="ki-' + k.key + '" min="' + k.min + '" max="' + k.max +
          '" step="' + k.step + '" value="' + PAR[k.key] + '" />' +
        // On the wall the same knob is a readout: there is nothing to drag up
        // there, but the position still has to be legible from across the room,
        // because it is what the phone is moving. CSS shows one or the other.
        '<div class="kmeter"><i id="km-' + k.key + '"></i></div>' +
        '<div class="knote">' + k.note + '</div>' +
      '</div>'
    ).join('');

  KNOBS.forEach(k => {
    const el = document.getElementById('ki-' + k.key);
    // redraw on every drag step, but at most once a frame: the handler only
    // flags the change and the loop picks it up
    el.addEventListener('input', () => {
      PAR[k.key] = parseFloat(el.value);
      pendingKnob = true;
    });
    // on release, re-measure properly so the framing is exact
    el.addEventListener('change', () => {
      PAR[k.key] = parseFloat(el.value);
      pendingKnob = false;
      reset(false);
    });
  });
}

function syncKnobs() {
  KNOBS.forEach(k => {
    const el = document.getElementById('ki-' + k.key);
    if (el && parseFloat(el.value) !== PAR[k.key]) el.value = PAR[k.key];
    const v = document.getElementById('kv-' + k.key);
    if (v) v.textContent = k.show(PAR[k.key]);
    const m = document.getElementById('km-' + k.key);
    if (m) m.style.width = (clamp((PAR[k.key] - k.min) / (k.max - k.min), 0, 1) * 100) + '%';
  });
}

function updateHud() {
  const pct = clamp(F.total / TARGET, 0, 1);
  setReadout(fmt(F.total), [
    'points plotted',
    F.done
      ? 'the walk keeps going'
      : '<span>' + fmt(RATE) + '</span> throws per second',
    F.done ? '<span>7 million</span> throws in' : '<span>' + (pct * 100).toFixed(0) + '%</span> of the way there',
  ]);
  for (let i = 0; i < 4; i++) {
    const el = document.getElementById('sh' + i);
    if (!el) continue;
    const s = F.total ? (F.per[i] / F.total * 100) : 0;
    el.textContent = (F.total < 2000 ? '—' : s.toFixed(2) + '%');
  }
}

function setReadout(big, lines) {
  if (roBig.textContent !== big) roBig.textContent = big;
  const html = lines.join('<br>');
  if (roSub.innerHTML !== html) roSub.innerHTML = html;
}

/* ---------- shell: loop and controls ---------- */

let paused = false;
let last = performance.now();
let pendingKnob = false;
let hudAcc = 0;

function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  W = window.innerWidth;
  H = window.innerHeight;
  cv.width = Math.floor(W * DPR);
  cv.height = Math.floor(H * DPR);
  cv.style.width = W + 'px';
  cv.style.height = H + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  allocGrid();
  reset(false);
}

function frame(now) {
  let dt = (now - last) / 1000;
  last = now;
  dt = clamp(dt, 0, 0.05);
  const realDt = dt;   // the idle clock must keep running while paused
  if (paused) dt = 0;

  // warm paper ground, lit slightly from behind the fern
  ctx.fillStyle = '#fbfaf6';
  ctx.fillRect(0, 0, W, H);
  const gx = F.rect.x + F.rect.w * 0.5, gy = F.rect.y + F.rect.h * 0.5;
  const vg = ctx.createRadialGradient(gx, gy, 0, gx, gy, Math.max(W, H) * 0.7);
  vg.addColorStop(0, 'rgba(255,254,249,0.95)');
  vg.addColorStop(1, 'rgba(238,238,228,0.75)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  if (pendingKnob) { pendingKnob = false; reset(true); }

  if (!F.done && dt > 0) {
    F.owed += dt * RATE;
    const n = Math.min(Math.floor(F.owed), TARGET - F.total);
    if (n > 0) { F.owed -= n; plot(n); }
    if (F.total >= TARGET) { F.done = true; setCaption(paramsAreDefault() ? CAPTION_DONE : CAPTION_BENT); }
  }

  // the upright picture, turned by the tilt about the center of its box
  ctx.save();
  ctx.translate(F.rect.x + F.rect.w * 0.5, F.rect.y + F.rect.h * 0.5);
  ctx.rotate(ROT * Math.PI / 180);
  ctx.drawImage(F.off, 0, 0, F.fw, F.fh, -F.iw / 2, -F.ih / 2, F.iw, F.ih);
  ctx.restore();

  stepWalk(dt);
  drawWalk();

  tickIdle(realDt);

  hudAcc += dt;
  if (hudAcc > 0.1 || F.total < 5000) { hudAcc = 0; updateHud(); }

  requestAnimationFrame(frame);
}

/* controls */
document.getElementById('btn-new').addEventListener('click', () => reset(false));
document.getElementById('btn-random').addEventListener('click', () => {
  randomParams();
  reset(false);
});
document.getElementById('btn-reset').addEventListener('click', () => {
  resetParams();
  reset(false);
});

window.addEventListener('keydown', e => {
  if (e.key === ' ') { paused = !paused; e.preventDefault(); }
  else if (e.key === 'n') reset(false);
  else if (e.key === 'm') { randomParams(); reset(false); }
  else if (e.key === 'r') { resetParams(); reset(false); }
});

window.addEventListener('resize', () => {
  clearTimeout(window.__rz);
  window.__rz = setTimeout(resize, 150);
});

/* ---------- phone controls ---------- */
/* On the wall the five knobs and the three buttons are not reachable: there is
 * no mouse and no touchscreen up there, and the only input is a visitor's
 * phone. footron.js is the socket end of that; this is what it drives.
 *
 * Off the wall none of it runs, and the page stays the self-contained thing it
 * was — the sliders in the left column still work under a plain file server. */

const FT = {
  on: false,
  active: false,   // has anyone touched a phone since the last hand-back
  idle: 0,
};

// How long the wall waits after the last message before putting Barnsley's own
// numbers back. Long enough that reading the caption does not lose your plant,
// short enough that the next person along does not walk up to a stranger's.
const IDLE_HOME = 45;

// Bounds for footron.js to clamp against. KNOBS stays the one authority, so
// what the socket will accept and what the sliders draw cannot drift apart.
const KNOB_RANGES = {};
KNOBS.forEach(k => { KNOB_RANGES[k.key] = [k.min, k.max]; });

function goHome() {
  FT.active = false;
  FT.idle = 0;
  paused = false;
  pendingKnob = false;
  resetParams();
  reset(false);
}

function tickIdle(dt) {
  if (!FT.on || !FT.active) return;
  FT.idle += dt;
  if (FT.idle >= IDLE_HOME) goHome();
}

const FT_HANDLERS = {
  onActivity() { FT.active = true; FT.idle = 0; },

  // A finger still on the slider gets the same treatment a local drag gets: set
  // the value, flag it, and let the loop sketch it once this frame rather than
  // once per message. The release re-measures the attractor properly.
  onKnob(key, value, live) {
    PAR[key] = value;
    if (live) { pendingKnob = true; return; }
    pendingKnob = false;
    reset(false);
  },

  onPreset(id, values) {
    Object.keys(values).forEach(k => { PAR[k] = values[k]; });
    pendingKnob = false;
    reset(false);
  },

  onRandom() { randomParams(); pendingKnob = false; reset(false); },
  onWalk() { reset(false); },
  onPause(value) { paused = value; },
  onRelease() { goHome(); },
};

/* Two halves, because they want to happen either side of the first draw. The
 * chrome has to be right before anything is measured; the socket must not be
 * open until there is a buffer for an early message to land in. */

function markFootron() {
  const api = window.FernFootron;
  if (!api || !api.footronEnabled()) return;
  FT.on = true;
  document.body.classList.add('footron');
  // Up there the sliders are a readout, the buttons are gone, and the bottom
  // row has been pushed clear of the QR card — so the copy has to move too.
  const hint = document.getElementById('hint');
  if (hint) hint.textContent = 'scan the code in the corner \u2014 the knobs are on your phone';
  const head = document.getElementById('knob-head');
  if (head) head.textContent = 'Your phone moves these. The matrices to the right are what actually moves.';
}

function connectFootron() {
  if (!FT.on) return;
  window.FernFootron.connectFootron(FT_HANDLERS, { ranges: KNOB_RANGES });
}

/* ---------- boot ---------- */

buildKnobs();      // must exist before the first reset syncs values into it
markFootron();     // the wall's chrome, before anything is measured or drawn
resize();          // establishes W/H, builds the buffer, seeds the walk
updateHud();
connectFootron();  // only now: an early message must have a buffer to land in
requestAnimationFrame(frame);
