/* Sequence CRDT for collaborative text: RGA, the Replicated Growable Array
 *   Roh, Jeon, Kim & Lee, "Replicated abstract data types", JPDC 2011;
 *   formulation as mechanised by Gomes, Kleppmann, Mulligan & Beresford,
 *   "Verifying strong eventual consistency in distributed systems", OOPSLA 2017.
 *   Convergence = strong eventual consistency (Shapiro et al., SSS 2011).
 *
 * Every character gets a unique ID (Lamport counter, replica) and is inserted
 * *after* the ID of the character to its left. To integrate an insert: find
 * the anchor, then skip every following element whose ID is greater than the
 * new one, and place it there. Concurrent inserts at the same spot therefore
 * land in descending-ID order on every replica, whatever order they arrive
 * in. Deletes only set a flag — the tombstone stays, because someone else may
 * be anchoring text to it.
 *
 * Honest scope (Kleppmann et al., PaPoC 2019; Weidner & Kleppmann, Fugue
 * 2023): RGA keeps *forward*-typed words together, as here, but can still
 * interleave text typed backwards; Fugue is the design that avoids that.
 *
 * The bottom panel replays the same edits the naive way — "insert at index
 * i" — and the two copies disagree forever. That is the problem CRDTs solve.
 */
(function () {
  'use strict';
  const DS = window.DS, C = DS.C;
  const REP = { A: { name: 'A', col: C.teal }, B: { name: 'B', col: C.violet } };
  const gt = (a, b) => a[0] > b[0] || (a[0] === b[0] && a[1] > b[1]);    // (counter, replica)
  const key = (id) => `${id[0]}${id[1]}`;

  function replica(name) { return { name, list: [], ctr: 0, out: [], naive: '' }; }
  function integrate(R, op) {
    if (op.type === 'del') { const e = R.list.find((x) => key(x.id) === key(op.id)); if (e) e.del = true; return; }
    if (R.list.some((x) => key(x.id) === key(op.id))) return;
    R.ctr = Math.max(R.ctr, op.id[0]);
    let j = op.anchor ? R.list.findIndex((x) => key(x.id) === key(op.anchor)) + 1 : 0;
    while (j < R.list.length && gt(R.list[j].id, op.id)) j++;
    R.list.splice(j, 0, { id: op.id, ch: op.ch, del: false, anchor: op.anchor, by: op.id[1], al: 0 });
  }
  const text = (R) => R.list.filter((e) => !e.del).map((e) => e.ch).join('');

  DS.register({
    id: 'crdt',
    group: 'Systems',
    title: 'CRDT — Collaborative Text',
    tag: 'RGA · Roh et al. 2011',
    duration: 70,
    idea: "Two people edit offline — when they reconnect, both copies match. No server needed.",
    glance: 1,
    preempt: false,          // interrupts its own operations safely (see act)
    legend: [["teal", "typed on laptop A"], ["violet", "typed on laptop B"], ["rose", "deleted (kept as a ghost)"], ["amber", "edits in flight"]],
    notes: [
      'Each letter gets a permanent name: a counter plus who typed it. New letters are placed “after” a named letter, never at a numbered position.',
      'If two people insert at the same spot, both copies use the same tie-break — the bigger name goes first — so they agree without talking.',
      'Deleted letters stay behind as invisible tombstones, because someone else may still be typing right after them.',
      'Replaying edits by position instead (“insert at 6”) leaves the two copies permanently different. That is the bug a CRDT removes.',
      'Automerge is built on RGA; Yjs uses a relative, YATA. Newer designs like Fugue (2023) also stop words typed backwards from interleaving.',
    ],
    actions: [
      { id: 'play', label: 'Replay the story' },
      { id: 'sync', label: 'Sync now' },
      { id: 'typeA', label: 'A types' },
      { id: 'typeB', label: 'B types' },
    ],

    init() {
      this.steps = new DS.Steps();
      this.reset();
    },
    // Fresh document state, but NOT a fresh step runner: the story calls this
    // from inside a generator that the current runner is executing.
    reset() {
      this.R = { A: replica('A'), B: replica('B') };
      this.wire = [];              // ops in flight {op, from, to, t}
      this.online = true;
      this.naive = null;
      this.showTree = true;
      this.phase = 0;
      this.flash = 0;
      this.lastState = null;
      this.seed('Hello!');
    },

    seed(s) {
      let prev = null;
      [...s].forEach((ch, i) => {
        const op = { type: 'ins', id: [i + 1, 'A'], ch, anchor: prev };
        integrate(this.R.A, op);
        integrate(this.R.B, op);
        prev = op.id;
      });
      for (const r of Object.values(this.R)) { r.list.forEach((e) => { e.al = 1; e.by = '0'; }); r.naive = s; }
    },

    // type `word` on replica r, starting after the visible char at index `at`
    *typeGen(r, word, at, quiet) {
      const R = this.R[r];
      if (!quiet) DS.say(`laptop ${r} types “${word.trim()}”${this.online === false || this.state === 'offline' ? ' — offline, so only its own copy changes' : ''}`);
      const vis = R.list.filter((e) => !e.del);
      let anchor = at < 0 ? null : vis[at].id;
      let idx = at + 1;
      for (const ch of word) {
        const op = { type: 'ins', id: [++R.ctr, r], ch, anchor };
        integrate(R, op);
        R.out.push(op);
        R.naiveOps = R.naiveOps || [];
        R.naiveOps.push({ type: 'ins', i: idx, ch });
        R.naive = R.naive.slice(0, idx) + ch + R.naive.slice(idx);
        idx++;
        anchor = op.id;
        yield 0.22;
      }
    },
    *deleteGen(r, at) {
      const R = this.R[r];
      const vis = R.list.filter((e) => !e.del);
      if (!vis[at]) return;
      const op = { type: 'del', id: vis[at].id };
      integrate(R, op);
      R.out.push(op);
      R.naiveOps = R.naiveOps || [];
      R.naiveOps.push({ type: 'del', i: at });
      R.naive = R.naive.slice(0, at) + R.naive.slice(at + 1);
      yield 0.4;
    },

    *syncGen() {
      this.online = true;
      DS.say('back online  ·  each side sends the other its edits');
      const A = this.R.A, B = this.R.B;
      const aOps = A.out.splice(0), bOps = B.out.splice(0);
      const naiveA = (A.naiveOps || []).splice(0), naiveB = (B.naiveOps || []).splice(0);
      // Everything goes on the wire at once (staggered by a start delay), so
      // an interrupted sync can never lose an edit.
      const n = Math.max(aOps.length, bOps.length);
      for (let k = 0; k < n; k++) {
        if (aOps[k]) this.wire.push({ op: aOps[k], from: 'A', to: 'B', t: -k * 0.2 });
        if (bOps[k]) this.wire.push({ op: bOps[k], from: 'B', to: 'A', t: -k * 0.2 });
      }
      // naive: replay the other side's index-based edits onto this side's text
      const replay = (txt, ops) => ops.reduce((s, o) => (o.type === 'ins' ? s.slice(0, o.i) + o.ch + s.slice(o.i) : s.slice(0, o.i) + s.slice(o.i + 1)), txt);
      A.naive = replay(A.naive, naiveB); B.naive = replay(B.naive, naiveA);
      while (this.wire.some((w) => !w.done)) yield 0.1;
      yield 0.4;
      this.naive = { A: A.naive, B: B.naive };
      const same = text(A) === text(B);
      DS.say(same ? `both copies now read “${text(A)}”  ·  identical, with every word in one piece` : 'still syncing…', same ? 'good' : '');
      yield 3;
    },

    *storyGen() {
      this.reset();
      this.inStory = true;
      DS.say('one document, two copies — on two laptops');
      yield 1.8;
      this.online = false;
      DS.say('the Wi-Fi drops  ·  both keep typing, in the same spot');
      yield 1.2;
      const a = this.typeGen('A', ' Alice', 4, true), b = this.typeGen('B', ' Bob', 4, true);
      for (;;) { const x = a.next(), y = b.next(); if (x.done && y.done) break; yield 0.24; }
      DS.say(`A sees “${text(this.R.A)}”   ·   B sees “${text(this.R.B)}”`, 'warn');
      yield 2;
      yield* this.syncGen();
      yield 1;
      // act two: a delete racing an insert right after the deleted letter
      this.online = false;
      DS.say('offline again  ·  B deletes the “!”, while A types after it');
      yield 1.2;
      const visB = text(this.R.B);
      yield* this.deleteGen('B', visB.length - 1);
      yield* this.typeGen('A', ' :)', text(this.R.A).length - 1, true);
      yield 1.2;
      yield* this.syncGen();
      DS.say(`“!” is gone, but its tombstone still anchors A’s “ :)”  ·  both read “${text(this.R.A)}”`, 'good');
      yield 3.5;
      this.inStory = false;
    },

    act(id) {
      const s = this.steps;
      // a visitor's edit takes over from the scripted story at once, keeping
      // the document as it stands (every edit is already integrated or on the wire)
      if (id !== 'play' && this.inStory) { s.clear(); this.inStory = false; }
      if (s.length > 2) return;
      if (id === 'play') { s.clear(); s.run(() => this.storyGen()); }
      else if (id === 'sync') s.run(() => this.syncGen());
      else if (id === 'typeA' || id === 'typeB') {
        const r = id === 'typeA' ? 'A' : 'B';
        s.run(() => {
          this.online = false;
          const words = r === 'A' ? [' hi', ' yes', ' ok', ' cat'] : [' no', ' dog', ' sun', ' up'];
          const vis = text(this.R[r]);
          return this.typeGen(r, DS.pick(words), DS.ri(-1, vis.length - 1));
        });
      }
    },

    auto() {
      this.steps.run(this.storyGen());
      this.steps.hold(2);
    },

    // offline · syncing · identical · (online but not yet matching)
    state() {
      const A = this.R.A, B = this.R.B;
      if (!this.online) return 'offline';
      if (this.wire.some((w) => !w.done) || A.out.length || B.out.length) return 'syncing';
      return text(A) === text(B) ? 'identical' : 'online';
    },

    panelW() { const S = DS.stage; return (S.w - Math.max(230 * DS.u, S.w * 0.14)) / 2; },
    // letter-box width: shrinks as the text grows, eased so boxes never pop
    cellW() { const n = Math.max(14, this.R.A.list.length, this.R.B.list.length); return Math.min(64 * DS.u, (this.panelW() - 24 * DS.u) / n); },

    update(dt, auto) {
      this.dt = dt;
      this.steps.update(dt);
      if (auto && !this.steps.busy) this.auto();
      for (const w of this.wire) {
        w.t += dt / 0.9;
        if (w.t >= 1 && !w.done) { w.done = true; integrate(this.R[w.to], w.op); }
      }
      this.wire = this.wire.filter((w) => w.t < 1.2);
      for (const r of Object.values(this.R)) r.list.forEach((e) => { e.al = DS.ease(e.al, 1, dt, 6); });
      // a flash the moment the two copies become identical again
      const st = this.state();
      if (st === 'identical' && this.lastState && this.lastState !== 'identical') this.flash = 1;
      this.lastState = st;
      this.cwE = this.cwE ? DS.ease(this.cwE, this.cellW(), dt, 5) : this.cellW();
      this.flash = DS.ease(this.flash || 0, 0, dt, 1.1);
    },

    draw(g) {
      const S = DS.stage, u = DS.u;
      const st = this.state();
      const stCol = { offline: C.rose, syncing: C.amber, identical: C.teal, online: C.dim }[st];
      const pw = this.panelW();
      const px = { A: S.x, B: S.x1 - pw };
      const py = S.y + 4 * u;
      const cw = this.cwE || this.cellW();
      const bh = cw * 1.22;
      const by = py + 40 * u;                        // letter-box row
      const ry = by + bh + 44 * u;                   // big readout
      const panelH = ry - py + 52 * u;

      const fit = (s, size, maxW, weight) => {
        g.font = DS.font(size, { weight });
        const w = g.measureText(s).width;
        return w > maxW ? Math.max(14 * u, size * maxW / w) : size;
      };

      const drawDoc = (r) => {
        const R = this.R[r], x0 = px[r];
        // the panel: its border says the connection state
        const off = st === 'offline';
        g.setLineDash(off ? [10 * u, 8 * u] : []);
        DS.box(g, x0, py, pw, panelH, 10 * u, DS.rgba(stCol, 0.05 + 0.12 * this.flash), DS.rgba(stCol, 0.55), (1.5 + 2 * this.flash) * u);
        g.setLineDash([]);
        DS.text(g, `LAPTOP ${r}`, x0 + 16 * u, py + 20 * u, { size: 17 * u, mono: true, weight: 600, color: REP[r].col, align: 'left' });
        if (R.out.length) DS.text(g, `${R.out.length} edit${R.out.length === 1 ? '' : 's'} waiting to send`, x0 + pw - 16 * u, py + 20 * u, { size: 15 * u, mono: true, color: C.amber, align: 'right' });
        const x1 = x0 + 12 * u;
        const ids = cw >= 34 * u;
        R.list.forEach((e, i) => {
          const x = x1 + i * cw;
          const col = e.by === 'A' ? C.teal : e.by === 'B' ? C.violet : C.ink;
          g.globalAlpha = e.al * (e.del ? 0.45 : 1);
          DS.box(g, x + 1.5 * u, by, cw - 3 * u, bh, 5 * u, DS.rgba(col, e.del ? 0.04 : 0.14), DS.rgba(e.del ? C.rose : col, e.del ? 0.5 : 0.55), 1.2 * u);
          const cy = ids ? by + bh * 0.42 : by + bh / 2;
          DS.text(g, e.ch === ' ' ? '·' : e.ch, x + cw / 2, cy, { size: cw * 0.6, mono: true, weight: 600, color: e.del ? C.rose : col });
          if (ids) DS.text(g, `${e.id[0]}${e.id[1]}`, x + cw / 2, by + bh * 0.83, { size: Math.max(10.5 * u, cw * 0.24), mono: true, color: DS.rgba(C.dim, 0.9) });
          if (e.del) DS.line(g, x + 5 * u, cy, x + cw - 5 * u, cy, C.rose, 2 * u);
          g.globalAlpha = 1;
        });
        // the text itself, as a person would read it: the heart of the scene
        const words = `“${text(R)}”`;
        const fs = fit(words, 46 * u, pw - 32 * u, 400);
        DS.text(g, words, x0 + 16 * u, ry, { size: fs, weight: 400, color: C.ink, align: 'left' });
      };
      drawDoc('A');
      drawDoc('B');

      // the middle: the connection, and a state you can read from the back of the room
      const mx0 = S.x + pw + 18 * u, mx1 = S.x1 - pw - 18 * u, mcx = (mx0 + mx1) / 2;
      const wy = by + bh / 2;
      g.setLineDash(st === 'offline' ? [8 * u, 10 * u] : []);
      DS.line(g, mx0, wy, mx1, wy, DS.rgba(stCol, 0.6), 2.5 * u);
      g.setLineDash([]);
      if (st === 'offline') {
        // a visible break in the wire
        DS.box(g, mcx - 22 * u, wy - 16 * u, 44 * u, 32 * u, 6 * u, C.bg, null);
        DS.text(g, '✕', mcx, wy, { size: 24 * u, weight: 700, color: C.rose });
      }
      for (const w of this.wire) {
        if (w.t < 0) continue;
        const t = DS.smooth(Math.min(1, w.t));
        const x = w.from === 'A' ? DS.lerp(mx0, mx1, t) : DS.lerp(mx1, mx0, t);
        const y = wy + (w.from === 'A' ? -18 : 18) * u;
        g.globalAlpha = w.t > 1 ? Math.max(0, 1 - (w.t - 1) * 5) : 1;
        DS.box(g, x - 15 * u, y - 14 * u, 30 * u, 28 * u, 5 * u, DS.rgba(REP[w.from].col, 0.35), REP[w.from].col, 1.2 * u);
        DS.text(g, w.op.type === 'del' ? '✕' : w.op.ch === ' ' ? '·' : w.op.ch, x, y, { size: 18 * u, mono: true, weight: 600, color: C.ink });
        g.globalAlpha = 1;
      }
      const label = { offline: 'OFFLINE', syncing: 'SYNCING…', identical: 'IDENTICAL ✓', online: 'ONLINE' }[st];
      const sub = { offline: 'each laptop edits alone', syncing: 'swapping edits', identical: 'both copies match', online: '' }[st];
      const ly = ry - 6 * u;
      if (this.flash > 0.05) DS.halo(g, mcx, ly, 150 * u, C.teal, 0.35 * this.flash);
      DS.text(g, label, mcx, ly, { size: fit(label, 36 * u, mx1 - mx0, 700), weight: 700, color: stCol });
      if (sub) DS.text(g, sub, mcx, ly + 34 * u, { size: 15 * u, mono: true, color: C.dim });

      // the insertion tree (laptop A's copy): x = position in the document, y = depth
      const R = this.R.A;
      const naiveH = this.naive ? 76 * u : 0;
      const ty0 = py + panelH + 62 * u, ty1 = S.y1 - naiveH - 22 * u;
      const depth = new Map();
      R.list.forEach((e) => { const d = e.anchor ? (depth.get(key(e.anchor)) ?? 0) + 1 : 0; depth.set(key(e.id), d); });
      const maxD = Math.max(1, ...depth.values());
      const tcw = Math.min(96 * u, S.w / Math.max(R.list.length, 12));
      const tlh = Math.min(44 * u, (ty1 - ty0) / maxD);
      const nr = Math.max(11 * u, Math.min(19 * u, tcw * 0.36, tlh * 0.7));
      const tx0 = S.cx - (R.list.length * tcw) / 2;
      const pos = new Map();
      const k = 1 - Math.exp(-7 * (this.dt || 0));   // ease nodes to their new places as letters arrive
      R.list.forEach((e, i) => {
        const x = tx0 + (i + 0.5) * tcw, y = ty0 + depth.get(key(e.id)) * tlh;
        if (e.tx === undefined) { e.tx = x; e.ty = y; } else { e.tx += (x - e.tx) * k; e.ty += (y - e.ty) * k; }
        pos.set(key(e.id), [e.tx, e.ty]);
      });
      DS.text(g, 'HOW LAPTOP A STORES IT  ·  every letter hangs off the letter it was typed after  ·  read left to right for the text', S.x, ty0 - 34 * u, { size: 14 * u, mono: true, color: C.dim, align: 'left' });
      R.list.forEach((e) => {
        const [x, y] = pos.get(key(e.id));
        if (e.anchor) { const [ax, ay] = pos.get(key(e.anchor)); DS.line(g, ax, ay, x, y, DS.rgba(C.dim, 0.45), 1.6 * u); }
      });
      R.list.forEach((e) => {
        const [x, y] = pos.get(key(e.id));
        const col = e.by === 'A' ? C.teal : e.by === 'B' ? C.violet : C.dim;
        g.globalAlpha = e.al;
        DS.circle(g, x, y, nr, e.del ? C.cell : DS.rgba(col, 0.32), e.del ? DS.rgba(C.rose, 0.7) : DS.rgba(col, 0.9), 1.5 * u);
        DS.text(g, e.ch === ' ' ? '·' : e.ch, x, y + 0.5 * u, { size: nr * 1.05, mono: true, weight: 600, color: e.del ? C.rose : C.ink });
        g.globalAlpha = 1;
      });

      // naive comparison
      if (this.naive) {
        const ny = S.y1 - 22 * u;
        const same = this.naive.A === this.naive.B;
        const nc = same ? C.ink : C.rose;
        DS.text(g, 'THE SAME EDITS REPLAYED BY POSITION (“insert at 6”), WITHOUT A CRDT:', S.x, ny - 34 * u, { size: 14 * u, mono: true, color: C.dim, align: 'left' });
        DS.text(g, `A: “${this.naive.A}”`, S.x, ny, { size: fit(`A: “${this.naive.A}”`, 24 * u, pw, 400), mono: true, color: nc, align: 'left' });
        DS.text(g, `B: “${this.naive.B}”`, px.B, ny, { size: fit(`B: “${this.naive.B}”`, 24 * u, pw * 0.62, 400), mono: true, color: nc, align: 'left' });
        DS.text(g, same ? 'same' : '≠  different forever', S.x1, ny, { size: 20 * u, mono: true, weight: 600, color: same ? C.teal : C.rose, align: 'right' });
      }
    },

    stats() {
      const A = this.R.A, B = this.R.B; const same = text(A) === text(B) && !A.out.length && !B.out.length && !this.wire.length; return [{ k: 'deleted letters kept as ghosts', v: String(A.list.filter((e) => e.del).length) }, { k: 'servers needed', v: 'none' }, { k: 'do both copies match?', v: same ? 'yes' : 'not yet', accent: true }];
    },
  });
})();
