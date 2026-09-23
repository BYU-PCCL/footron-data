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
    legend: [["teal", "typed on laptop A"], ["violet", "typed on laptop B"], ["rose", "deleted (kept as a ghost)"]],
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
    *typeGen(r, word, at) {
      const R = this.R[r];
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
      const n = Math.max(aOps.length, bOps.length);
      for (let k = 0; k < n; k++) {
        if (aOps[k]) this.wire.push({ op: aOps[k], from: 'A', to: 'B', t: 0 });
        if (bOps[k]) this.wire.push({ op: bOps[k], from: 'B', to: 'A', t: 0 });
        yield 0.18;
      }
      yield 1.2;
      // naive: replay the other side's index-based edits onto this side's text
      const replay = (txt, ops) => ops.reduce((s, o) => (o.type === 'ins' ? s.slice(0, o.i) + o.ch + s.slice(o.i) : s.slice(0, o.i) + s.slice(o.i + 1)), txt);
      this.naive = { A: replay(A.naive, naiveB), B: replay(B.naive, naiveA) };
      A.naive = this.naive.A; B.naive = this.naive.B;
      const same = text(A) === text(B);
      DS.say(same ? `both copies now read “${text(A)}”  ·  identical, with every word in one piece` : 'still syncing…', same ? 'good' : '');
      yield 3;
    },

    *storyGen() {
      this.reset();
      DS.say('one document, two copies — on two laptops');
      yield 1.8;
      this.online = false;
      DS.say('the Wi-Fi drops  ·  both keep typing, in the same spot');
      yield 1.2;
      const a = this.typeGen('A', ' Alice', 4), b = this.typeGen('B', ' Bob', 4);
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
      yield* this.typeGen('A', ' :)', text(this.R.A).length - 1);
      yield 1.2;
      yield* this.syncGen();
      DS.say(`“!” is gone, but its tombstone still anchors A’s “ :)”  ·  both read “${text(this.R.A)}”`, 'good');
      yield 3.5;
    },

    act(id) {
      const s = this.steps;
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

    update(dt, auto) {
      this.steps.update(dt);
      if (auto && !this.steps.busy) this.auto();
      for (const w of this.wire) {
        w.t += dt / 0.9;
        if (w.t >= 1 && !w.done) { w.done = true; integrate(this.R[w.to], w.op); }
      }
      this.wire = this.wire.filter((w) => w.t < 1.2);
      for (const r of Object.values(this.R)) r.list.forEach((e) => { e.al = DS.ease(e.al, 1, dt, 6); });
    },

    draw(g) {
      const S = DS.stage, u = DS.u;
      const pw = S.w * 0.4;
      const px = { A: S.x, B: S.x1 - pw };
      const py = S.y + 10 * u;
      const cw = Math.min(50 * u, pw / 20);

      const drawDoc = (r) => {
        const R = this.R[r], x0 = px[r];
        DS.text(g, `REPLICA ${r}`, x0, py, { size: 13 * u, mono: true, color: REP[r].col, align: 'left' });
        DS.text(g, this.online ? 'online' : 'offline', x0 + pw, py, { size: 13 * u, mono: true, color: this.online ? C.teal : C.rose, align: 'right' });
        let i = 0;
        for (const e of R.list) {
          const x = x0 + i * cw, y = py + 28 * u;
          const col = e.by === 'A' ? C.teal : e.by === 'B' ? C.violet : C.ink;
          g.globalAlpha = e.al * (e.del ? 0.3 : 1);
          DS.box(g, x + 1, y, cw - 2, cw * 1.25, 4 * u, DS.rgba(col, e.del ? 0.05 : 0.14), DS.rgba(col, e.del ? 0.3 : 0.5), 1 * u);
          DS.text(g, e.ch === ' ' ? '·' : e.ch, x + cw / 2, y + cw * 0.55, { size: cw * 0.62, mono: true, weight: 600, color: col });
          DS.text(g, `${e.id[0]}${e.id[1]}`, x + cw / 2, y + cw * 1.1, { size: cw * 0.24, mono: true, color: DS.rgba(C.dim, 0.9) });
          if (e.del) DS.line(g, x + 3 * u, y + cw * 0.55, x + cw - 3 * u, y + cw * 0.55, C.rose, 1.5 * u);
          g.globalAlpha = 1;
          i++;
        }
        DS.text(g, `“${text(R)}”`, x0, py + 28 * u + cw * 1.25 + 26 * u, { size: 22 * u, weight: 300, color: C.ink, align: 'left' });
        if (R.out.length) DS.text(g, `${R.out.length} edit${R.out.length === 1 ? '' : 's'} waiting to send`, x0, py + 28 * u + cw * 1.25 + 52 * u, { size: 13 * u, mono: true, color: C.amber, align: 'left' });
      };
      drawDoc('A');
      drawDoc('B');

      // the wire
      const wy = py + 40 * u;
      const wx0 = S.x + pw + 20 * u, wx1 = S.x1 - pw - 20 * u;
      g.setLineDash(this.online ? [] : [6 * u, 6 * u]);
      DS.line(g, wx0, wy, wx1, wy, DS.rgba(this.online ? C.teal : C.rose, 0.45), 1.5 * u);
      g.setLineDash([]);
      for (const w of this.wire) {
        const t = Math.min(1, w.t);
        const x = w.from === 'A' ? DS.lerp(wx0, wx1, t) : DS.lerp(wx1, wx0, t);
        const y = wy + (w.from === 'A' ? -10 : 10) * u;
        DS.box(g, x - 10 * u, y - 9 * u, 20 * u, 18 * u, 4 * u, DS.rgba(REP[w.from].col, 0.3), REP[w.from].col, 1 * u);
        DS.text(g, w.op.type === 'del' ? '✕' : w.op.ch === ' ' ? '·' : w.op.ch, x, y, { size: 13 * u, mono: true, color: C.ink });
      }

      // the insertion tree (replica A's view): x = position in the document, y = depth
      const R = this.R.A;
      const ty0 = S.y + S.h * 0.42, tx0 = S.x;
      const pos = new Map();
      const depth = new Map();
      R.list.forEach((e) => { const d = e.anchor ? (depth.get(key(e.anchor)) ?? 0) + 1 : 0; depth.set(key(e.id), d); });
      const maxD = Math.max(1, ...depth.values());
      const tcw = Math.min(64 * u, S.w / Math.max(R.list.length, 16));
      const tlh = Math.min(38 * u, (S.y1 - 110 * u - ty0) / maxD);
      R.list.forEach((e, i) => pos.set(key(e.id), [tx0 + (i + 0.5) * tcw, ty0 + depth.get(key(e.id)) * tlh]));
      DS.text(g, 'HOW REPLICA A STORES IT — every letter hangs off the letter it was typed after; reading left to right gives the text', tx0, ty0 - 22 * u, { size: 12 * u, mono: true, color: C.mute, align: 'left' });
      R.list.forEach((e) => {
        const [x, y] = pos.get(key(e.id));
        if (e.anchor) { const [ax, ay] = pos.get(key(e.anchor)); DS.line(g, ax, ay, x, y, DS.rgba(C.dim, 0.3), 1 * u); }
      });
      R.list.forEach((e) => {
        const [x, y] = pos.get(key(e.id));
        const col = e.by === 'A' ? C.teal : e.by === 'B' ? C.violet : C.dim;
        DS.circle(g, x, y, 12 * u, e.del ? C.cell : DS.rgba(col, 0.3), DS.rgba(col, e.del ? 0.3 : 0.8), 1 * u);
        DS.text(g, e.ch === ' ' ? '·' : e.ch, x, y + 0.5 * u, { size: 13 * u, mono: true, color: e.del ? C.mute : C.ink });
      });

      // naive comparison
      if (this.naive) {
        const ny = S.y1 - 34 * u;
        const same = this.naive.A === this.naive.B;
        DS.text(g, 'SAME EDITS REPLAYED BY POSITION INSTEAD:', S.x, ny - 20 * u, { size: 12 * u, mono: true, color: C.mute, align: 'left' });
        DS.text(g, `A: “${this.naive.A}”`, S.x, ny + 6 * u, { size: 18 * u, mono: true, color: same ? C.ink : C.rose, align: 'left' });
        DS.text(g, `B: “${this.naive.B}”`, S.x + S.w * 0.4, ny + 6 * u, { size: 18 * u, mono: true, color: same ? C.ink : C.rose, align: 'left' });
        DS.text(g, same ? 'same' : 'different — forever', S.x1, ny + 6 * u, { size: 16 * u, mono: true, color: same ? C.teal : C.rose, align: 'right' });
      }
    },

    stats() {
      const A = this.R.A, B = this.R.B; const same = text(A) === text(B) && !A.out.length && !B.out.length && !this.wire.length; return [{ k: 'deleted letters kept as ghosts', v: String(A.list.filter((e) => e.del).length) }, { k: 'servers needed', v: 'none' }, { k: 'do both copies match?', v: same ? 'yes' : 'not yet', accent: true }];
    },
  });
})();
