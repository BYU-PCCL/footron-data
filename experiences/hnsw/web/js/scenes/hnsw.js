/* HNSW — Hierarchical Navigable Small World graphs
 * (Malkov & Yashunin, arXiv 2016; IEEE TPAMI 2020).
 *
 * The index behind most vector databases: "find the stored items most similar
 * to this one" without comparing against all of them. Points live on a stack
 * of proximity graphs. Every point is on layer 0; each point's top layer is
 * drawn from an exponentially decaying distribution (level = ⌊−ln U · mL⌋,
 * mL = 1/ln M), so each layer up holds roughly 1/M as many points — a skip
 * list, but made of graphs. A search enters at the top, greedily hops toward
 * the query on the sparse long-range layers, drops down, and finishes with a
 * small beam search on the dense bottom layer.
 *
 * Construction follows the paper: greedy descent to the new point's level,
 * then at each lower layer a search with efConstruction candidates and the
 * neighbour-selection heuristic (Algorithm 4), pruning neighbours back to
 * M (2M on layer 0).
 *
 * The layers are drawn as stacked, sheared sheets, one above the other.
 */
(function () {
  'use strict';
  const DS = window.DS, C = DS.C;
  const N = 260, M = 5, M0 = 2 * M, EFC = 24, EF = 14, K = 5;
  const ML = 1 / Math.log(M);
  const LAYER_COL = [C.teal, C.blue, C.violet, C.plum, C.rose];

  DS.register({
    id: 'hnsw',
    group: 'Space & graphs',
    title: 'HNSW Graph',
    tag: 'Malkov & Yashunin · 2016',
    duration: 64,
    idea: "How AI search finds the closest match without checking everything.",
    glance: 1,
    legend: [["plum", "top layers: few points, long jumps"], ["teal", "bottom layer: every point"], ["amber", "the search"]],
    notes: [
      'Every point is on the bottom layer. Each layer above keeps only about a fifth of the points below it — chosen at random.',
      'Upper layers are sparse, so their links are long jumps across the map. Lower layers are dense and local.',
      'A search starts at the top, hops greedily toward the target, then drops a layer and repeats with finer steps.',
      'At the bottom it widens into a small beam search to collect the closest few. Most points are never even looked at.',
      'This is the index inside most vector databases — how chatbots and image search find “things like this” in milliseconds.',
    ],
    actions: [
      { id: 'query', label: 'Search' },
      { id: 'add', label: 'Add 20 points' },
      { id: 'rebuild', label: 'Rebuild' },
    ],

    init() {
      this.steps = new DS.Steps();
      this.build(N);
      this.search = null;
      this.lastEval = null;
      this.recall = null;
    },

    randPoint() {
      if (Math.random() < 0.55) {
        const c = this.centres[Math.floor(Math.random() * this.centres.length)];
        const a = Math.random() * 6.283, r = Math.abs(Math.random() + Math.random() - 1) * 0.16;
        return [DS.clamp(c[0] + Math.cos(a) * r, 0.02, 0.98), DS.clamp(c[1] + Math.sin(a) * r, 0.03, 0.97)];
      }
      return [0.02 + Math.random() * 0.96, 0.03 + Math.random() * 0.94];
    },
    build(n) {
      this.P = [];
      this.lvl = [];
      this.nb = [];          // nb[layer] = Map(id -> array of ids)
      this.entry = -1;
      this.top = -1;
      this.born = [];
      this.centres = Array.from({ length: 4 }, () => [0.15 + Math.random() * 0.7, 0.15 + Math.random() * 0.7]);
      for (let i = 0; i < n; i++) this.insert(this.randPoint(), true);
    },

    d(a, b) {
      const p = this.P[a], q = typeof b === 'number' ? this.P[b] : b;
      const dx = (p[0] - q[0]) * 2.2, dy = p[1] - q[1];   // the sheets are 2.2× wider than deep
      return dx * dx + dy * dy;
    },

    // Algorithm 2: greedy/beam search on one layer. `trace` records each
    // expansion so the animation can replay it.
    searchLayer(q, eps, ef, l, trace) {
      const vis = new Set(eps);
      let cand = eps.map((e) => [this.d(e, q), e]).sort((a, b) => a[0] - b[0]);
      let W = cand.slice();
      let evals = eps.length;
      while (cand.length) {
        const [dc, c] = cand.shift();
        if (dc > W[W.length - 1][0] && W.length >= ef) break;
        for (const e of this.nb[l].get(c) || []) {
          if (vis.has(e)) continue;
          vis.add(e);
          evals++;
          const de = this.d(e, q);
          if (trace) trace.push({ l, from: c, to: e });
          if (W.length < ef || de < W[W.length - 1][0]) {
            cand.push([de, e]);
            cand.sort((a, b) => a[0] - b[0]);
            W.push([de, e]);
            W.sort((a, b) => a[0] - b[0]);
            if (W.length > ef) W.pop();
          }
        }
      }
      return { W: W.map((w) => w[1]), evals };
    },

    // Algorithm 4: keep a candidate only if it is closer to q than to any
    // neighbour already kept — spreads links out in different directions.
    select(q, cands, m) {
      const sorted = cands.slice().sort((a, b) => this.d(a, q) - this.d(b, q));
      const out = [];
      for (const e of sorted) {
        if (out.length >= m) break;
        const de = this.d(e, q);
        if (out.every((r) => this.d(e, r) > de)) out.push(e);
      }
      for (const e of sorted) { if (out.length >= m) break; if (!out.includes(e)) out.push(e); }
      return out;
    },

    insert(p, quiet) {
      const id = this.P.length;
      this.P.push(p);
      const L = Math.min(4, Math.floor(-Math.log(1 - Math.random()) * ML));
      this.lvl.push(L);
      this.born.push(quiet ? 0 : 1);
      while (this.nb.length <= L) this.nb.push(new Map());
      for (let l = 0; l <= L; l++) this.nb[l].set(id, []);
      if (this.entry < 0) { this.entry = id; this.top = L; return id; }
      let ep = [this.entry];
      for (let l = this.top; l > L; l--) ep = [this.searchLayer(p, ep, 1, l).W[0]];
      for (let l = Math.min(L, this.top); l >= 0; l--) {
        const { W } = this.searchLayer(p, ep, EFC, l);
        const nbrs = this.select(p, W, M);
        this.nb[l].set(id, nbrs.slice());
        const cap = l === 0 ? M0 : M;
        for (const e of nbrs) {
          const list = this.nb[l].get(e);
          list.push(id);
          if (list.length > cap) this.nb[l].set(e, this.select(this.P[e], list, cap));
        }
        ep = W;
      }
      if (L > this.top) { this.top = L; this.entry = id; }
      return id;
    },

    *queryGen(at) {
      const q = (at ? [DS.clamp(at.x, 0.02, 0.98), DS.clamp(at.y, 0.03, 0.97)] : this.randPoint());
      const trace = [], hops = [];
      let ep = [this.entry], evals = 1;
      for (let l = this.top; l > 0; l--) {
        const start = ep[0];
        const checked = [];
        const r = this.searchLayer(q, ep, 1, l, checked);
        evals += r.evals;
        // replay the greedy walk as a path: re-run it step by step
        let cur = start, path = [cur];
        for (;;) {
          let best = cur;
          for (const e of this.nb[l].get(cur) || []) if (this.d(e, q) < this.d(best, q)) best = e;
          if (best === cur) break;
          cur = best;
          path.push(cur);
        }
        hops.push({ l, path, checked: checked.map((t) => t.to) });
        ep = [cur];
      }
      const r0 = this.searchLayer(q, ep, EF, 0, trace);
      evals += r0.evals;
      const found = r0.W.slice(0, K);
      const truth = this.P.map((_, i) => i).sort((a, b) => this.d(a, q) - this.d(b, q)).slice(0, K);
      const recall = found.filter((f) => truth.includes(f)).length / K;
      this.search = { q, hops, trace, ep0: ep[0], found: [], shownHop: -1, shownPath: 0, shownTrace: 0, done: false, t0: this.clock, drop: null, foundAt: 0 };
      DS.say(`search  ·  enter at the top layer (${this.top}), at its entry point`);
      yield 0.8;
      for (let h = 0; h < hops.length; h++) {
        this.search.shownHop = h;
        for (let k = 1; k <= hops[h].path.length; k++) { this.search.shownPath = k; yield 0.3; }
        const n = hops[h].path.length - 1;
        DS.say(n ? `layer ${hops[h].l}  ·  ${n} long hop${n === 1 ? '' : 's'} toward the target  →  drop down a layer` : `layer ${hops[h].l}  ·  already the closest point here  →  drop down a layer`);
        yield 0.2;
        this.search.drop = { h, t0: this.clock };
        yield 0.6;
      }
      this.search.shownHop = hops.length;
      DS.say('layer 0  ·  a small beam search among close neighbours');
      const step = Math.max(1, Math.ceil(trace.length / 40));
      for (let k = 0; k < trace.length; k += step) { this.search.shownTrace = k; yield 0.05; }
      this.search.shownTrace = trace.length;
      this.search.found = found;
      this.search.done = true;
      this.search.foundAt = this.clock;
      this.lastEval = evals;
      this.recall = recall;
      DS.say(`found the ${K} nearest  ·  measured ${evals} distances out of ${this.P.length} points  ·  ${Math.round(recall * 100)}% match the exact answer`, 'good');
      yield 3.6;
      this.search = null;
    },

    input(name, value) {
      if (name !== 'search' || !value || typeof value.x !== 'number') return false;
      this.steps.clear();
      this.search = null;
      this.steps.run(() => this.queryGen(value));
      return true;
    },
    phone() {
      const r = (v) => Math.round(v * 1000) / 1000;
      const S = this.search;
      return {
        pts: this.P.map((p) => [r(p[0]), r(p[1])]),
        q: S ? [r(S.q[0]), r(S.q[1])] : null,
        found: S && S.done ? S.found.slice() : [],
        checked: this.lastEval || null,
        recall: this.recall,
      };
    },

    *addGen() {
      DS.say('adding 20 points  ·  each draws its random top layer, then links to its nearest neighbours on every layer below');
      for (let k = 0; k < 20; k++) { this.insert(this.randPoint(), false); yield 0.08; }
      DS.say(`+20 points  ·  each one linked into every layer it drew`, 'good');
      yield 0.6;
    },

    act(id) {
      const s = this.steps;
      if (s.length > 3) return;
      if (id === 'query') s.run(() => this.queryGen());
      else if (id === 'add') s.run(() => (this.P.length < 520 ? this.addGen() : null));
      else if (id === 'rebuild') { s.clear(); this.search = null; this.build(N); DS.say('rebuilt from scratch — new random layers'); }
    },

    auto() {
      this.tick = (this.tick || 0) + 1;
      if (this.tick % 5 === 0 && this.P.length < 400) this.act('add');
      else this.act('query');
    },

    update(dt, auto) {
      this.clock = (this.clock || 0) + dt;
      this.steps.update(dt);
      if (auto && !this.steps.busy) this.auto();
      for (let i = 0; i < this.born.length; i++) if (this.born[i] > 0) this.born[i] = Math.max(0, this.born[i] - dt * 0.6);
    },

    // Layer 0 holds every point, so its sheet is drawn deeper than the sparse
    // ones above. Every sheet shares one horizontal skew, so a point's pillar
    // through the layers stays vertical.
    geo() {
      const S = DS.stage, u = DS.u;
      const layers = Math.max(this.top + 1, 3);
      const Du = (S.h - 12 * u) / (2 + (layers - 1) * 1.32);
      const D0 = 2 * Du, gapU = 0.32 * Du;
      const base = [S.y1 - 6 * u], depth = [D0];
      for (let l = 1; l < layers; l++) { base.push(base[l - 1] - depth[l - 1] - gapU); depth.push(Du); }
      const sw = S.w * 0.84, skew = S.w * 0.09;
      return { layers, base, depth, sw, skew, x0: S.x + 70 * u };
    },
    proj(p, l, G) {
      const y = G.base[l] - (1 - p[1]) * G.depth[l];
      const x = G.x0 + p[0] * G.sw + (1 - p[1]) * G.skew;
      return [x, y];
    },

    draw(g) {
      const G = this.geo(), u = DS.u, S = this.search;
      const P = this.P;
      const now = this.clock || 0;
      // sheets, bottom first so upper ones overlay
      for (let l = 0; l < G.layers; l++) {
        const col = LAYER_COL[l % LAYER_COL.length];
        const c = [[0, 0], [1, 0], [1, 1], [0, 1]].map((p) => this.proj([p[0], p[1]], l, G));
        g.beginPath();
        c.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
        g.closePath();
        g.fillStyle = DS.rgba(col, 0.04);
        g.fill();
        g.strokeStyle = DS.rgba(col, 0.28);
        g.lineWidth = 1 * u;
        g.stroke();
        const [lx, ly] = this.proj([0, 0.5], l, G);
        DS.text(g, `layer ${l}`, lx - 14 * u, ly - 6 * u, { size: 15 * u, mono: true, color: DS.rgba(col, 0.95), align: 'right' });
        const cnt = this.lvl.filter((v) => v >= l).length;
        DS.text(g, `${cnt} pts`, lx - 14 * u, ly + 12 * u, { size: 12 * u, mono: true, color: C.dim, align: 'right' });

        // edges on this layer
        const nb = this.nb[l];
        if (nb) {
          g.beginPath();
          for (const [a, list] of nb) {
            const [ax, ay] = this.proj(P[a], l, G);
            for (const b of list) {
              if (b < a && (nb.get(b) || []).includes(a)) continue;
              const [bx, by] = this.proj(P[b], l, G);
              g.moveTo(ax, ay);
              g.lineTo(bx, by);
            }
          }
          g.strokeStyle = DS.rgba(col, l === 0 ? 0.19 : 0.4);
          g.lineWidth = (l === 0 ? 1 : 1.6) * u;
          g.stroke();
          // points
          g.beginPath();
          for (const a of nb.keys()) {
            const [x, y] = this.proj(P[a], l, G);
            const r = (l === 0 ? 2.7 : 4) * u + this.born[a] * 3 * u;
            g.moveTo(x + r, y);
            g.arc(x, y, r, 0, 6.2832);
          }
          g.fillStyle = DS.rgba(col, 0.92);
          g.fill();
        }
      }

      // pillars: the same point on every layer it reached
      g.setLineDash([2 * u, 4 * u]);
      g.beginPath();
      for (let i = 0; i < P.length; i++) {
        if (this.lvl[i] < 1) continue;
        const [x0, y0] = this.proj(P[i], 0, G), [x1, y1] = this.proj(P[i], this.lvl[i], G);
        g.moveTo(x0, y0);
        g.lineTo(x1, y1);
      }
      g.strokeStyle = DS.rgba(C.dim, 0.14);
      g.lineWidth = 1 * u;
      g.stroke();
      g.setLineDash([]);

      if (!S) return;
      const since = now - S.t0;
      const fade = Math.min(1, since / 0.4);
      // the target, shown on every layer, joined by a faint pillar
      const [qx0, qy0] = this.proj(S.q, 0, G), [qx1, qy1] = this.proj(S.q, G.layers - 1, G);
      DS.line(g, qx0, qy0, qx1, qy1, DS.rgba(C.amber, 0.22 * fade), 1.2 * u);
      for (let l = 1; l < G.layers; l++) {
        const [x, y] = this.proj(S.q, l, G);
        DS.circle(g, x, y, 6 * u, null, DS.rgba(C.amber, 0.75 * fade), 1.6 * u);
      }
      // on the bottom layer it is a crosshair with a beating ring, so it can't be missed
      const beat = 0.5 + 0.5 * Math.sin(now * 5);
      DS.halo(g, qx0, qy0, 46 * u, C.amber, 0.45 * fade);
      DS.circle(g, qx0, qy0, (9 + 3 * beat) * u, null, DS.rgba(C.amber, 0.95 * fade), 2.2 * u);
      const ch = 20 * u, gap = 5 * u;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) DS.line(g, qx0 + dx * (9 * u + gap), qy0 + dy * (9 * u + gap), qx0 + dx * (9 * u + ch), qy0 + dy * (9 * u + ch), DS.rgba(C.amber, 0.9 * fade), 2 * u);
      DS.text(g, 'target', qx0 + 34 * u, qy0 - 16 * u, { size: 14 * u, mono: true, color: DS.rgba(C.amber, fade), align: 'left' });

      // the descent: the current layer bright, finished layers quieter
      const onBottom = S.shownHop >= S.hops.length;
      for (let h = 0; h < S.hops.length && h <= S.shownHop; h++) {
        const { l, path, checked } = S.hops[h];
        const n = h === S.shownHop ? S.shownPath : path.length;
        const live = h === S.shownHop && !onBottom;
        const a = live ? 1 : 0.55;
        // every point whose distance this layer measured
        for (const c of checked) { const [x, y] = this.proj(P[c], l, G); DS.circle(g, x, y, 6.5 * u, null, DS.rgba(C.amber, 0.55 * a), 1.4 * u); }
        g.beginPath();
        for (let k = 0; k < n; k++) {
          const [x, y] = this.proj(P[path[k]], l, G);
          k ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.strokeStyle = DS.rgba(C.amber, a);
        g.lineWidth = 4 * u;
        g.lineJoin = 'round';
        g.stroke();
        for (let k = 0; k < n; k++) { const [x, y] = this.proj(P[path[k]], l, G); DS.circle(g, x, y, 6 * u, DS.rgba(C.amber, a)); }
        if (live && n > 0) { const [x, y] = this.proj(P[path[n - 1]], l, G); DS.halo(g, x, y, 30 * u, C.amber, 0.5); }
        // the drop to the next layer: a bead slides down the pillar and lands with a ripple
        const dropping = S.drop && S.drop.h === h;
        if (n === path.length && (h < S.shownHop || onBottom || dropping)) {
          const last = path[path.length - 1];
          const [x0, y0] = this.proj(P[last], l, G), [x1, y1] = this.proj(P[last], l - 1, G);
          const dt = dropping ? now - S.drop.t0 : 9;
          const t = DS.smooth(Math.min(1, dt / 0.45));
          const yb = y0 + (y1 - y0) * t;
          DS.line(g, x0, y0, x0, yb, DS.rgba(C.amber, 0.9), 2.6 * u);
          if (t < 1) { DS.halo(g, x0, yb, 26 * u, C.amber, 0.6); DS.circle(g, x0, yb, 6 * u, C.amber); }
          else {
            DS.arrow(g, x0, y0, x1, y1 - 4 * u, DS.rgba(C.amber, 0.9), 2.6 * u, 11 * u);
            const rt = dt - 0.45;
            if (rt < 0.7) DS.circle(g, x1, y1, (8 + 40 * rt) * u, null, DS.rgba(C.amber, 0.9 * (1 - rt / 0.7)), 2.4 * u);
          }
        }
      }
      // layer-0 beam search: the links it followed and every point it measured
      if (onBottom) {
        const upto = Math.min(S.shownTrace, S.trace.length);
        g.beginPath();
        for (let k = 0; k < upto; k++) {
          const t = S.trace[k];
          const [x0, y0] = this.proj(P[t.from], 0, G), [x1, y1] = this.proj(P[t.to], 0, G);
          g.moveTo(x0, y0);
          g.lineTo(x1, y1);
        }
        g.strokeStyle = DS.rgba(C.amber, S.done ? 0.35 : 0.6);
        g.lineWidth = 1.8 * u;
        g.stroke();
        g.beginPath();
        for (let k = 0; k < upto; k++) {
          const [x, y] = this.proj(P[S.trace[k].to], 0, G);
          g.moveTo(x + 5 * u, y);
          g.arc(x, y, 5 * u, 0, 6.2832);
        }
        g.strokeStyle = DS.rgba(C.amber, S.done ? 0.4 : 0.7);
        g.lineWidth = 1.4 * u;
        g.stroke();
        if (S.found.length) {
          const ft = now - S.foundAt;
          const pop = DS.smooth(Math.min(1, ft / 0.35));
          for (const f of S.found) {
            const [x, y] = this.proj(P[f], 0, G);
            DS.line(g, qx0 + (x - qx0) * (1 - pop), qy0 + (y - qy0) * (1 - pop), qx0, qy0, DS.rgba(C.amber, 0.85), 2 * u);
          }
          for (const f of S.found) {
            const [x, y] = this.proj(P[f], 0, G);
            DS.halo(g, x, y, 26 * u, C.amber, 0.5 * pop);
            DS.circle(g, x, y, (4 + 4.5 * pop) * u, C.amber, C.ink, 2 * u);
            if (ft < 0.9) DS.circle(g, x, y, (8 + 34 * ft) * u, null, DS.rgba(C.amber, 0.8 * (1 - ft / 0.9)), 2 * u);
          }
          DS.text(g, `${S.found.length} nearest`, qx0 + 34 * u, qy0 + 18 * u, { size: 15 * u, mono: true, weight: 600, color: DS.rgba(C.amber, pop), align: 'left' });
        }
      }
    },

    stats() {
      return [{ k: 'points', v: String(this.P.length) }, { k: 'same as the exact answer', v: this.recall === null ? '—' : `${Math.round(this.recall * 100)}%` }, { k: 'points checked by the last search', v: this.lastEval ? `${this.lastEval} of ${this.P.length}` : '—', accent: true }];
    },
  });
})();
