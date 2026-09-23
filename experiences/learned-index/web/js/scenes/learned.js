/* Learned index — the index as a model of the data's CDF.
 *   Kraska, Beutel, Chi, Dean & Polyzotis, "The Case for Learned Index
 *     Structures", SIGMOD 2018: position ≈ F(key) · N.
 *   Ferragina & Vinciguerra, "The PGM-index", VLDB 2020: piecewise-linear
 *     segments with a guaranteed maximum error ε.
 *
 * Plot every stored key against its position in the sorted array and you get
 * the data's cumulative distribution. Fit that curve with straight segments
 * such that no key is ever more than ε positions from its segment's line.
 * A lookup then evaluates one line and searches only a window of 2ε + 1
 * slots, instead of binary-searching the whole array.
 *
 * Segments here come from a streaming "shrinking cone": each new point
 * narrows the range of slopes that keep every point so far within ±ε, and
 * when the range empties a new segment starts. That keeps the ε guarantee
 * exactly; the PGM-index uses an optimal convex-hull method that needs
 * somewhat fewer segments.
 *
 * Honest scope (SOSD benchmark, Marcus et al. VLDB 2020): the wins are for
 * read-only, in-memory sorted arrays, depend on how smooth the data is, and
 * inserts are hard.
 */
(function () {
  'use strict';
  const DS = window.DS, C = DS.C;
  const N = 1400, EPS = 12;

  function gauss() { return Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random()); }
  const DATA = {
    'lognormal': () => Array.from({ length: N }, () => Math.exp(gauss() * 0.45)),
    'bursty timestamps': () => {
      const out = []; let t = 0;
      while (out.length < N) { const burst = Math.random() < 0.08; const n = burst ? DS.ri(40, 120) : 1; for (let i = 0; i < n && out.length < N; i++) out.push((t += burst ? Math.random() * 0.02 : Math.random() * 3)); }
      return out;
    },
    'map coordinates': () => Array.from({ length: N }, () => (Math.random() < 0.6 ? 30 + gauss() * 4 : Math.random() < 0.5 ? 70 + gauss() * 8 : Math.random() * 100)),
  };

  function segment(keys) {
    const segs = [];
    let i = 0;
    while (i < keys.length) {
      const k0 = keys[i], p0 = i;
      let lo = -Infinity, hi = Infinity, j = i + 1;
      for (; j < keys.length; j++) {
        const dx = keys[j] - k0;
        if (dx <= 0) { if (Math.abs(j - p0) > EPS) break; continue; }
        const nlo = Math.max(lo, (j - EPS - p0) / dx), nhi = Math.min(hi, (j + EPS - p0) / dx);
        if (nlo > nhi) break;
        lo = nlo; hi = nhi;
      }
      const slope = isFinite(lo) && isFinite(hi) ? (lo + hi) / 2 : 0;
      segs.push({ k0, p0, slope, end: j - 1, k1: keys[j - 1] });
      i = j;
    }
    return segs;
  }
  DS.learnedSegment = segment;

  DS.register({
    id: 'learned',
    group: 'Systems',
    title: 'Learned Index',
    tag: 'Kraska et al. 2018 · PGM-index 2020',
    duration: 64,
    idea: "Replace the index with a model that predicts where each key is stored.",
    glance: 2,
    legend: [["sky", "stored keys"], ["teal", "model lines (±12)"], ["amber", "a lookup"]],
    notes: [
      'Plot each stored key against its position in the sorted list. The curve is the shape of the data — its cumulative distribution.',
      'Fit that curve with straight lines, each allowed to miss by at most ±12 positions. Each line is just three numbers.',
      'A lookup evaluates one line to predict the position, then searches only 25 slots around it — never the whole array.',
      'Smooth data needs few lines; bursty data needs many. The model only works as well as the data is predictable.',
      'On 1,400 keys that saves little; on hundreds of millions it saves memory and cache misses. Proposed at Google in 2018; best on read-only data.',
    ],
    actions: [
      { id: 'lookup', label: 'Look up a key' },
      { id: 'data', label: 'Different data' },
      { id: 'rebuild', label: 'Refit' },
    ],

    init() {
      this.steps = new DS.Steps();
      this.di = DS.ri(0, 2);
      this.load();
      this.phase = 0;
    },
    load() {
      const name = Object.keys(DATA)[this.di];
      this.name = name;
      this.keys = DATA[name]().sort((a, b) => a - b);
      this.kmin = this.keys[0];
      this.kmax = this.keys[N - 1];
      this.segs = segment(this.keys);
      this.shown = 0;              // segments revealed so far
      this.look = null;
      this.lastCost = null;
    },

    *buildGen() {
      this.shown = 0;
      this.look = null;
      DS.say(`${N.toLocaleString('en-US')} sorted keys (${this.name})  ·  fit lines that never miss by more than ±${EPS}`);
      yield 1;
      const step = Math.max(1, Math.ceil(this.segs.length / 40));
      for (let s = 0; s < this.segs.length; s += step) { this.shown = s + step; yield 0.07; }
      this.shown = this.segs.length;
      DS.say(`${this.segs.length} lines cover all ${N.toLocaleString('en-US')} keys  ·  about ${this.segs.length * 16} bytes of model`, 'good');
      yield 2;
    },

    *lookupGen() {
      if (this.shown < this.segs.length) yield* this.buildGen();
      const idx = DS.ri(0, N - 1), k = this.keys[idx];
      // find the segment: binary search over segment start keys
      let a = 0, b = this.segs.length - 1, segSteps = 0;
      while (a < b) { segSteps++; const m = (a + b + 1) >> 1; if (this.segs[m].k0 <= k) a = m; else b = m - 1; }
      const s = this.segs[a];
      const pred = Math.round(s.p0 + s.slope * (k - s.k0));
      const lo = Math.max(0, pred - EPS), hi = Math.min(N - 1, pred + EPS);
      // bounded binary search inside the window
      const probes = [];
      let l = lo, h = hi;
      while (l <= h) { const m = (l + h) >> 1; probes.push(m); if (this.keys[m] === k) break; if (this.keys[m] < k) l = m + 1; else h = m - 1; }
      let full = 0; { let L = 0, H = N - 1; while (L <= H) { full++; const m = (L + H) >> 1; if (this.keys[m] === k) break; if (this.keys[m] < k) L = m + 1; else H = m - 1; } }
      this.look = { k, idx, seg: a, pred, lo, hi, probes, shownProbes: 0, stage: 0 };
      DS.say(`look up key ${k.toFixed(2)}  ·  which line covers it?`);
      yield 0.9;
      this.look.stage = 1;
      DS.say(`line ${a + 1} predicts position ${pred}  ·  the truth is guaranteed to be within ±${EPS}`);
      yield 1.2;
      this.look.stage = 2;
      for (let p = 1; p <= probes.length; p++) { this.look.shownProbes = p; yield 0.4; }
      this.lastCost = { model: segSteps + probes.length, full };
      DS.say(`found at ${idx} (predicted ${pred}, off by ${Math.abs(idx - pred)})  ·  ${segSteps} + ${probes.length} steps  ·  binary search over everything: ${full}`, 'good');
      yield 2.4;
      this.look = null;
    },

    act(id) {
      const s = this.steps;
      if (s.length > 3) return;
      if (id === 'lookup') s.run(() => this.lookupGen());
      else if (id === 'data') { s.clear(); this.di = (this.di + 1) % 3; this.load(); s.run(() => this.buildGen()); }
      else if (id === 'rebuild') { s.clear(); s.run(() => this.buildGen()); }
    },

    auto() {
      const p = this.phase++;
      if (p % 5 === 0) { if (p) { this.di = (this.di + 1) % 3; this.load(); } this.steps.run(this.buildGen()); }
      else this.act('lookup');
    },

    update(dt, auto) {
      this.steps.update(dt);
      if (auto && !this.steps.busy) this.auto();
    },

    draw(g) {
      const S = DS.stage, u = DS.u;
      const cx0 = S.x + 50 * u, cw = S.w * 0.62, cy0 = S.y + 10 * u, ch = S.h - 50 * u;
      const X = (k) => cx0 + ((k - this.kmin) / (this.kmax - this.kmin)) * cw;
      const Y = (p) => cy0 + ch - (p / (N - 1)) * ch;
      const L = this.look;

      // axes
      DS.line(g, cx0, cy0 + ch, cx0 + cw, cy0 + ch, DS.rgba(C.dim, 0.35), 1 * u);
      DS.line(g, cx0, cy0, cx0, cy0 + ch, DS.rgba(C.dim, 0.35), 1 * u);
      DS.text(g, 'key →', cx0 + cw, cy0 + ch + 16 * u, { size: 12 * u, mono: true, color: C.mute, align: 'right' });
      g.save(); g.translate(cx0 - 20 * u, cy0); g.rotate(-Math.PI / 2);
      DS.text(g, '← position in the sorted array', 0, 0, { size: 12 * u, mono: true, color: C.mute, align: 'right' });
      g.restore();

      // the data: every key at its position
      g.beginPath();
      for (let i = 0; i < N; i += 1) { const x = X(this.keys[i]), y = Y(i); g.moveTo(x + 1.3 * u, y); g.arc(x, y, 1.3 * u, 0, 6.2832); }
      g.fillStyle = DS.rgba(C.sky, 0.7);
      g.fill();

      // segments with their ±ε tubes
      const hueOf = (i) => [C.teal, C.amber, C.violet, C.rose][i % 4];
      for (let i = 0; i < Math.min(this.shown, this.segs.length); i++) {
        const s = this.segs[i];
        const x0 = X(s.k0), x1 = X(s.k1);
        const p0 = s.p0, p1 = s.p0 + s.slope * (s.k1 - s.k0);
        const hot = L && L.seg === i;
        g.beginPath();
        g.moveTo(x0, Y(p0 + EPS)); g.lineTo(x1, Y(p1 + EPS)); g.lineTo(x1, Y(p1 - EPS)); g.lineTo(x0, Y(p0 - EPS)); g.closePath();
        g.fillStyle = DS.rgba(hot ? C.amber : hueOf(i), hot ? 0.22 : 0.1);
        g.fill();
        DS.line(g, x0, Y(p0), x1, Y(p1), DS.rgba(hot ? C.amber : hueOf(i), 0.95), (hot ? 2.4 : 1.6) * u);
      }

      // the lookup
      if (L) {
        const x = X(L.k);
        DS.line(g, x, cy0 + ch, x, Y(L.pred), DS.rgba(C.amber, 0.8), 1.4 * u);
        DS.circle(g, x, cy0 + ch, 4 * u, C.amber);
        if (L.stage >= 1) {
          DS.line(g, cx0, Y(L.pred), x, Y(L.pred), DS.rgba(C.amber, 0.8), 1.4 * u);
          g.fillStyle = DS.rgba(C.amber, 0.12);
          g.fillRect(cx0 - 12 * u, Y(L.hi), 12 * u, Y(L.lo) - Y(L.hi));
          DS.text(g, `${L.pred}`, cx0 - 16 * u, Y(L.pred), { size: 13 * u, mono: true, color: C.amber, align: 'right' });
        }
      }

      // right: the array window
      const rx = cx0 + cw + 60 * u, rw = S.x1 - rx;
      DS.text(g, 'THE SORTED ARRAY', rx, S.y + 6 * u, { size: 12 * u, mono: true, color: C.mute, align: 'left' });
      const bar = 14 * u;
      DS.box(g, rx, S.y + 22 * u, rw, bar, 3 * u, DS.rgba(C.sky, 0.15), DS.rgba(C.sky, 0.4), 1 * u);
      DS.text(g, `${N.toLocaleString('en-US')} slots`, rx + rw, S.y + 50 * u, { size: 12 * u, mono: true, color: C.mute, align: 'right' });
      if (L && L.stage >= 1) {
        const wx = rx + (L.lo / N) * rw, ww = Math.max(3 * u, ((L.hi - L.lo + 1) / N) * rw);
        DS.box(g, wx, S.y + 18 * u, ww, bar + 8 * u, 2 * u, DS.rgba(C.amber, 0.5), C.amber, 1.2 * u);
        // zoom
        const zy = S.y + 90 * u;
        DS.text(g, `ZOOM: slots ${L.lo}–${L.hi}, the only ones searched`, rx, zy - 14 * u, { size: 12 * u, mono: true, color: C.amber, align: 'left' });
        const n = L.hi - L.lo + 1, zc = rw / n;
        const probes = L.probes.slice(0, L.shownProbes);
        for (let i = 0; i < n; i++) {
          const p = L.lo + i;
          const x = rx + i * zc;
          const probed = probes.indexOf(p);
          const hit = p === L.idx && probed >= 0;
          DS.box(g, x + 1, zy, zc - 2, 40 * u, 3 * u, hit ? C.teal : probed >= 0 ? DS.rgba(C.amber, 0.6) : C.cell, p === L.pred ? C.amber : null, 1.5 * u);
          if (probed >= 0) DS.text(g, String(probed + 1), x + zc / 2, zy + 20 * u, { size: Math.min(12 * u, zc * 0.6), mono: true, color: C.dark, weight: 700 });
        }
        DS.text(g, 'numbers = order of binary-search probes', rx, zy + 58 * u, { size: 12 * u, mono: true, color: C.mute, align: 'left' });
      }
      const sy = S.y + S.h * 0.45;
      DS.text(g, `DATA: ${this.name}`, rx, sy, { size: 12 * u, mono: true, color: C.ink, align: 'left' });
      DS.text(g, `${this.segs.length} lines for ${N.toLocaleString('en-US')} keys`, rx, sy + 28 * u, { size: 20 * u, mono: true, weight: 300, color: C.teal, align: 'left' });
      DS.text(g, `max error ±${EPS} positions, guaranteed`, rx, sy + 54 * u, { size: 12 * u, mono: true, color: C.dim, align: 'left' });
      if (this.lastCost) {
        DS.text(g, `last lookup: ${this.lastCost.model} steps with the model`, rx, sy + 96 * u, { size: 13 * u, mono: true, color: C.amber, align: 'left' });
        DS.text(g, `${this.lastCost.full} steps binary-searching everything`, rx, sy + 118 * u, { size: 13 * u, mono: true, color: C.dim, align: 'left' });
      }
    },

    stats() {
      return [{ k: 'keys', v: N.toLocaleString('en-US') }, { k: 'lines in the model', v: String(this.segs.length) }, { k: 'slots searched per lookup', v: `${2 * EPS + 1} of ${N.toLocaleString('en-US')}`, accent: true }];
    },
  });
})();
