/* Trie (prefix tree), laid out radially.
 *
 * The root is the empty string at the centre; every step outward is one more
 * letter. Words that share a beginning share the path to it, so the picture
 * is literally a map of shared prefixes: thick trunks where many words agree,
 * fine twigs where they part. Each first letter gets its own hue. Autocomplete
 * is then just "walk the prefix, light everything below it".
 */
(function () {
  'use strict';
  const DS = window.DS, C = DS.C;

  const WORDS = (
    'star start started starting stare stark starling starch stack stage stain stair stake stamp stand ' +
    'standard stanza staple car card care career careful cargo carpet carrot cart carton cartoon cat catch ' +
    'category cattle can canal candle candy cane canoe canyon tree trek trend trial triangle tribe trick ' +
    'trim trip trio trace track trade train tram trap travel tray treat tread ' +
    'play plan plane planet plank plant plate platform plaza plead pleasant please plenty plot plow plum ' +
    'bat batch bath baton battle bay beach beam bean bear beard beat bed bee beef been ' +
    'map maple marble march margin marine mark market marsh mask mast master mat match mate math ' +
    'sun sunday sunny sunrise sunset super supper supply support sure surf surface surge ' +
    'read ready real realm reap rear reason rebel recall recipe record red reduce reef ' +
    'in inch income index indigo infant inform ink inn inner input insect inside ' +
    'go goal goat gold golden golf gone good goose gopher gorge'
  ).split(' ');

  let uid = 0;
  const mk = (ch, parent) => ({
    ch, parent, kids: new Map(), end: false, depth: parent ? parent.depth + 1 : 0,
    id: ++uid, x: 0, y: 0, al: 0, hl: 0, w: 1, ang: 0, hue: parent && parent.hue !== undefined ? parent.hue : undefined,
  });

  DS.register({
    id: 'trie',
    group: 'Text',
    title: 'Trie',
    tag: 'prefix tree',
    duration: 62,
    idea: "Words that start the same share a branch — that's how autocomplete works.",
    glance: 1,
    legend: [["amber", "word being added · suggestions"], ["teal", "dot = a word ends here"]],
    notes: [
      'The centre is the empty string. Each step outward adds one letter, and a dot marks where a word ends.',
      'Words that share a beginning share a path: “car”, “card”, “care” and “career” are one branch.',
      'Looking a word up takes one step per letter — no matter how many millions of words are stored.',
      'Autocomplete: walk down the prefix you typed, then everything below that node is a suggestion.',
      'Phone keyboards, spell checkers and internet routers (matching address prefixes) all use tries.',
    ],
    actions: [
      { id: 'add', label: 'Add a word' },
      { id: 'fill', label: 'Add ×10' },
      { id: 'complete', label: 'Autocomplete' },
      { id: 'clear', label: 'Clear' },
    ],

    init() {
      this.root = mk('', null);
      this.root.al = 1;
      this.steps = new DS.Steps();
      this.pool = DS.shuffle(WORDS);
      this.pi = 0;
      this.words = new Set();
      this.letters = 0;
      this.path = [];
      this.sub = null;
      this.labels = [];
      this.ghosts = [];
      this.count = 0;
      for (let i = 0; i < 18; i++) this.addQuiet(this.nextWord());
      this.layout(true);
    },

    nextWord() {
      for (let t = 0; t < this.pool.length; t++) {
        const w = this.pool[this.pi++ % this.pool.length];
        if (!this.words.has(w)) return w;
      }
      return null;
    },
    hueOf(ch) { return DS.HUES[(ch.charCodeAt(0) - 97 + 26) % DS.HUES.length]; },
    child(n, ch) {
      let k = n.kids.get(ch);
      let fresh = false;
      if (!k) {
        k = mk(ch, n);
        if (n === this.root) k.hue = this.hueOf(ch);
        k.x = n.x; k.y = n.y;
        n.kids.set(ch, k);
        this.count++;
        fresh = true;
      }
      return [k, fresh];
    },
    addQuiet(w) {
      if (!w) return;
      let n = this.root;
      for (const ch of w) n = this.child(n, ch)[0];
      n.end = true;
      this.words.add(w);
      this.letters += w.length;
    },

    geo() {
      const S = DS.stage;
      return { cx: S.cx, cy: S.cy, rx: S.w * 0.47, ry: S.h * 0.52 };
    },

    layout(snap) {
      const G = this.geo();
      let maxD = 1;
      const weigh = (n) => {
        if (n.depth > maxD) maxD = n.depth;
        let w = n.end && n.kids.size ? 0.6 : 0;
        for (const k of n.kids.values()) w += weigh(k);
        n.w = n.kids.size ? w : 1;
        return n.w;
      };
      weigh(this.root);
      this.maxD = Math.max(8, maxD);
      const place = (n, a0, a1) => {
        n.ang = (a0 + a1) / 2;
        const rho = n.depth / this.maxD;
        n.tx = G.cx + Math.cos(n.ang) * rho * G.rx;
        n.ty = G.cy + Math.sin(n.ang) * rho * G.ry;
        if (snap) { n.x = n.tx; n.y = n.ty; n.al = 1; }
        const kids = [...n.kids.values()].sort((a, b) => (a.ch < b.ch ? -1 : 1));
        const tot = kids.reduce((s, k) => s + k.w, 0) + (n.end && kids.length ? 0.6 : 0);
        let a = a0 + (n.end && kids.length ? ((a1 - a0) * 0.3) / tot : 0);
        for (const k of kids) {
          const span = ((a1 - a0) * k.w) / tot;
          place(k, a, a + span);
          a += span;
        }
      };
      place(this.root, -Math.PI / 2, Math.PI * 1.5);
    },

    *addGen(w) {
      if (!w) { DS.say('every word is already in', 'warn'); return; }
      let n = this.root, shared = 0, made = 0;
      this.path = [n];
      this.sub = null;
      for (const ch of w) {
        const [k, fresh] = this.child(n, ch);
        if (fresh) { made++; this.layout(); }
        else shared++;
        k.hl = 1;
        n = k;
        this.path.push(n);
        yield fresh ? 0.13 : 0.1;
      }
      const was = n.end;
      n.end = true;
      this.words.add(w);
      this.letters += w.length;
      this.layout();
      this.labels = [{ n, w, t: 3.5 }];
      DS.say(
        was ? `“${w}” was already there`
          : `add “${w}”  ·  ${shared} letter${shared === 1 ? '' : 's'} shared  ·  ${made} new node${made === 1 ? '' : 's'}`,
        shared >= 3 ? 'good' : ''
      );
      yield 0.55;
    },

    *completeGen() {
      const ws = [...this.words];
      if (!ws.length) return;
      const base = DS.pick(ws);
      const p = base.slice(0, Math.min(base.length, DS.pick([2, 2, 3])));
      let n = this.root;
      this.path = [n];
      this.labels = [];
      DS.say(`autocomplete “${p}…”`);
      for (const ch of p) {
        n = n.kids.get(ch);
        n.hl = 1;
        this.path.push(n);
        yield 0.2;
      }
      const found = [];
      const dfs = (m, s) => { if (m.end) found.push([m, s]); for (const [c, k] of [...m.kids].sort()) dfs(k, s + c); };
      dfs(n, p);
      this.sub = n;
      this.labels = found.slice(0, 18).map(([m, w]) => ({ n: m, w, t: 4.5 }));
      DS.say(`“${p}…”  →  ${found.slice(0, 7).map((f) => f[1]).join(', ')}${found.length > 7 ? ` … ${found.length} words` : ''}`, 'good');
      yield 4.2;
      this.sub = null;
    },

    act(id) {
      const s = this.steps;
      if (s.length > 6 && id !== 'clear') return;
      if (id === 'add') s.run(() => this.addGen(this.nextWord()));
      else if (id === 'fill') for (let k = 0; k < 10; k++) s.run(() => this.addGen(this.nextWord()));
      else if (id === 'complete') s.run(() => this.completeGen());
      else if (id === 'clear') {
        s.clear();
        const all = [];
        const walk = (n) => { for (const k of n.kids.values()) { all.push(k); walk(k); } };
        walk(this.root);
        this.ghosts = all;
        this.root = mk('', null);
        this.root.al = 1;
        this.words.clear();
        this.letters = 0;
        this.count = 0;
        this.path = [];
        this.labels = [];
        this.sub = null;
        this.layout(true);
        DS.say('cleared');
      }
    },

    auto() {
      if (this.words.size >= WORDS.length - 2) {
        this.steps.hold(2);
        this.steps.run(() => { this.act('clear'); return 0.8; });
        return;
      }
      this.tick = (this.tick || 0) + 1;
      if (this.tick % 8 === 0 && this.words.size > 20) this.act('complete');
      else this.act('add');
    },

    update(dt, auto) {
      this.steps.update(dt);
      if (auto && !this.steps.busy) this.auto();
      const walk = (n) => {
        n.x = DS.ease(n.x, n.tx, dt, 6);
        n.y = DS.ease(n.y, n.ty, dt, 6);
        n.al = DS.ease(n.al, 1, dt, 5);
        n.hl = DS.ease(n.hl, 0, dt, 0.9);
        for (const k of n.kids.values()) walk(k);
      };
      walk(this.root);
      this.labels.forEach((l) => { l.t -= dt; });
      this.labels = this.labels.filter((l) => l.t > 0);
      this.ghosts.forEach((n) => { n.al = DS.ease(n.al, 0, dt, 5); });
      this.ghosts = this.ghosts.filter((n) => n.al > 0.02);
    },

    draw(g) {
      const u = DS.u, G = this.geo();
      const inSub = (n) => { if (!this.sub) return false; for (let m = n; m; m = m.parent) if (m === this.sub) return true; return false; };
      const dimOthers = !!this.sub;

      // faint depth rings
      for (let d = 1; d <= this.maxD; d++) {
        g.beginPath();
        g.ellipse(G.cx, G.cy, (d / this.maxD) * G.rx, (d / this.maxD) * G.ry, 0, 0, Math.PI * 2);
        g.strokeStyle = DS.rgba(C.dim, 0.045);
        g.lineWidth = 1 * u;
        g.stroke();
      }

      this.ghosts.forEach((n) => { g.globalAlpha = n.al; DS.circle(g, n.x, n.y, 2 * u, DS.rgba(C.dim, 0.5)); });
      g.globalAlpha = 1;

      // edges, thicker where more words share the path
      g.lineCap = 'round';
      const edges = (n) => {
        for (const k of n.kids.values()) {
          const hot = k.hl > 0.05 || inSub(k);
          const a = (dimOthers && !inSub(k) && k.hl < 0.05 ? 0.18 : 0.6) * k.al;
          const col = hot ? C.amber : k.hue || C.dim;
          g.beginPath();
          g.moveTo(n.x, n.y);
          // bend toward the child's angle so branches fan instead of criss-crossing
          const mx = DS.lerp(n.x, k.x, 0.5), my = DS.lerp(n.y, k.y, 0.5);
          g.quadraticCurveTo(DS.lerp(mx, G.cx + (k.x - G.cx) * (n.depth / k.depth), 0.5), DS.lerp(my, G.cy + (k.y - G.cy) * (n.depth / k.depth), 0.5), k.x, k.y);
          g.strokeStyle = DS.rgba(col, hot ? Math.max(a, 0.9 * Math.max(k.hl, inSub(k) ? 1 : 0)) : a);
          g.lineWidth = (0.9 + Math.sqrt(k.w) * 0.55) * u;
          g.stroke();
          edges(k);
        }
      };
      edges(this.root);

      // nodes + letters
      const fs = DS.clamp(11 * u, 8, 22);
      const nodes = (n) => {
        for (const k of n.kids.values()) {
          const hot = k.hl > 0.05 || inSub(k);
          const dim = dimOthers && !inSub(k) && k.hl < 0.05;
          g.globalAlpha = k.al * (dim ? 0.35 : 1);
          const col = k.hue || C.dim;
          if (k.end) DS.circle(g, k.x, k.y, 3.6 * u, hot ? C.amber : col, DS.rgba(C.bg, 0.9), 1.4 * u);
          else DS.circle(g, k.x, k.y, 1.8 * u, hot ? C.amber : DS.rgba(col, 0.8));
          const ox = Math.cos(k.ang) * 9 * u, oy = Math.sin(k.ang) * 9 * u;
          DS.text(g, k.ch, k.x + ox, k.y + oy, { size: fs, mono: true, color: hot ? C.amber : DS.rgba(C.ink, k.depth <= 2 ? 0.85 : 0.55), weight: hot ? 600 : 400 });
          nodes(k);
        }
      };
      nodes(this.root);
      g.globalAlpha = 1;

      DS.circle(g, G.cx, G.cy, 6 * u, C.cell2, C.dim, 1.2 * u);
      DS.text(g, '“”', G.cx, G.cy + 20 * u, { size: 13 * u, mono: true, color: C.mute });

      // whole-word labels at the end of a path
      for (const l of this.labels) {
        const n = l.n, a = Math.min(1, l.t * 1.5);
        const flip = Math.cos(n.ang) < 0;
        g.save();
        g.translate(n.x + Math.cos(n.ang) * 20 * u, n.y + Math.sin(n.ang) * 20 * u);
        g.rotate(flip ? n.ang + Math.PI : n.ang);
        g.globalAlpha = a;
        DS.text(g, l.w, 0, 0, { size: 14 * u, mono: true, weight: 600, color: C.amber, align: flip ? 'right' : 'left' });
        g.restore();
      }
      g.globalAlpha = 1;
    },

    stats() {
      const saved = this.letters ? Math.round((100 * (this.letters - this.count)) / this.letters) : 0; return [{ k: 'words', v: String(this.words.size) }, { k: 'letters stored', v: `${this.count} of ${this.letters}` }, { k: 'letters saved by sharing', v: `${saved}%`, accent: true }];
    },

    resize() { if (this.root) this.layout(true); },
  });
})();
