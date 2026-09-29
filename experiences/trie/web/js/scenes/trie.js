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

  const FIRST = { s: C.violet, c: C.clay, t: C.sage, p: C.plum, b: C.sky, m: C.rose, r: C.blue, i: C.sand, g: '#9fb4b0' };

  let uid = 0;
  const mk = (ch, parent) => ({
    ch, parent, kids: new Map(), end: false, depth: parent ? parent.depth + 1 : 0,
    id: ++uid, cnt: 0, span: 0, x: 0, y: 0, al: 0, hl: 0, w: 1, ang: 0, hue: parent && parent.hue !== undefined ? parent.hue : undefined,
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
      for (let i = 0; i < 44; i++) this.addQuiet(this.nextWord());
      this.layout(true);
    },

    nextWord() {
      for (let t = 0; t < this.pool.length; t++) {
        const w = this.pool[this.pi++ % this.pool.length];
        if (!this.words.has(w)) return w;
      }
      return null;
    },
    // one hue per first letter; never amber (that means "happening now") or teal (word ends)
    hueOf(ch) { return FIRST[ch] || DS.wheel((ch.charCodeAt(0) - 97) / 26, 1, 64, 30); },
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
      return { cx: S.cx, cy: S.cy + S.h * 0.01, rx: S.w * 0.43, ry: S.h * 0.44 };
    },

    // radius for a depth: the first levels (the shared trunks) get more room
    rad(d) { return Math.pow(d / this.maxD, 0.62); },

    layout(snap) {
      const G = this.geo();
      let maxD = 1;
      const weigh = (n) => {
        if (n.depth > maxD) maxD = n.depth;
        let w = n.end && n.kids.size ? 0.6 : 0, cnt = n.end ? 1 : 0;
        for (const k of n.kids.values()) { w += weigh(k); cnt += k.cnt; }
        n.w = n.kids.size ? w : 1;
        n.cnt = cnt;                      // words that pass through this node
        return n.w;
      };
      weigh(this.root);
      this.maxD = Math.max(8, maxD);
      const place = (n, a0, a1) => {
        n.ang = (a0 + a1) / 2;
        const rho = this.rad(n.depth);
        n.span = a1 - a0;
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

    *completeGen(want) {
      const ws = [...this.words];
      if (!ws.length) return;
      if (want && !ws.some((w) => w.startsWith(want))) { DS.say(`no stored word starts with “${want}” yet`, 'warn'); return; }
      // prefer a prefix with a handful of completions, so the lit subtree has something in it
      const under = (q) => ws.filter((w) => w.startsWith(q)).length;
      let p = want || '', best = want ? Infinity : -1;
      for (let t = 0; t < 14 && !want; t++) {
        const base = DS.pick(ws), q = base.slice(0, Math.min(base.length, DS.pick([2, 2, 3])));
        const k = under(q), score = k >= 3 && k <= 14 ? 100 - t : k;
        if (score > best) { best = score; p = q; }
      }
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
      this.subP = p;
      this.labels = found.slice(0, 18).map(([m, w]) => ({ n: m, w, t: 4.5 }));
      DS.say(`“${p}…”  →  ${found.slice(0, 7).map((f) => f[1]).join(', ')}${found.length > 7 ? ` … ${found.length} words` : ''}`, 'good');
      yield 4.2;
      this.sub = null;
    },

    // what the phone offers: words not stored yet, and prefixes worth completing
    offer() {
      const out = [];
      for (let k = 0; k < this.pool.length && out.length < 8; k++) {
        const w = this.pool[(this.pi + k) % this.pool.length];
        if (!this.words.has(w) && !out.includes(w)) out.push(w);
      }
      return out;
    },
    prefixes() {
      const m = new Map();
      for (const w of this.words) { const p = w.slice(0, 2); m.set(p, (m.get(p) || 0) + 1); }
      return [...m.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([p, n]) => ({ p, n }));
    },
    input(name, value) {
      const s = this.steps;
      if (name === 'word' && typeof value === 'string') {
        if (!WORDS.includes(value) || this.words.has(value)) return false;
        s.run(() => this.addGen(value));
        return true;
      }
      if (name === 'prefix' && typeof value === 'string' && /^[a-z]{1,4}$/.test(value)) {
        s.run(() => this.completeGen(value));
        return true;
      }
      return false;
    },
    phone() {
      return {
        words: this.words.size,
        offer: this.offer(),
        prefixes: this.prefixes(),
        prefix: this.sub ? this.subP : null,
        suggestions: this.sub ? this.labels.map((l) => l.w).slice(0, 12) : [],
      };
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
      const u = DS.u, G = this.geo(), S = DS.stage;
      const inSub = (n) => { if (!this.sub) return false; for (let m = n; m; m = m.parent) if (m === this.sub) return true; return false; };
      const dimOthers = !!this.sub;
      const R = (G.rx + G.ry) / 2;

      // faint depth rings
      for (let d = 1; d <= this.maxD; d++) {
        const r = this.rad(d);
        g.beginPath();
        g.ellipse(G.cx, G.cy, r * G.rx, r * G.ry, 0, 0, Math.PI * 2);
        g.strokeStyle = DS.rgba(C.dim, d <= 2 ? 0.07 : 0.04);
        g.lineWidth = 1 * u;
        g.stroke();
      }

      this.ghosts.forEach((n) => { g.globalAlpha = n.al; DS.circle(g, n.x, n.y, 3 * u, DS.rgba(C.dim, 0.5)); });
      g.globalAlpha = 1;

      // edges, thicker where more words share the path
      g.lineCap = 'round';
      const edges = (n) => {
        for (const k of n.kids.values()) {
          const sub = inSub(k);
          const hot = k.hl > 0.05 || sub;
          const a = (dimOthers && !sub && k.hl < 0.05 ? 0.28 : 0.72) * k.al;
          const col = hot ? C.amber : k.hue || C.dim;
          g.beginPath();
          g.moveTo(n.x, n.y);
          // bend toward the child's angle so branches fan instead of criss-crossing
          const mx = DS.lerp(n.x, k.x, 0.5), my = DS.lerp(n.y, k.y, 0.5);
          const f = this.rad(n.depth) / this.rad(k.depth);
          g.quadraticCurveTo(DS.lerp(mx, G.cx + (k.x - G.cx) * f, 0.5), DS.lerp(my, G.cy + (k.y - G.cy) * f, 0.5), k.x, k.y);
          g.strokeStyle = DS.rgba(col, hot ? Math.max(a, 0.95 * Math.max(k.hl, sub ? 1 : 0)) : a);
          g.lineWidth = Math.min(16, 1.6 + Math.sqrt(k.cnt || 1) * 1.6) * u;
          g.stroke();
          edges(k);
        }
      };
      edges(this.root);

      // nodes + letters: the first two levels are big labelled discs, deeper ones dots
      const labelled = new Set(this.labels.map((l) => l.n));
      const nodes = (n) => {
        for (const k of n.kids.values()) {
          const sub = inSub(k);
          const hot = k.hl > 0.05 || sub;
          const dim = dimOthers && !sub && k.hl < 0.05;
          g.globalAlpha = k.al * (dim ? 0.35 : 1);
          const col = k.hue || C.dim;
          if (k.depth <= 2) {
            const room = k.span * this.rad(k.depth) * R;
            const r = DS.clamp(room * 0.42, 10 * u, (k.depth === 1 ? 18 : 12) * u);
            DS.circle(g, k.x, k.y, r, hot ? DS.mix(C.amber, C.bg, 0.55) : DS.mix(col, C.bg, 0.6), hot ? C.amber : col, 2 * u);
            if (k.end) DS.circle(g, k.x, k.y, r + 4 * u, null, C.teal, 2 * u);
            DS.text(g, k.ch, k.x, k.y + 0.5 * u, { size: Math.max(14 * u, r * 1.3), mono: true, weight: 600, color: hot ? C.amber : C.ink });
          } else {
            if (k.end) DS.circle(g, k.x, k.y, 5 * u, hot ? C.amber : C.teal, DS.rgba(C.bg, 0.9), 1.6 * u);
            else DS.circle(g, k.x, k.y, 2.8 * u, hot ? C.amber : DS.rgba(col, 0.9));
            // a letter only where there is room for it (or on the lit path)
            const room = k.span * this.rad(k.depth) * R;
            if ((hot || room > 13 * u) && !labelled.has(k)) {
              const ox = Math.cos(k.ang) * 13 * u, oy = Math.sin(k.ang) * 13 * u;
              DS.text(g, k.ch, k.x + ox, k.y + oy, { size: (hot ? 17 : 14) * u, mono: true, color: hot ? C.amber : DS.rgba(C.ink, k.depth === 3 ? 0.7 : 0.5), weight: hot ? 700 : 400 });
            }
          }
          nodes(k);
        }
      };
      nodes(this.root);
      g.globalAlpha = 1;

      DS.circle(g, G.cx, G.cy, 9 * u, C.cell2, C.dim, 1.6 * u);
      DS.text(g, '“”', G.cx, G.cy + 24 * u, { size: 15 * u, mono: true, color: C.mute });

      // the typed prefix, at the node it leads to
      if (this.sub && this.subP) {
        const n = this.sub, lbl = `${this.subP}…`;
        g.font = DS.font(26 * u, { mono: true, weight: 700 });
        const w = g.measureText(lbl).width + 26 * u, h = 42 * u;
        const px = -Math.sin(n.ang), py = Math.cos(n.ang);        // beside the branch, not on it
        const bx = DS.clamp(n.x - w / 2 + px * 48 * u, S.x, S.x1 - w), by = DS.clamp(n.y - h / 2 + py * 48 * u, S.y, S.y1 - h);
        DS.box(g, bx, by, w, h, 10 * u, DS.rgba(C.bg, 0.9), C.amber, 2 * u);
        DS.text(g, lbl, bx + w / 2, by + h / 2 + 1 * u, { size: 26 * u, mono: true, weight: 700, color: C.amber });
      }

      // whole-word labels at the end of a path; flipped inward if they would leave the stage
      const ls = 20 * u;
      g.font = DS.font(ls, { mono: true, weight: 600 });
      for (const l of this.labels) {
        const n = l.n, a = Math.min(1, l.t * 1.5);
        const len = g.measureText(l.w).width;
        const ca = Math.cos(n.ang), sa = Math.sin(n.ang);
        const off = 22 * u;
        const ex = n.x + ca * (off + len), ey = n.y + sa * (off + len);
        const out = ex < S.x || ex > S.x1 || ey < S.y || ey > S.y1;
        const dir = out ? -1 : 1;
        const flip = ca * dir < 0;
        g.save();
        g.translate(n.x + ca * off * dir, n.y + sa * off * dir);
        g.rotate(flip ? n.ang + Math.PI : n.ang);
        g.globalAlpha = a;
        g.font = DS.font(ls, { mono: true, weight: 600 });
        g.lineWidth = 5 * u;
        g.strokeStyle = DS.rgba(C.bg, 0.85);
        g.textAlign = flip ? 'right' : 'left';
        g.textBaseline = 'middle';
        g.strokeText(l.w, 0, 0);
        DS.text(g, l.w, 0, 0, { size: ls, mono: true, weight: 600, color: C.amber, align: flip ? 'right' : 'left' });
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
