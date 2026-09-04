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

/* The colors are the dark-room set: on an emissive wall the fern is light on
 * black rather than ink on paper, so every map is lifted to something that
 * still separates from its neighbours at fifteen feet. `what` is the plain-
 * language reading of the matrix, shown under each name in the legend. */

const BASE = [
  { key: 'f₁', name: 'Stem', p: 0.01, m: [ 0.00,  0.00,  0.00, 0.16, 0, 0.00], rgb: [201, 162,  96],
    what: 'flattens everything onto one vertical line' },
  { key: 'f₂', name: 'The whole fern, shrunk', p: 0.85, m: [ 0.85,  0.04, -0.04, 0.85, 0, 1.60], rgb: [ 82, 214, 140],
    what: 'shrinks a little, tips a little, steps up one leaflet' },
  { key: 'f₃', name: 'Left leaflet', p: 0.07, m: [ 0.20, -0.26,  0.23, 0.22, 0, 1.60], rgb: [ 86, 200, 235],
    what: 'folds a whole fern down into the left leaflet' },
  { key: 'f₄', name: 'Right leaflet', p: 0.07, m: [-0.15,  0.28,  0.26, 0.24, 0, 0.44], rgb: [242, 183,  70],
    what: 'folds a whole fern, mirrored, into the right one' },
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
  { key: 'turn2', label: 'Stem curl', note: 'turns f\u2082 \u2014 straight, or curled like a fiddlehead',
    min: -18, max: 18, step: 0.25, def: 0,
    show: v => (v >= 0 ? '+' : '\u2212') + Math.abs(v).toFixed(2) + '\u00b0' },
  { key: 'scale2', label: 'Shrink', note: 'scales f\u2082 \u2014 how many leaflets fit before it runs out',
    min: 0.88, max: 1.09, step: 0.002, def: 1,
    show: v => (0.85085 * v).toFixed(3) + '\u00d7' },
  { key: 'twistLeaf', label: 'Leaflet twist', note: 'turns f\u2083 and f\u2084 \u2014 sweeps the bottom leaflets up or down',
    min: -50, max: 50, step: 0.5, def: 0,
    show: v => (v >= 0 ? '+' : '\u2212') + Math.abs(v).toFixed(1) + '\u00b0' },
  { key: 'scaleLeaf', label: 'Leaflet size', note: 'scales f\u2083 and f\u2084 \u2014 side-shoots, or leaflets that rival the plant',
    min: 0.5, max: 1.7, step: 0.01, def: 1,
    show: v => v.toFixed(2) + '\u00d7' },
  { key: 'p2', label: 'Dice weight', note: 'odds of f\u2082 against the leaflets \u2014 where the points go, not the shape',
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
    return { key: src.key, name: src.name, what: src.what, p: p, m: m.slice(), rgb: src.rgb };
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

/* The fern is tilted: it grows out of the lower left towards the upper right.
 * BAND is the block it is drawn into, as a fraction of the window. It is
 * full-bleed now that the knobs have gone to the phone: the whole height of
 * the sheet, and enough width that the rotated picture is height-limited on
 * anything wider than about 5:4. What that leaves is the two side margins
 * beside a diamond, which is where the narration and the legend sit -- so the
 * writing overlaps the picture's bounding box and not its ink.
 *
 * ROT is the tilt, clockwise from upright, so 0 stands the fern up and 90 lays
 * it on its side. */
const BAND = { top: 0.01, h: 0.98, w: 0.60 };
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
    // A slightly higher floor than the paper version had: the sparse outer
    // specks are now light on black rather than dark on white, and at 0.12
    // they read as nothing at all from across the room.
    lutA[c] = (0.20 + 0.80 * Math.pow(t, 0.72)) * 255;
    // On paper the ink deepened where the walk kept coming back; on a dark
    // wall it has to do the opposite. The channels are pushed past 255 and the
    // clamped image data takes them to white, so the densest ridges burn out
    // to a hot core the way a long exposure does.
    lutK[c] = 1 + 0.55 * t * t;
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
  setPlantLine();
  if (quick) plot(SKETCH);   // a thin fern right away, so a drag tracks

  if (PREFILL) {
    for (let k = 0; k < 28; k++) plot(TARGET / 28);
    F.done = true;
  }
}

/* ---------- the visible walk ---------- */
/* The same chaos game, slowed to a few throws a second, so the mechanism
 * behind the millions of points is watchable. */

/* Slow enough to follow: a bit over two throws a second, so each jump is a
 * separate event, with time to see where it landed and what colour -- which is
 * to say which rule -- put it there. The trail is 26 points, which at this rate
 * is about the last twelve seconds of the game. */
const WALK_RATE = 2.2;
const TRAIL = 26;

/* The moving point itself is drawn off-palette, in magenta.
 *
 * It used to take the colour of the rule that had just placed it, which is
 * tidy but means the one thing on the screen you are supposed to follow is
 * painted to match the ink it is standing on -- a green point on the green
 * body, a gold point in the gold leaflet. It disappeared exactly when it
 * mattered.
 *
 * Red is the only strong hue the four rules do not use, so it cannot be
 * mistaken for any of them and it separates from all four: it is opposite the
 * green body, well clear of the blue and gold leaflets, and dark enough on a
 * burned-out white ridge to still read there. The trail behind it stays
 * rule-coloured, so which rule fired is still readable from the last few beads
 * -- that reading moved one point back rather than being lost.
 *
 * One flat disc, one colour: no halo, no glow, no lit core. Sized against the
 * picture rather than the screen, so it holds its proportion from a laptop to
 * a 4K wall.
 *
 * It does not pulse, flash or otherwise animate in place. The point already
 * moves -- that is the entire thing it does -- and on an ambient piece that is
 * on screen for the length of a session, a bead that also throbs between jumps
 * keeps pulling the eye back to something that has not changed. The jump is the
 * event; the dot just has to be findable when you look. */
const DOT = [190, 40, 55];
const DOT_R = 4.2;

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
    ctx.strokeStyle = 'rgba(237,243,238,' + (0.07 + 0.20 * age).toFixed(3) + ')';
    ctx.lineWidth = unit * (0.35 + 0.5 * age);
    ctx.beginPath();
    ctx.moveTo(sxOf(a.x, a.y), syOf(a.x, a.y));
    ctx.lineTo(sxOf(b.x, b.y), syOf(b.x, b.y));
    ctx.stroke();
  }
  // the trail: every bead but the last keeps the colour of the rule that
  // placed it, which is what still says who fired now that nothing is labelled
  for (let k = 0; k < tr.length - 1; k++) {
    const age = (k + 1) / tr.length;
    const p = tr[k], c = F.maps[p.mi].rgb;
    ctx.fillStyle = 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (0.10 + 0.75 * age * age).toFixed(3) + ')';
    ctx.beginPath();
    ctx.arc(sxOf(p.x, p.y), syOf(p.x, p.y), unit * (0.7 + 1.9 * age), 0, Math.PI * 2);
    ctx.fill();
  }

  // and the point itself, off-palette so it is never camouflaged by the ink
  const h = tr[tr.length - 1];
  const hx = sxOf(h.x, h.y), hy = syOf(h.x, h.y);
  ctx.fillStyle = 'rgb(' + DOT.join(',') + ')';
  ctx.beginPath();
  ctx.arc(hx, hy, unit * DOT_R, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/* ---------- HUD ---------- */

/* The narration. What used to be three fixed blocks of prose on the sheet is
 * one beat at a time down the left side, fading from each to the next: someone
 * who walks up mid-draw gets the next sentence rather than a wall of text they
 * would have to find the top of. The clock is the wall's own and not the
 * draw's, so the argument keeps building across plant changes instead of
 * restarting from the first line every forty seconds. */

/* A beat is 40-odd words. Read from across a dim room at maybe two and a half
 * words a second that is a good eighteen seconds, so a beat is up for twenty,
 * of which the first second and a half is it fading in. The lap comes out at
 * about four minutes -- longer than one visitor's session, which is the right
 * way round: whoever walks up gets a beat they can finish rather than the
 * middle of a sentence that is already leaving. */
const BEAT = 21;        // seconds from the start of one beat to the next
const BEAT_HOLD = 19.5; // of which it is up; the remainder is the crossfade
const BEAT_LEAD = 1;    // dark before the first beat of a lap

const NARRATION = [
  'There is <b>no fern in this program</b> &mdash; no leaf, no stem, no ' +
  'outline anywhere in the code. There is one moving point, four rules for ' +
  'moving it, and a loaded die.',

  'Every throw of the die picks one of the four rules. The rule <b>slides, ' +
  'shrinks and turns</b> the point to somewhere new, and a speck of light is ' +
  'left where it lands.',

  'Seven million throws later the specks have filled in <b>everywhere the ' +
  'walk can reach</b> &mdash; and that reachable set is a fern. Nothing drew ' +
  'it; it is the only place the walk could go.',

  'Every speck is <b>colored by the rule that placed it</b>. The four rules ' +
  'are in the corner, each with the six numbers that are all it is: multiply ' +
  'by these, add those.',

  'Watch where the <b>blue</b> and the <b>gold</b> collect. Each of those two ' +
  'rules takes an entire fern and folds it down into a <b>single bottom ' +
  'leaflet</b>.',

  'The <b>green</b> rule &mdash; the one the die picks 85 throws in 100 &mdash; ' +
  'folds the fern into itself one leaflet further up. Then it does it again, ' +
  'and again, and again.',

  'So the blue leaflet is <b>the whole plant</b>, turned and shrunk. So is the ' +
  'gold one. So is every leaflet above them, at every scale you can still ' +
  'see. That property is called <b>self-similarity</b>.',

  'The <b>tan</b> rule is the stem, and the die picks it one throw in a ' +
  'hundred. One throw in a hundred is the whole difference between a plant ' +
  'and a bunch of leaves.',

  'The bright walker is <b>the same game slowed down</b>, to about two throws ' +
  'a second, so you can watch it happen. It never leaves the fern, because the ' +
  'fern is exactly the set the walk cannot escape.',

  'Change the twenty-four numbers and the plant changes with them. The rules ' +
  'still pull points closer together than they were, so the walk still settles ' +
  'onto <b>some</b> definite shape &mdash; it is simply not a fern any more.',

  'Four matrices, twenty-four numbers and a loaded die. <b>Nothing here knows ' +
  'what a leaf is</b>, and the same fern comes back every time, from any ' +
  'starting point you like.',
].map((text, i) => ({ text: text, start: BEAT_LEAD + i * BEAT }));

const NARRATION_LAP = BEAT_LEAD + NARRATION.length * BEAT + 3;

/* Someone is turning the knobs by hand, and these are numbers nobody named.
 * The lap stops for them: whoever is driving is not reading the essay, and
 * whoever is watching wants to know what they are looking at. Picking one of
 * the *named* plants from the phone does not stop it -- Crozier is as much a
 * fern as Barnsley's is, and the wall has other people in front of it. */
const BENT_NOTE =
  'These are <b>no longer Barnsley&rsquo;s numbers</b>. The four rules still pull ' +
  'points closer together than they were, so the walk still settles onto ' +
  '<b>some</b> definite shape &mdash; that much is guaranteed &mdash; it is ' +
  'simply not a fern any more. Whatever is on the wall right now is still just ' +
  'four matrices and a die, and the coefficients making it are listed in the ' +
  'corner as they move.';

const roBig = document.getElementById('ro-big');
const roSub = document.getElementById('ro-sub');
const legendEl = document.getElementById('legend');
const narrEl = document.getElementById('narrate');
const plantEl = document.getElementById('plant');

let narrClock = 0;
let narrShown = null;    // the html on screen or fading in; null is nothing
let narrTimer = 0;

/* Fade the panel out, swap the words while it is invisible, fade it back in.
 * The delay is the CSS transition, so the two never overlap and a beat is
 * never legible half-way through being replaced. */
function showNarration(html) {
  if (narrShown === html) return;
  narrShown = html;
  narrEl.classList.remove('visible');
  clearTimeout(narrTimer);
  if (html === null) return;
  narrTimer = setTimeout(() => {
    narrEl.innerHTML = html;
    narrEl.classList.add('visible');
  }, 480);
}

function tickNarration(dt) {
  if (bentByHand()) { showNarration(BENT_NOTE); return; }
  narrClock += dt;
  const t = narrClock % NARRATION_LAP;
  let hit = null;
  for (let i = 0; i < NARRATION.length; i++) {
    const b = NARRATION[i];
    if (t >= b.start && t < b.start + BEAT_HOLD) { hit = b.text; break; }
  }
  showNarration(hit);
}

/* Which plant is on the wall. The unattended loop works through the named
 * ones and a phone can put any numbers at all up there, so the sheet has to
 * say what is actually on it rather than assume the original. */
let plantNow = '';
// Is a phone editing coefficients directly, rather than sitting on one of the
// plants that has a name? plantLabel is cleared the moment a knob moves.
function bentByHand() {
  return FT.active && !plantLabel && !paramsAreDefault();
}

function setPlantLine() {
  let name, note;
  if (bentByHand()) {
    name = 'your numbers';
    // ...and, for the few seconds after a knob moves, which knob it was: the
    // panel of sliders is on the phone now, but the wall still has to show
    // that the phone is what is moving the coefficients.
    const k = FT.idle < 3.5 && lastKnob;
    note = k ? k.label + ' &middot; ' + k.show(PAR[k.key])
             : 'five knobs on a phone, reaching into the matrices themselves';
  } else if (plantLabel) {
    name = plantLabel[0];
    note = plantLabel[1];
  } else {
    name = 'Barnsley\u2019s own numbers';
    note = 'the original';
  }
  const html = 'on the wall right now: <b>' + name + '</b>' +
    '<br><span class="note">' + note + '</span>';
  if (plantNow !== html) { plantNow = html; plantEl.innerHTML = html; }
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
        '<div class="what">' + m.what + '</div>' +
        '<div class="odds">the die picks it <i>' + (m.p * 100).toFixed(0) + ' throws in 100</i>' +
          ' &middot; it has placed <i id="sh' + i + '">&mdash;</i> of the specks</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

/* The knobs themselves are not drawn here any more. They are five sliders on
 * a visitor's phone (.footron/controls/lib/index.js), and what the wall shows
 * of them is the thing they actually edit: the coefficients in the legend,
 * moving. KNOBS above is still the one authority for their bounds, their
 * labels and their formatting -- the phone mirrors it, the socket clamps
 * against it, and setPlantLine names whichever one was last touched.
 *
 * Off the wall there is no phone, so the keyboard stands in for it: see the
 * keydown handler and #hint. */

function updateHud() {
  const pct = clamp(F.total / TARGET, 0, 1);
  setReadout(fmt(F.total), [
    'specks left by the walk so far',
    F.done
      ? (FT.active
          ? 'the picture is settled &mdash; the walk keeps going anyway'
          : 'the picture is settled &mdash; another plant begins in a moment')
      : 'landing at <span>' + fmt(RATE) + '</span> throws of the die per second',
    F.done
      ? 'every one of <span>7 million</span> throws obeyed one of the four rules'
      : '<span>' + (pct * 100).toFixed(0) + '%</span> of the way to seven million',
  ]);
  setPlantLine();
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

  // dark ground, with the faintest lift behind the fern so the picture sits in
  // a room rather than on a flat black rectangle
  ctx.fillStyle = '#080b09';
  ctx.fillRect(0, 0, W, H);
  const gx = F.rect.x + F.rect.w * 0.5, gy = F.rect.y + F.rect.h * 0.5;
  const vg = ctx.createRadialGradient(gx, gy, 0, gx, gy, Math.max(W, H) * 0.7);
  vg.addColorStop(0, 'rgba(30,48,38,0.55)');
  vg.addColorStop(1, 'rgba(8,11,9,0)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  if (pendingKnob) { pendingKnob = false; reset(true); }

  if (!F.done && dt > 0) {
    F.owed += dt * RATE;
    const n = Math.min(Math.floor(F.owed), TARGET - F.total);
    if (n > 0) { F.owed -= n; plot(n); }
    if (F.total >= TARGET) { F.done = true; sinceDone = 0; }
  }

  // the upright picture, turned by the tilt about the center of its box
  ctx.save();
  ctx.translate(F.rect.x + F.rect.w * 0.5, F.rect.y + F.rect.h * 0.5);
  ctx.rotate(ROT * Math.PI / 180);
  ctx.drawImage(F.off, 0, 0, F.fw, F.fh, -F.iw / 2, -F.ih / 2, F.iw, F.ih);
  ctx.restore();

  stepWalk(dt);
  drawWalk();

  tickAmbient(realDt);

  hudAcc += dt;
  if (hudAcc > 0.1 || F.total < 5000) { hudAcc = 0; updateHud(); }

  requestAnimationFrame(frame);
}

/* Controls. On the wall these are the phone's; off it they are the keyboard's,
 * and both go through the same door -- a key counts as activity, so the
 * unattended rotation stands down for as long as someone is pressing things
 * and picks itself back up when they stop. */

const HINT_WALL =
  'Scan the code in the corner and the five knobs open on your phone \u2014 ' +
  'bend the rules and watch the plant redraw';
const HINT_LOCAL =
  '<b>space</b> pause &middot; <b>n</b> start the walk over &middot; ' +
  '<b>[</b> <b>]</b> the named plants &middot; <b>m</b> a plant nobody named ' +
  '&middot; <b>r</b> back to Barnsley\u2019s numbers';

window.addEventListener('keydown', e => {
  if (e.key === ' ') { touched(); paused = !paused; e.preventDefault(); }
  else if (e.key === 'n') { touched(); reset(false); }
  else if (e.key === 'm') { touched(); showPlant(null); }
  else if (e.key === 'r') { touched(); showPlant('barnsley'); }
  else if (e.key === '[') { touched(); stepPlant(-1); }
  else if (e.key === ']') { touched(); stepPlant(1); }
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

// How long the wall waits after the last message before it takes itself back.
// Long enough that reading a beat of the narration does not lose your plant,
// short enough that the next person along does not walk up to a stranger's.
const IDLE_HOME = 45;

/* Left alone, the wall does not sit on one finished picture forever. It works
 * through the plants the phone can also pick, redrawing each from an empty
 * sheet, and comes back to Barnsley's own numbers in between every one of them
 * so that the canonical fern is what a visitor is most likely to walk up to.
 * `null` is a plant nobody has named -- randomParams() inside the knob ranges.
 *
 * The ids are keys of PRESETS in footron.js: the wall owns the numbers behind
 * each name, and this is the same table the phone reads, so a plant retuned
 * there is retuned in both places at once. */
const ROTATION = [
  'barnsley', 'crozier', 'barnsley', 'feather', 'barnsley',
  'arch', 'barnsley', 'spiral', 'barnsley', null,
];

const PLANT_LABELS = {
  barnsley: ['Barnsley\u2019s own numbers', 'the original'],
  crozier: ['Crozier', 'curls into a hook'],
  feather: ['Feather', 'broad, leaflets up'],
  arch: ['Arch', 'long and thin'],
  spiral: ['Spiral', 'coils in on itself'],
};

// How long a finished picture is held before the next plant starts drawing.
// A draw is about forty seconds, so this is the pause at the end of one.
const LINGER = 13;

let rotAt = 0;          // which entry of ROTATION is on the wall
let plantLabel = PLANT_LABELS.barnsley;
let sinceDone = 0;      // seconds the finished picture has been up
let lastKnob = null;    // the knob a phone moved most recently

function presetOf(id) {
  const api = window.FernFootron;
  const p = api && api.PRESETS && api.PRESETS[id];
  return p || null;
}

/* Put a named plant (or, for null, an unnamed random one) on the wall from an
 * empty sheet. Values still go through PAR, so the legend, the walk and the
 * phone all see the same coefficients they would from a knob. */
function showPlant(id) {
  resetParams();
  if (id === null) {
    randomParams();
    plantLabel = ['a plant nobody has named', 'rolled from the ranges of the five knobs'];
  } else {
    const p = presetOf(id);
    if (p) Object.keys(p).forEach(k => { if (k in PAR) PAR[k] = p[k]; });
    plantLabel = PLANT_LABELS[id] || null;
  }
  pendingKnob = false;
  sinceDone = 0;
  reset(false);
}

function nextPlant() {
  rotAt = (rotAt + 1) % ROTATION.length;
  showPlant(ROTATION[rotAt]);
}

// [ and ] off the wall, so a named plant can be looked at without waiting for
// the rotation to reach it. Steps over the repeats of Barnsley's own numbers.
const NAMED = Object.keys(PLANT_LABELS);
let namedAt = 0;
function stepPlant(d) {
  namedAt = (namedAt + d + NAMED.length) % NAMED.length;
  rotAt = ROTATION.indexOf(NAMED[namedAt]);
  if (rotAt < 0) rotAt = 0;
  showPlant(NAMED[namedAt]);
}

// A key press off the wall is the same event as a phone message on it: someone
// is driving, so the rotation waits.
function touched() { FT.active = true; FT.idle = 0; }

// Bounds for footron.js to clamp against. KNOBS stays the one authority, so
// what the socket will accept and what the sliders draw cannot drift apart.
const KNOB_RANGES = {};
KNOBS.forEach(k => { KNOB_RANGES[k.key] = [k.min, k.max]; });

function goHome() {
  FT.active = false;
  FT.idle = 0;
  paused = false;
  pendingKnob = false;
  lastKnob = null;
  narrClock = 0;            // whoever comes next starts the narration at line one
  showPlant(ROTATION[rotAt]);
}

/* The unattended loop, one frame's worth. Runs on the real clock rather than
 * the paused one: the narration keeps reading and the hand-back keeps counting
 * down while a phone holds the walk still. */
function tickAmbient(dt) {
  tickNarration(dt);
  if (FT.active) {
    FT.idle += dt;
    if (FT.idle >= IDLE_HOME) goHome();
    return;
  }
  if (F.done) {
    sinceDone += dt;
    if (sinceDone >= LINGER) nextPlant();
  }
}

const FT_HANDLERS = {
  onActivity() { FT.active = true; FT.idle = 0; },

  // A finger still on the slider gets the same treatment a local drag gets: set
  // the value, flag it, and let the loop sketch it once this frame rather than
  // once per message. The release re-measures the attractor properly.
  onKnob(key, value, live) {
    PAR[key] = value;
    lastKnob = KNOBS.find(k => k.key === key) || null;
    plantLabel = null;    // whatever this is, it is nobody's named plant now
    if (live) { pendingKnob = true; return; }
    pendingKnob = false;
    reset(false);
  },

  onPreset(id, values) {
    Object.keys(values).forEach(k => { PAR[k] = values[k]; });
    lastKnob = null;
    plantLabel = PLANT_LABELS[id] || null;
    // Keep the rotation's place in step with the phone, so handing the wall
    // back does not jump to a different plant than the one being looked at.
    const at = ROTATION.indexOf(id);
    if (at >= 0) rotAt = at;
    pendingKnob = false;
    sinceDone = 0;
    reset(false);
  },

  onRandom() {
    lastKnob = null;
    showPlant(null);
  },
  onWalk() { reset(false); },
  onPause(value) { paused = value; },
  onRelease() { goHome(); },
};

/* Two halves, because they want to happen either side of the first draw. The
 * chrome has to be right before anything is measured; the socket must not be
 * open until there is a buffer for an early message to land in. */

function markFootron() {
  const api = window.FernFootron;
  const hint = document.getElementById('hint');
  if (!api || !api.footronEnabled()) {
    if (hint) hint.innerHTML = HINT_LOCAL;
    return;
  }
  FT.on = true;
  document.body.classList.add('footron');
  // Up there the keyboard hints are a lie: the phone is the only input.
  if (hint) hint.innerHTML = HINT_WALL;
}

function connectFootron() {
  if (!FT.on) return;
  window.FernFootron.connectFootron(FT_HANDLERS, { ranges: KNOB_RANGES });
}

/* ---------- boot ---------- */

markFootron();     // the wall's chrome, before anything is measured or drawn
resize();          // establishes W/H, builds the buffer, seeds the walk
updateHud();
connectFootron();  // only now: an early message must have a buffer to land in
requestAnimationFrame(frame);
