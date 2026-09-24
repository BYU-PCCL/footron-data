/* Quadtree — space that subdivides itself where things are.
 *
 * A few hundred points drift in swirling flocks. Every frame the quadtree is
 * rebuilt from scratch (capacity 4 per cell), so the grid visibly condenses
 * around the flocks and relaxes in the empty space between them. A roaming
 * query circle asks "what's near here?" — only the cells it touches light up,
 * and the counter says how few points it had to actually look at.
 */
(function () {
  'use strict';
  const DS = window.DS, C = DS.C;
  const CAP = 4, MAXD = 9;
  const FLOCK = [C.teal, C.violet, C.sky, C.sage, C.plum];

  function node(x, y, w, h, d) { return { x, y, w, h, d, pts: [], kids: null }; }
  function insert(n, p) {
    while (n.kids) n = n.kids[(p.x >= n.x + n.w / 2 ? 1 : 0) + (p.y >= n.y + n.h / 2 ? 2 : 0)];
    n.pts.push(p);
    if (n.pts.length > CAP && n.d < MAXD) {
      const hw = n.w / 2, hh = n.h / 2;
      n.kids = [node(n.x, n.y, hw, hh, n.d + 1), node(n.x + hw, n.y, hw, hh, n.d + 1),
                node(n.x, n.y + hh, hw, hh, n.d + 1), node(n.x + hw, n.y + hh, hw, hh, n.d + 1)];
      const pts = n.pts;
      n.pts = null;
      for (const q of pts) insert(n, q);
    }
  }
  function hitsCircle(n, cx, cy, r) {
    const dx = Math.max(n.x - cx, 0, cx - (n.x + n.w));
    const dy = Math.max(n.y - cy, 0, cy - (n.y + n.h));
    return dx * dx + dy * dy <= r * r;
  }
  function query(n, cx, cy, r, out, visited) {
    if (!hitsCircle(n, cx, cy, r)) return;
    if (visited) visited.push(n);
    if (n.kids) { for (const k of n.kids) query(k, cx, cy, r, out, visited); return; }
    for (const p of n.pts) {
      out.checked++;
      const dx = p.x - cx, dy = p.y - cy;
      if (dx * dx + dy * dy <= r * r) out.hits.push(p);
    }
  }

  DS.register({
    id: 'quadtree',
    group: 'Space & graphs',
    title: 'Quadtree',
    tag: 'spatial index',
    duration: 58,
    idea: "Space splits into smaller squares only where things are crowded.",
    glance: 1,
    legend: [["#4a5877", "square edges"], ["amber", "search area & what it checked"]],
    notes: [
      'Any square holding more than four points splits into four smaller squares. Crowds get fine grids; empty space stays coarse.',
      'The whole tree is rebuilt from scratch every frame, sixty times a second, as the flocks move.',
      'The amber circle is a query. Only the squares it touches are opened — every other point is never even looked at.',
      'The faint lines join close neighbours, found with one small query per point instead of comparing every pair.',
      'Games use this for collisions, maps for “restaurants near me”, and image codecs to spend detail where it matters.',
    ],
    actions: [
      { id: 'burst', label: 'Add a flock' },
      { id: 'thin', label: 'Remove points' },
      { id: 'scatter', label: 'Scatter' },
      { id: 'query', label: 'Query on/off' },
      { id: 'links', label: 'Neighbours on/off' },
    ],

    init() {
      this.A = DS.stage.w / DS.stage.h;
      this.pts = [];
      this.t = Math.random() * 100;
      this.att = [0, 1, 2].map((k) => this.attractor(k));
      this.q = { x: this.A * 0.5, y: 0.5, r: 0.14, on: true };
      this.mouse = null;
      this.links = true;
      this.eventT = 7;
      this.res = { checked: 0, hits: [] };
      for (let k = 0; k < 3; k++) this.spawn(160, k);
      this.spawn(60, -1);
      this.build();
    },

    attractor(k) {
      return { k, ph: Math.random() * 6.28, w1: 0.07 + Math.random() * 0.06, w2: 0.09 + Math.random() * 0.07, x: 0, y: 0, spin: Math.random() < 0.5 ? -1 : 1 };
    },
    placeAtt(dt) {
      const A = this.A;
      this.att.forEach((a, i) => {
        a.x = A * (0.5 + 0.38 * Math.sin(this.t * a.w1 + a.ph + i * 2.1));
        a.y = 0.5 + 0.36 * Math.sin(this.t * a.w2 + a.ph * 1.7 + i);
      });
    },
    spawn(n, k, at) {
      const A = this.A;
      if (k < 0 || !this.att[k]) {
        for (let i = 0; i < n; i++) this.pts.push(this.pt(Math.random() * A, Math.random(), DS.ri(0, this.att.length - 1)));
        return;
      }
      this.placeAtt(0);
      const c = at || this.att[k];
      for (let i = 0; i < n; i++) {
        const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * 0.09;
        this.pts.push(this.pt(DS.clamp(c.x + Math.cos(a) * r, 0, A), DS.clamp(c.y + Math.sin(a) * r, 0, 1), k));
      }
    },
    pt(x, y, k) { return { x, y, vx: (Math.random() - 0.5) * 0.05, vy: (Math.random() - 0.5) * 0.05, k }; },

    build() {
      this.root = node(0, 0, this.A, 1, 0);
      for (const p of this.pts) insert(this.root, p);
    },

    act(id) {
      const A = this.A;
      if (id === 'burst') {
        if (this.pts.length > 1300) { DS.say('that’s plenty of points', 'warn'); return; }
        if (this.att.length < 5) this.att.push(this.attractor(this.att.length));
        const k = DS.ri(0, this.att.length - 1);
        this.spawn(140, k);
        DS.say(`+140 points  ·  the cells around the new flock split, and split again`, 'good');
      } else if (id === 'thin') {
        const n = Math.min(160, Math.max(0, this.pts.length - 60));
        this.pts = DS.shuffle(this.pts).slice(n);
        if (this.att.length > 2) this.att.pop();
        this.pts.forEach((p) => { if (p.k >= this.att.length) p.k = DS.ri(0, this.att.length - 1); });
        DS.say(`−${n} points  ·  empty cells merge back into their parents`);
      } else if (id === 'scatter') {
        this.pts.forEach((p) => { p.x = Math.random() * A; p.y = Math.random(); p.vx = p.vy = 0; });
        DS.say('scattered  ·  uniform points give an even, shallow tree — for a moment');
      } else if (id === 'query') {
        this.q.on = !this.q.on;
        DS.say(this.q.on ? 'range query on' : 'range query off');
      } else if (id === 'links') {
        this.links = !this.links;
        DS.say(this.links ? 'neighbour links on' : 'neighbour links off');
      }
    },

    pointer(type, x, y) {
      const S = DS.stage;
      const nx = (x - S.x) / S.h, ny = (y - S.y) / S.h;
      const inside = nx >= 0 && nx <= this.A && ny >= 0 && ny <= 1;
      if (type === 'move') this.mouse = inside ? { x: nx, y: ny, t: DS.time } : null;
      if (type === 'leave') this.mouse = null;
      if (type === 'down' && inside) {
        if (this.pts.length > 1300) return;
        this.spawn(90, DS.ri(0, this.att.length - 1), { x: nx, y: ny });
        DS.say('+90 points where you clicked', 'good');
      }
    },

    update(dt, auto) {
      const A = this.A;
      this.t += dt;
      this.placeAtt(dt);
      const damp = Math.exp(-1.4 * dt);
      for (const p of this.pts) {
        const a = this.att[p.k % this.att.length];
        let dx = a.x - p.x, dy = a.y - p.y;
        const d = Math.sqrt(dx * dx + dy * dy) + 0.02;
        dx /= d; dy /= d;
        const pull = 0.22 * Math.min(1, d * 4);
        p.vx += (dx * pull - dy * 0.28 * a.spin + (Math.random() - 0.5) * 0.25) * dt;
        p.vy += (dy * pull + dx * 0.28 * a.spin + (Math.random() - 0.5) * 0.25) * dt;
        p.vx *= damp; p.vy *= damp;
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.x < 0) { p.x = 0; p.vx = Math.abs(p.vx); }
        if (p.x > A) { p.x = A; p.vx = -Math.abs(p.vx); }
        if (p.y < 0) { p.y = 0; p.vy = Math.abs(p.vy); }
        if (p.y > 1) { p.y = 1; p.vy = -Math.abs(p.vy); }
        if (Math.random() < 0.02 * dt) p.k = DS.ri(0, this.att.length - 1);
      }
      if (dt > 0 || !this.root) this.build();

      // query position: the mouse if it's here; otherwise it tours the flocks,
      // circling each one's attractor at an offset so it sweeps through the crowd
      const q = this.q;
      if (this.mouse && DS.time - this.mouse.t < 6) { q.x = DS.ease(q.x, this.mouse.x, dt || 0.016, 12); q.y = DS.ease(q.y, this.mouse.y, dt || 0.016, 12); }
      else if (dt > 0) {
        // where each flock actually is (its points trail their attractor)
        const na = this.att.length, cx = new Float64Array(na), cy = new Float64Array(na), cn = new Float64Array(na);
        for (const p of this.pts) { const f = p.k % na; cx[f] += p.x; cy[f] += p.y; cn[f]++; }
        this.tourT = (this.tourT || 0) - dt;
        if (this.tourT <= 0 || this.tour === undefined || this.tour >= na || cn[this.tour] < 25) {
          let nx = ((this.tour === undefined ? DS.ri(0, na - 1) : this.tour) + 1) % na;
          for (let j = 0; j < na && cn[nx] < 25; j++) nx = (nx + 1) % na;
          this.tour = nx;
          this.tourT = 7 + Math.random() * 3;
        }
        const f = this.tour, ph = this.t * 0.5;
        const fx = cn[f] ? cx[f] / cn[f] : A / 2, fy = cn[f] ? cy[f] / cn[f] : 0.5;
        const tx = DS.clamp(fx + 0.08 * Math.cos(ph), q.r * 0.6, A - q.r * 0.6);
        const ty = DS.clamp(fy + 0.08 * Math.sin(ph), q.r * 0.6, 1 - q.r * 0.6);
        // a gentle speed limit so the hop between flocks glides rather than lunges
        const e = 1 - Math.exp(-1.6 * dt);
        let mx = (tx - q.x) * e, my = (ty - q.y) * e;
        const lim = 0.5 * dt, d = Math.hypot(mx, my);
        if (d > lim) { mx *= lim / d; my *= lim / d; }
        q.x += mx; q.y += my;
      }
      this.visited = [];
      this.res = { checked: 0, hits: [] };
      if (q.on) query(this.root, q.x, q.y, q.r, this.res, this.visited);

      if (auto && dt > 0) {
        this.eventT -= dt;
        if (this.eventT <= 0) {
          this.eventT = 9 + Math.random() * 5;
          const n = this.pts.length;
          if (n < 500 || (n < 1000 && Math.random() < 0.6)) this.act('burst');
          else this.act('thin');
        }
      }
    },

    draw(g) {
      const S = DS.stage, u = DS.u, k = S.h;
      const X = (x) => S.x + x * k, Y = (y) => S.y + y * k;
      let depth = 0, cells = 0;

      // the tree: each split drawn as its cross, fainter as it gets finer
      const byDepth = Array.from({ length: MAXD + 1 }, () => []);
      const walk = (n) => {
        cells++;
        if (n.d > depth) depth = n.d;
        if (!n.kids) return;
        byDepth[n.d].push(n);
        n.kids.forEach(walk);
      };
      walk(this.root);
      this.cells = cells;
      this.depth = depth;

      // visited cells under the query
      if (this.q.on) {
        for (const n of this.visited) {
          if (n.kids) continue;
          g.fillStyle = DS.rgba(C.amber, 0.07);
          g.fillRect(X(n.x), Y(n.y), n.w * k, n.h * k);
          g.strokeStyle = DS.rgba(C.amber, 0.35);
          g.lineWidth = 1 * u;
          g.strokeRect(X(n.x), Y(n.y), n.w * k, n.h * k);
        }
      }

      for (let d = 0; d <= MAXD; d++) {
        if (!byDepth[d].length) continue;
        g.beginPath();
        for (const n of byDepth[d]) {
          const mx = X(n.x + n.w / 2), my = Y(n.y + n.h / 2);
          g.moveTo(mx, Y(n.y)); g.lineTo(mx, Y(n.y + n.h));
          g.moveTo(X(n.x), my); g.lineTo(X(n.x + n.w), my);
        }
        g.strokeStyle = DS.mix('#4a5877', C.teal, d / MAXD, 0.55 - d * 0.035);
        g.lineWidth = Math.max(0.6, (1.5 - d * 0.1)) * u;
        g.stroke();
      }
      g.strokeStyle = DS.rgba(C.dim, 0.35);
      g.lineWidth = 1.2 * u;
      g.strokeRect(X(0), Y(0), this.A * k, k);

      // neighbour links, found with a small query per point
      let links = 0;
      if (this.links) {
        const r = 0.032, r2 = r * r;
        g.beginPath();
        const out = { checked: 0, hits: [] };
        for (const p of this.pts) {
          out.hits.length = 0;
          query(this.root, p.x, p.y, r, out, null);
          for (const o of out.hits) {
            if (o === p || o.x < p.x) continue;
            const dx = o.x - p.x, dy = o.y - p.y;
            if (dx * dx + dy * dy > r2) continue;
            g.moveTo(X(p.x), Y(p.y));
            g.lineTo(X(o.x), Y(o.y));
            if (++links > 4000) break;
          }
          if (links > 4000) break;
        }
        g.strokeStyle = DS.rgba(C.sky, 0.16);
        g.lineWidth = 0.9 * u;
        g.stroke();
      }

      // points, batched by flock
      const pr = 3 * u;
      for (let f = 0; f < FLOCK.length; f++) {
        g.beginPath();
        for (const p of this.pts) {
          if (p.k % FLOCK.length !== f) continue;
          g.moveTo(X(p.x) + pr, Y(p.y));
          g.arc(X(p.x), Y(p.y), pr, 0, 6.2832);
        }
        g.fillStyle = DS.rgba(FLOCK[f], 0.85);
        g.fill();
      }

      // the query
      if (this.q.on) {
        const q = this.q;
        g.beginPath();
        for (const p of this.res.hits) { g.moveTo(X(p.x) + pr * 1.5, Y(p.y)); g.arc(X(p.x), Y(p.y), pr * 1.5, 0, 6.2832); }
        g.fillStyle = C.amber;
        g.fill();
        DS.circle(g, X(q.x), Y(q.y), q.r * k, DS.rgba(C.amber, 0.05), DS.rgba(C.amber, 0.85), 1.8 * u);
        const lab = `found ${this.res.hits.length}  ·  looked at ${this.res.checked} of ${this.pts.length}`;
        g.font = DS.font(15 * u, { mono: true, weight: 500 });
        const hw = g.measureText(lab).width / 2 + 4 * u;
        const lx = DS.clamp(X(q.x), S.x + hw, S.x1 - hw), above = Y(q.y) - q.r * k - 16 * u > S.y + 4 * u;
        const ly = above ? Y(q.y) - q.r * k - 16 * u : Y(q.y) + q.r * k + 18 * u;
        DS.text(g, lab, lx, ly,
          { size: 15 * u, mono: true, weight: 500, color: C.amber });
      }
      this.linkCount = links;
    },

    stats() {
      // Headline: what the tree looked at against what a plain scan must look at (everything).
      const n = this.pts.length, on = this.q.on;
      return [
        { k: 'found inside the circle', v: on ? String(this.res.hits.length) : '—' },
        { k: 'squares', v: String(this.cells || 0) },
        { k: 'points looked at · checking every point', v: on && n ? `${this.res.checked} vs ${n}` : '—', accent: true },
      ];
    },

    resize() {
      const A = DS.stage.w / DS.stage.h;
      if (this.pts && A !== this.A) {
        const s = A / this.A;
        this.pts.forEach((p) => { p.x *= s; });
        this.q.x *= s;
        this.A = A;
        this.build();
      }
    },
  });
})();
