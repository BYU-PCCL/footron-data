/* Plain BST vs red-black tree — the same keys, side by side.
 *
 * The opener feeds both trees keys in sorted order, which is the worst case
 * for a plain binary search tree: every key goes right, and the "tree" is a
 * staircase as tall as the list is long. The red-black tree recolours and
 * rotates as it goes (each rotation is a visible step) and stays bushy.
 * The two heights at the bottom are the punchline.
 */
(function () {
  'use strict';
  const DS = window.DS, C = DS.C;
  const MAXN = 40;
  const SORTED_N = 26;

  let uid = 0;
  const mk = (key, red) => ({ key, l: null, r: null, p: null, red, id: ++uid, x: 0, y: 0, al: 0, hl: 0, spin: 0 });

  function height(n) { return n ? 1 + Math.max(height(n.l), height(n.r)) : 0; }
  function has(t, key) { let n = t.root; while (n) { if (key === n.key) return true; n = key < n.key ? n.l : n.r; } return false; }
  function pathTo(t, key) { const out = []; let n = t.root; while (n) { out.push(n); n = key < n.key ? n.l : n.r; } return out; }
  function attach(t, key, red) {
    const z = mk(key, red);
    let y = null, x = t.root;
    while (x) { y = x; x = key < x.key ? x.l : x.r; }
    z.p = y;
    if (!y) t.root = z;
    else if (key < y.key) y.l = z;
    else y.r = z;
    if (y) { z.x = y.x; z.y = y.y; }
    t.n++;
    return z;
  }
  function rotL(t, x) {
    const y = x.r;
    x.r = y.l; if (y.l) y.l.p = x;
    y.p = x.p;
    if (!x.p) t.root = y; else if (x === x.p.l) x.p.l = y; else x.p.r = y;
    y.l = x; x.p = y;
  }
  function rotR(t, x) {
    const y = x.l;
    x.l = y.r; if (y.r) y.r.p = x;
    y.p = x.p;
    if (!x.p) t.root = y; else if (x === x.p.r) x.p.r = y; else x.p.l = y;
    y.r = x; x.p = y;
  }
  const isRed = (n) => !!(n && n.red);
  const upTo = (n) => Array.from({ length: n }, (_, i) => i + 1);
  // key orders a visitor can race the two trees on
  const ORDERS = {
    sorted: { label: 'In order', note: '1, 2, 3 … the worst case for a plain tree', say: `inserting 1, 2, 3 … ${26} in order — the worst case for a plain tree`, keys: () => upTo(26) },
    reverse: { label: 'Backwards', note: '26, 25, 24 … just as bad, leaning the other way', say: 'inserting 26, 25, 24 … backwards — the plain tree leans left instead', keys: () => upTo(26).reverse() },
    zigzag: { label: 'Zig-zag', note: '1, 26, 2, 25 … squeezing in from both ends', say: 'inserting 1, 26, 2, 25, 3, 24 … — squeezing in from both ends', keys: () => { const a = upTo(26), out = []; while (a.length) { out.push(a.shift()); if (a.length) out.push(a.pop()); } return out; } },
    random: { label: 'Random', note: 'shuffled — the plain tree does fine by luck', say: 'the same keys, shuffled — random order is kind to a plain tree', keys: () => DS.shuffle(upTo(26)) },
  };

  DS.register({
    id: 'rbtree',
    group: 'Trees & order',
    title: 'Red-Black Tree',
    tag: 'self-balancing search tree',
    duration: 72,
    idea: "Feed keys in order and a plain tree turns into a line. A self-balancing one doesn't.",
    glance: 1,
    legend: [["#b9646e", "red node"], ["#3a4050", "black node"], ["amber", "search path · rotation"]],
    notes: [
      'A binary search tree puts smaller keys left and larger keys right. Search follows one path from the root.',
      'Feed it keys in sorted order and every key goes right. The “tree” becomes a list, and search becomes a walk.',
      'The red-black tree follows two rules: no red node has a red child, and every path down has the same number of black nodes.',
      'When a new red node breaks a rule, the tree recolours — or rotates three nodes, a local pivot that keeps the order.',
      'Those rules guarantee the height stays under 2·log₂ n. Java’s TreeMap, C++’s std::map and the Linux scheduler use this tree.',
    ],
    actions: [
      { id: 'sorted', label: 'Keys in order' },
      { id: 'reverse', label: 'Keys backwards' },
      { id: 'zigzag', label: 'Keys zig-zag' },
      { id: 'random', label: 'Keys shuffled' },
      { id: 'one', label: 'Insert one' },
      { id: 'clear', label: 'Clear' },
    ],

    init() {
      this.steps = new DS.Steps();
      this.reset();
      this.phase = 0;
      this.rot = 0;
      this.recolor = 0;
      this.event = null;
    },

    reset() {
      this.event = null;
      this.bst = { root: null, n: 0 };
      this.rb = { root: null, n: 0 };
      this.ghosts = [];
      this.rot = 0;
      this.recolor = 0;
    },

    geo() {
      const S = DS.stage, u = DS.u;
      const gap = 60 * u;
      const hw = (S.w - gap) / 2;
      return {
        // headroom above the roots for the rotation marker; titles sit by the heights
        L: { x: S.x, w: hw, y: S.y + 50 * u, h: S.h - 150 * u },
        R: { x: S.x + hw + gap, w: hw, y: S.y + 50 * u, h: S.h - 150 * u },
        hy: S.y1 - 26 * u,
        mid: S.x + hw + gap / 2,
      };
    },

    layout(t, box, dt, snap) {
      const nodes = [];
      const walk = (n, d) => { if (!n) return; walk(n.l, d + 1); nodes.push([n, d]); walk(n.r, d + 1); };
      walk(t.root, 0);
      const n = nodes.length, h = Math.max(1, height(t.root));
      const u = DS.u;
      const lh = Math.min(62 * u, box.h / Math.max(1, h - 1 + 0.5));
      const sx = box.w / Math.max(n, 12);
      const off = (box.w - sx * n) / 2;
      // Nodes are laid out in key order, one column each, so no two share a column:
      // the radius only has to fit the column, not the level height. That keeps the
      // plain tree's staircase readable as it grows, instead of shrinking to dots.
      const r = DS.clamp(sx * 0.42, 3 * u, 19 * u);
      nodes.forEach(([nd, d], i) => {
        const tx = box.x + off + (i + 0.5) * sx, ty = box.y + d * lh;
        if (nd.x === 0 && nd.y === 0) { nd.x = tx; nd.y = ty - 24 * u; }
        nd.x = snap ? tx : DS.ease(nd.x, tx, dt, 7);
        nd.y = snap ? ty : DS.ease(nd.y, ty, dt, 7);
        nd.al = DS.ease(nd.al, 1, dt, 6);
        nd.hl = DS.ease(nd.hl, 0, dt, 2.2);
        nd.spin = DS.ease(nd.spin, 0, dt, 2);
      });
      t.r = r;
      t.h = height(t.root);
    },

    *insertGen(key) {
      if (this.rb.n >= MAXN) { DS.say('both trees are full — clear to start again', 'warn'); return; }
      if (has(this.rb, key)) return;
      const pb = pathTo(this.bst, key), pr = pathTo(this.rb, key);
      const L = Math.max(pb.length, pr.length);
      const dt = Math.min(0.06, 0.45 / Math.max(1, L));
      for (let i = 0; i < L; i++) {
        if (pb[i]) pb[i].hl = 1;
        if (pr[i]) pr[i].hl = 1;
        yield dt;
      }
      attach(this.bst, key, false).hl = 1;
      const z = attach(this.rb, key, true);
      z.hl = 1;
      yield 0.25;
      yield* this.fixGen(z);
      DS.say(`insert ${key}  ·  search path: plain ${pb.length + 1} nodes, red-black ${pr.length + 1}`, pb.length > pr.length + 2 ? 'warn' : '');
    },

    *fixGen(z) {
      const t = this.rb;
      while (z.p && z.p.red) {
        const p = z.p, gp = p.p;
        const left = p === gp.l;
        const uncle = left ? gp.r : gp.l;
        if (isRed(uncle)) {
          p.red = false; uncle.red = false; gp.red = true;
          p.hl = uncle.hl = gp.hl = 1;
          this.recolor++;
          this.event = { text: 'recolour', node: gp, t: 1 };
          DS.say(`red parent, red uncle  →  recolour around ${gp.key}`);
          yield 0.4;
          z = gp;
        } else {
          if (left && z === p.r) { z = p; rotL(t, z); this.rot++; z.spin = 1; this.event = { text: 'rotate left', node: z.p, dir: -1, t: 1 }; DS.say(`zig-zag  →  rotate left at ${z.key}`); yield 0.6; }
          else if (!left && z === p.l) { z = p; rotR(t, z); this.rot++; z.spin = 1; this.event = { text: 'rotate right', node: z.p, dir: 1, t: 1 }; DS.say(`zig-zag  →  rotate right at ${z.key}`); yield 0.6; }
          const pp = z.p, g2 = pp.p;
          pp.red = false; g2.red = true;
          if (left) rotR(t, g2); else rotL(t, g2);
          this.rot++;
          pp.hl = 1; g2.spin = 1;
          this.event = { text: left ? 'rotate right' : 'rotate left', node: pp, dir: left ? 1 : -1, t: 1 };
          DS.say(`red–red in a line  →  rotate ${left ? 'right' : 'left'} at ${g2.key}, ${pp.key} rises`, 'good');
          yield 0.7;
        }
      }
      if (t.root.red) { t.root.red = false; yield 0.2; }
    },

    act(id) {
      const s = this.steps;
      if (s.length > 4 && id !== 'clear' && !ORDERS[id]) return;
      if (ORDERS[id]) this.race(id);
      else if (id === 'one') {
        s.run(() => {
          let k = 0;
          for (let t = 0; t < 200 && (!k || has(this.rb, k)); t++) k = DS.ri(1, 99);
          return this.insertGen(k);
        });
      } else if (id === 'clear') {
        s.clear();
        this.clear();
        DS.say('cleared');
      }
    },

    // Race both trees on one key order from scratch.
    race(name) {
      const o = ORDERS[name];
      if (!o) return false;
      const s = this.steps;
      this.order = name;
      s.clear();
      s.run(() => { this.clear(); return 0.6; });
      s.run(() => { DS.say(o.say); return 0.6; });
      o.keys().forEach((k) => s.run(() => this.insertGen(k)));
      s.run(() => this.verdict());
      return true;
    },
    input(name, value) { return name === 'order' ? this.race(value) : false; },
    phone() {
      const n = this.rb.n;
      return {
        order: this.order || null,
        orders: Object.entries(ORDERS).map(([id, o]) => ({ id, label: o.label, note: o.note })),
        n,
        plain: height(this.bst.root),
        redblack: height(this.rb.root),
        best: n ? Math.ceil(Math.log2(n + 1)) : 0,
      };
    },

    clear() {
      const push = (n) => { if (!n) return; this.ghosts.push(n); push(n.l); push(n.r); };
      push(this.bst.root); push(this.rb.root);
      const g = this.ghosts;
      this.reset();
      this.ghosts = g;
    },

    verdict() {
      const hb = height(this.bst.root), hr = height(this.rb.root);
      DS.say(`${this.rb.n} keys  ·  plain tree height ${hb}  ·  red-black height ${hr}  ·  ${this.rot} rotations`, hb > hr + 2 ? 'good' : '');
      return 4;
    },

    auto() {
      this.act(this.phase % 2 === 0 ? 'sorted' : 'random');
      this.phase++;
    },

    update(dt, auto) {
      this.steps.update(dt);
      if (auto && !this.steps.busy) this.auto();
      const G = this.geo();
      this.layout(this.bst, G.L, dt);
      this.layout(this.rb, G.R, dt);
      this.ghosts.forEach((n) => { n.al = DS.ease(n.al, 0, dt, 8); });
      if (this.event) { this.event.t -= dt / 1.4; if (this.event.t <= 0) this.event = null; }
      this.ghosts = this.ghosts.filter((n) => n.al > 0.02);
    },

    drawTree(g, t, rb) {
      const u = DS.u, r = t.r || 10 * u;
      const edges = (n) => {
        if (!n) return;
        for (const c of [n.l, n.r]) {
          if (!c) continue;
          DS.line(g, n.x, n.y, c.x, c.y, DS.rgba(C.dim, 0.32 * c.al), 1.3 * u);
          edges(c);
        }
      };
      g.lineCap = 'round';
      edges(t.root);
      const nodes = (n) => {
        if (!n) return;
        nodes(n.l); nodes(n.r);
        g.globalAlpha = n.al;
        if (n.hl > 0.05) DS.halo(g, n.x, n.y, r * 2.6, C.amber, 0.35 * n.hl);
        let fill, stroke;
        if (rb) { fill = n.red ? '#b9646e' : '#171b24'; stroke = n.red ? '#e19aa1' : '#8b93a6'; }
        else { fill = '#243044'; stroke = '#62708b'; }
        DS.circle(g, n.x, n.y, r, fill, n.hl > 0.3 ? C.amber : stroke, (n.hl > 0.3 ? 2.2 : 1.3) * u);
        if (n.spin > 0.05) DS.circle(g, n.x, n.y, r * (1.5 + 0.6 * (1 - n.spin)), null, DS.rgba(C.amber, n.spin * 0.8), 1.6 * u);
        if (r >= 8 * u) DS.text(g, String(n.key), n.x, n.y + 0.5 * u, { size: Math.max(10.5 * u, r * 0.85), mono: true, weight: 500, color: C.ink });
        g.globalAlpha = 1;
      };
      nodes(t.root);
    },

    // what the red-black tree just did, pinned to the node it happened at: a curved
    // arrow showing which way the rotation turned, and the word for it
    drawEvent(g) {
      const e = this.event, u = DS.u;
      if (!e || !e.node || e.node.al < 0.5) return;
      const n = e.node, r = this.rb.r || 10 * u, a = DS.smooth(Math.min(1, e.t * 1.6));
      if (e.dir) {
        const R = r * 2.1, a0 = -Math.PI * 0.85, a1 = -Math.PI * 0.15;
        const [from, to] = e.dir > 0 ? [a0, a1] : [a1, a0];
        g.beginPath();
        g.arc(n.x, n.y, R, from, to, e.dir < 0);
        g.strokeStyle = DS.rgba(C.amber, 0.9 * a);
        g.lineWidth = 2.6 * u;
        g.stroke();
        const hx = n.x + Math.cos(to) * R, hy = n.y + Math.sin(to) * R;
        const tang = to + (e.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
        g.globalAlpha = a;
        DS.arrow(g, hx - Math.cos(tang) * 8 * u, hy - Math.sin(tang) * 8 * u, hx, hy, C.amber, 2.6 * u, 10 * u);
        g.globalAlpha = 1;
      }
      // the word goes beside the arc, on whichever side has room
      const right = n.x < this.geo().R.x + this.geo().R.w * 0.75;
      const tx = n.x + (right ? 1 : -1) * (r * 2.1 + 10 * u), ty = n.y - r * 1.5;
      g.font = DS.font(16 * u, { mono: true, weight: 600 });
      const w = g.measureText(e.text).width + 16 * u;
      DS.box(g, right ? tx - 4 * u : tx - w + 4 * u, ty - 12 * u, w, 24 * u, 12 * u, DS.rgba(C.bg, 0.85 * a));
      DS.text(g, e.text, right ? tx + 4 * u : tx - 4 * u, ty, { size: 16 * u, mono: true, weight: 600, color: DS.rgba(C.amber, a), align: right ? 'left' : 'right' });
    },

    draw(g) {
      const G = this.geo(), u = DS.u;
      DS.line(g, G.mid, DS.stage.y + 10 * u, G.mid, G.hy + 10 * u, DS.rgba(C.dim, 0.12), 1 * u);
      DS.text(g, 'PLAIN BINARY SEARCH TREE', G.L.x + G.L.w / 2, G.hy - 34 * u, { size: 15 * u, mono: true, color: C.dim });
      DS.text(g, 'RED-BLACK TREE', G.R.x + G.R.w / 2, G.hy - 34 * u, { size: 15 * u, mono: true, color: C.dim });

      this.ghosts.forEach((n) => { g.globalAlpha = n.al; DS.circle(g, n.x, n.y, 6 * u, DS.rgba(C.dim, 0.4)); });
      g.globalAlpha = 1;
      this.drawTree(g, this.bst, false);
      this.drawTree(g, this.rb, true);
      this.drawEvent(g);

      const hb = this.bst.h || 0, hr = this.rb.h || 0;
      const bad = hb > hr + 2;
      DS.text(g, `height ${hb}`, G.L.x + G.L.w / 2, G.hy, { size: 22 * u, weight: 300, mono: true, color: bad ? C.rose : C.ink });
      DS.text(g, `height ${hr}`, G.R.x + G.R.w / 2, G.hy, { size: 22 * u, weight: 300, mono: true, color: bad ? C.teal : C.ink });
    },

    stats() {
      return [{ k: 'keys', v: String(this.rb.n) }, { k: 'rotations', v: String(this.rot) }, { k: 'height · plain tree vs red-black', v: `${this.bst.h || 0} vs ${this.rb.h || 0}`, accent: true }];
    },

    resize() {
      if (!this.rb) return;          // the engine may resize before the first init()
      const G = this.geo();
      this.layout(this.bst, G.L, 0, true);
      this.layout(this.rb, G.R, 0, true);
    },
  });
})();
