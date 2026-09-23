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

    *queryGen() {
      const q = this.randPoint();
      const trace = [], hops = [];
      let ep = [this.entry], evals = 1;
      for (let l = this.top; l > 0; l--) {
        const start = ep[0];
        const r = this.searchLayer(q, ep, 1, l, null);
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
        hops.push({ l, path });
        ep = [cur];
      }
      const r0 = this.searchLayer(q, ep, EF, 0, trace);
      evals += r0.evals;
      const found = r0.W.slice(0, K);
      const truth = this.P.map((_, i) => i).sort((a, b) => this.d(a, q) - this.d(b, q)).slice(0, K);
      const recall = found.filter((f) => truth.includes(f)).length / K;
      this.search = { q, hops, trace, ep0: ep[0], found: [], shownHop: -1, shownPath: 0, shownTrace: 0, done: false };
      DS.say(`search  ·  enter at the top layer (${this.top}), at the one point that lives there`);
      yield 0.9;
      for (let h = 0; h < hops.length; h++) {
        this.search.shownHop = h;
        for (let k = 1; k <= hops[h].path.length; k++) { this.search.shownPath = k; yield 0.3; }
        DS.say(`layer ${hops[h].l}  ·  ${hops[h].path.length - 1} long hop${hops[h].path.length === 2 ? '' : 's'} toward the target  →  drop down`);
        yield 0.35;
      }
      this.search.shownHop = hops.length;
      DS.say('layer 0  ·  a small beam search among close neighbours');
      const step = Math.max(1, Math.ceil(trace.length / 40));
      for (let k = 0; k < trace.length; k += step) { this.search.shownTrace = k; yield 0.05; }
      this.search.shownTrace = trace.length;
      this.search.found = found;
      this.search.done = true;
      this.lastEval = evals;
      this.recall = recall;
      DS.say(`found the ${K} nearest  ·  measured ${evals} distances out of ${this.P.length} points  ·  ${Math.round(recall * 100)}% match the exact answer`, 'good');
      yield 3.2;
      this.search = null;
    },

    *addGen() {
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
      this.steps.update(dt);
      if (auto && !this.steps.busy) this.auto();
      for (let i = 0; i < this.born.length; i++) if (this.born[i] > 0) this.born[i] = Math.max(0, this.born[i] - dt * 0.6);
    },

    geo() {
      const S = DS.stage, u = DS.u;
      const layers = Math.max(this.top + 1, 3);
      const gap = S.h / layers;
      const sh = gap * 0.72;               // sheet depth on screen
      const sw = S.w * 0.84, skew = S.w * 0.1;
      return { layers, gap, sh, sw, skew, x0: S.x + 60 * u, base: S.y1 - 6 * u };
    },
    proj(p, l, G) {
      const y = G.base - l * G.gap - (1 - p[1]) * G.sh;
      const x = G.x0 + p[0] * G.sw + (1 - p[1]) * G.skew;
      return [x, y];
    },

    draw(g) {
      const G = this.geo(), u = DS.u, S = this.search;
      const P = this.P;
      // sheets, bottom first so upper ones overlay
      for (let l = 0; l < G.layers; l++) {
        const col = LAYER_COL[l % LAYER_COL.length];
        const c = [[0, 0], [1, 0], [1, 1], [0, 1]].map((p) => this.proj([p[0], p[1]], l, G));
        g.beginPath();
        c.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
        g.closePath();
        g.fillStyle = DS.rgba(col, 0.035);
        g.fill();
        g.strokeStyle = DS.rgba(col, 0.25);
        g.lineWidth = 1 * u;
        g.stroke();
        const [lx, ly] = this.proj([0, 0.5], l, G);
        DS.text(g, `layer ${l}`, lx - 14 * u, ly, { size: 13 * u, mono: true, color: DS.rgba(col, 0.9), align: 'right' });
        const cnt = this.lvl.filter((v) => v >= l).length;
        DS.text(g, `${cnt} pts`, lx - 14 * u, ly + 14 * u, { size: 10.5 * u, mono: true, color: C.mute, align: 'right' });

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
          g.strokeStyle = DS.rgba(col, l === 0 ? 0.14 : 0.32);
          g.lineWidth = (l === 0 ? 0.8 : 1.2) * u;
          g.stroke();
          // points
          g.beginPath();
          for (const a of nb.keys()) {
            const [x, y] = this.proj(P[a], l, G);
            const r = (l === 0 ? 1.8 : 2.8) * u + this.born[a] * 3 * u;
            g.moveTo(x + r, y);
            g.arc(x, y, r, 0, 6.2832);
          }
          g.fillStyle = DS.rgba(col, 0.9);
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
      g.strokeStyle = DS.rgba(C.dim, 0.12);
      g.lineWidth = 1 * u;
      g.stroke();
      g.setLineDash([]);

      if (!S) return;
      // the query, shown on every layer, joined by a faint pillar
      for (let l = 0; l < G.layers; l++) {
        const [x, y] = this.proj(S.q, l, G);
        DS.circle(g, x, y, 5 * u, null, DS.rgba(C.amber, 0.7), 1.5 * u);
      }
      const [qx0, qy0] = this.proj(S.q, 0, G), [qx1, qy1] = this.proj(S.q, G.layers - 1, G);
      DS.line(g, qx0, qy0, qx1, qy1, DS.rgba(C.amber, 0.15), 1 * u);
      DS.halo(g, qx0, qy0, 20 * u, C.amber, 0.4);

      // the descent
      for (let h = 0; h < S.hops.length && h <= S.shownHop; h++) {
        const { l, path } = S.hops[h];
        const n = h === S.shownHop ? S.shownPath : path.length;
        g.beginPath();
        for (let k = 0; k < n; k++) {
          const [x, y] = this.proj(P[path[k]], l, G);
          k ? g.lineTo(x, y) : g.moveTo(x, y);
        }
        g.strokeStyle = C.amber;
        g.lineWidth = 2.6 * u;
        g.lineJoin = 'round';
        g.stroke();
        for (let k = 0; k < n; k++) { const [x, y] = this.proj(P[path[k]], l, G); DS.circle(g, x, y, 4 * u, C.amber); }
        if (n === path.length && h < S.shownHop) {
          const last = path[path.length - 1];
          const [x0, y0] = this.proj(P[last], l, G), [x1, y1] = this.proj(P[last], l - 1, G);
          DS.arrow(g, x0, y0, x1, y1, DS.rgba(C.amber, 0.9), 2 * u, 8 * u);
        }
      }
      // layer-0 beam search
      if (S.shownHop >= S.hops.length) {
        g.beginPath();
        for (let k = 0; k < S.shownTrace && k < S.trace.length; k++) {
          const t = S.trace[k];
          const [x0, y0] = this.proj(P[t.from], 0, G), [x1, y1] = this.proj(P[t.to], 0, G);
          g.moveTo(x0, y0);
          g.lineTo(x1, y1);
        }
        g.strokeStyle = DS.rgba(C.amber, 0.45);
        g.lineWidth = 1.3 * u;
        g.stroke();
        for (const f of S.found) {
          const [x, y] = this.proj(P[f], 0, G);
          DS.circle(g, x, y, 5 * u, C.amber, C.ink, 1.4 * u);
          DS.line(g, x, y, qx0, qy0, DS.rgba(C.amber, 0.6), 1.2 * u);
        }
      }
    },

    stats() {
      return [{ k: 'points', v: String(this.P.length) }, { k: 'same as the exact answer', v: this.recall === null ? '—' : `${Math.round(this.recall * 100)}%` }, { k: 'points checked by the last search', v: this.lastEval ? `${this.lastEval} of ${this.P.length}` : '—', accent: true }];
    },
  });
})();
