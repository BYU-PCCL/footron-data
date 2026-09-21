/*
 * Skip list -- "What comes next?"
 *
 * The reason to show this one rather than a balanced tree is that the whole
 * idea fits in a sentence and the wall can show it happening: keep the sorted
 * linked list, and give some of the nodes express lanes over the top, decided
 * by flipping a coin. No rotations, no colours, no cases -- and you still get
 * O(log n).
 *
 * So the build is the centrepiece and the coins are drawn one at a time. The
 * search afterwards only has to be watched to be understood, and the count
 * against a plain linked list is what makes it land.
 */
(function (global) {
"use strict";

var D = global.D, T = D.T;

var N = 14;          /* values in the list                                   */
var MAX_H = 4;       /* levels, counting the base list as level 0            */

var NODE_W = 54, NODE_H = 36, PITCH = 60;
var X0 = 76;                         /* the head sentinel's left edge        */
var BASE_Y = 470;                    /* level 0                              */
var LVL_H = 64;

var ACCENT = "#5BD5D0";

function levelY(lvl){ return BASE_Y - lvl * LVL_H; }
/* Column -1 is the head sentinel; 0..N-1 are the values. */
function colX(i){ return X0 + (i + 1) * PITCH; }
function colCX(i){ return colX(i) + NODE_W / 2; }

var scene = {
  id: "skiplist",
  name: "Skip list",
  question: "What comes next?",
  accent: ACCENT,

  cost: [
    { key: "search", op: "search", big: "O(log n)", note: "expected" },
    { key: "insert", op: "insert", big: "O(log n)", note: "no rebalancing" },
    { key: "order",  op: "in order", big: "O(n)", note: "it is still a list" },
    { key: "space",  op: "space", big: "O(n)", note: "2n pointers expected" }
  ],

  uses: "Redis sorted sets are skip lists. So were the index structures in " +
        "LevelDB and HBase's memtables. Chosen over a balanced tree because " +
        "concurrent inserts need no rebalancing — and because you can write one.",

  /* --------------------------------------------------------------- state */
  nodes: [], lanes: [], maxH: 1, target: null,
  trace: [], step_: null, marker: null,
  compares: 0, listCompares: 0, listShown: 0, ghost: null,
  built: 0,            /* how many nodes have been dealt so far             */
  coins: null,         /* the flips being shown for the node going in       */
  topLabel: "",
  beats: null,

  reset: function(seed){
    var rand = D.rng(seed);
    var i, k;

    /*
     * Deal values and coin-flip a height for each. Then check the shape is
     * worth watching and re-deal if it is not: a list where nothing reached
     * the top level has no express lane to demonstrate, and one where the tall
     * node sits at either end gives a search that never uses it. Both are
     * perfectly ordinary skip lists and both make a dull thirty seconds.
     */
    var nodes = null;
    for (var attempt = 0; attempt < 400 && !nodes; attempt++){
      var vals = {}, list = [];
      while (list.length < N){
        var v = 3 + Math.floor(rand() * 96);
        if (!vals[v]){ vals[v] = 1; list.push(v); }
      }
      list.sort(function(a, b){ return a - b; });

      var cand = list.map(function(v){
        var h = 1;
        /* The coin: heads and you go up another level, capped at MAX_H. */
        while (h < MAX_H && rand() < 0.5) h++;
        return { v: v, h: h, vis: 0, grown: 0 };
      });

      var tall = [], mid = [], any2 = 0;
      for (i = 0; i < cand.length; i++){
        if (cand[i].h === MAX_H) tall.push(i);
        if (cand[i].h >= 3) mid.push(i);
        if (cand[i].h >= 2) any2++;
      }
      if (tall.length < 1 || tall.length > 2) continue;
      if (mid.length < 2 || mid.length > 4) continue;
      if (any2 < 5 || any2 > 9) continue;
      if (tall[0] < 3 || tall[0] > N - 4) continue;
      nodes = cand;
    }
    if (!nodes){
      /* A fixed fallback, so a bad run of luck cannot leave the wall empty. */
      nodes = [7,12,19,23,28,34,41,47,52,58,63,71,80,88].map(function(v, idx){
        var hs = [1,2,1,1,3,1,2,1,4,1,1,2,1,2];
        return { v: v, h: hs[idx], vis: 0, grown: 0 };
      });
    }

    this.nodes = nodes;
    this.maxH = nodes.reduce(function(m, n){ return Math.max(m, n.h); }, 1);

    /* lanes[lvl] is the ordered list of columns present at that level -- the
       node's `next` pointers, laid out the way the picture needs them. */
    this.lanes = [];
    for (k = 0; k < this.maxH; k++){
      var lane = [];
      for (i = 0; i < nodes.length; i++) if (nodes[i].h > k) lane.push(i);
      this.lanes.push(lane);
    }

    /*
     * Pick which value to search for. Every value in the list is a legitimate
     * demonstration, so this is free to choose the one that demonstrates best
     * -- and it stays honest because both counts on screen are the real counts
     * for the value actually searched for.
     *
     * The obvious score, "whichever the skip list wins by most", turns out to
     * pick the last value almost every time: it maximises the linked list's
     * count, but its search is a straight run off the right-hand end of every
     * lane in turn, with no moment where the search overshoots and has to drop.
     * That overshoot is the whole idea, so it is scored for directly, and
     * running off the end of a lane -- which looks like nothing happening --
     * is scored against.
     *
     * Winning is not negotiable, though. Scored purely on shape, a third of
     * layouts picked a value the skip list actually loses on -- near the front
     * of the list, where walking the bottom is genuinely quicker -- and put
     * "skip list 8, linked list 5" on the wall under a caption explaining why
     * the lanes are worth it. So a clear win is a filter, and shape only
     * chooses among the values that pass it.
     */
    var MIN_GAIN = 3;
    var cands = [];
    for (i = 0; i < nodes.length; i++){
      var tr = this.traceFor(nodes[i].v);
      var skipCost = 0, overshoots = 0, ends = 0;
      for (var s = 0; s < tr.length; s++){
        var ty = tr[s].type;
        if (ty === "hop" || ty === "peek") skipCost++;
        if (ty === "peek" && !tr[s].hit) overshoots++;
        if (ty === "end") ends++;
      }
      var listCost = i + 1;
      cands.push({
        v: nodes[i].v, idx: i, trace: tr, skip: skipCost, list: listCost,
        gain: listCost - skipCost,
        shape: 3 * overshoots - 1.5 * ends
      });
    }
    var winners = cands.filter(function(c){ return c.gain >= MIN_GAIN; });
    if (!winners.length){
      var most = Math.max.apply(null, cands.map(function(c){ return c.gain; }));
      winners = cands.filter(function(c){ return c.gain === most; });
    }
    var best = winners[0];
    for (i = 1; i < winners.length; i++){
      var c = winners[i];
      /* Shape first, and the bigger win as the tie-break. */
      if (c.shape > best.shape || (c.shape === best.shape && c.gain > best.gain)) best = c;
    }
    this.target = best.v;
    this.targetIdx = best.idx;
    this.trace = best.trace;
    this.listCompares = best.list;

    this.built = 0;
    this.compares = 0;
    this.listShown = 0;
    this.marker = null;
    this.ghost = null;
    this.step_ = null;
    this.coins = null;
    this.topLabel = "";
    for (i = 0; i < nodes.length; i++){ nodes[i].vis = 0; nodes[i].grown = 0; }

    this.script();
  },

  /* The search itself, as a list of things to watch. Written out rather than
     animated directly so the beats can be sized from it and so the comparison
     count is taken from the same walk the wall draws. */
  traceFor: function(target){
    var trace = [], cur = -1, lvl, k;
    for (lvl = this.maxH - 1; lvl >= 0; lvl--){
      var lane = this.lanes[lvl];
      for (;;){
        var nxt = -1;
        for (k = 0; k < lane.length; k++) if (lane[k] > cur){ nxt = lane[k]; break; }
        if (nxt < 0){ trace.push({ type: "end", lvl: lvl, at: cur }); break; }
        if (this.nodes[nxt].v < target){
          trace.push({ type: "hop", lvl: lvl, from: cur, to: nxt });
          cur = nxt;
        } else {
          trace.push({
            type: "peek", lvl: lvl, at: cur, look: nxt,
            hit: this.nodes[nxt].v === target
          });
          break;
        }
      }
      if (lvl > 0) trace.push({ type: "drop", lvl: lvl, at: cur });
    }
    return trace;
  },

  /* --------------------------------------------------------------- script */
  script: function(){
    var self = this;
    var b = new D.Beats();

    b.add(3.4,
      "A sorted linked list is easy to build and slow to search: there is only " +
      "one way through it, one node at a time. A skip list keeps that list and " +
      "builds express lanes over it — by flipping a coin.",
      function(){ self.topLabel = "AN EMPTY LIST"; self.marker = null; },
      { hot: "order" });

    /*
     * The build. One beat per value: it drops into level 0, then coins decide
     * how far up its tower goes.
     *
     * A caption that changed on every value would be unreadable on a wall, so
     * a line is held until there is a reason to replace it. But a line that
     * names a particular value -- "44 flipped heads twice" -- goes stale as
     * soon as the build has moved on, so a run of unremarkable values gets a
     * general line after the third one instead of keeping the last name up.
     */
    var GENERAL = [
      "Most values flip tails immediately and stay in the bottom list. About " +
      "half of them do.",
      "The towers are the only thing random here. The values themselves are in " +
      "sorted order, exactly as in an ordinary linked list."
    ];
    var quiet = 0, generalAt = 0;

    this.nodes.forEach(function(node, n){
      var heads = node.h - 1;                       /* flips that came up heads */
      var capped = node.h === MAX_H;                /* stopped by the ceiling   */
      var flips = heads + (capped ? 0 : 1);         /* the tail that stopped it */

      var cap;
      if (n === 0){
        cap = "Every value goes into the bottom list in sorted order. Then it " +
              "flips a coin: heads, and it also joins the level above.";
        quiet = 0;
      } else if (node.h === MAX_H){
        cap = "<b>" + node.v + "</b> flipped heads " + heads + " times in a row, so it " +
              "sits in every level. That is an express lane over the whole list.";
        quiet = 0;
      } else if (node.h >= 3){
        cap = "<b>" + node.v + "</b> flipped heads twice — up it goes. Nothing is " +
              "balanced or rotated here; the coin does all of it.";
        quiet = 0;
      } else if (++quiet === 3){
        /* Three unremarkable values since anything was named: swap the stale
           name out for something still true of what is on the wall. */
        cap = GENERAL[generalAt % GENERAL.length];
        generalAt++;
        quiet = 0;
      } else {
        cap = undefined;                            /* keep the line before it  */
      }

      b.add(0.95, cap, function(u){
        self.topLabel = "BUILDING: " + (n + 1) + " OF " + N + " VALUES";
        node.vis = D.easeOut(D.sub(u, 0, 0.3));
        /* Level 0 first, then a level per head as its coin lands. */
        var g = 1;
        var shown = [];
        for (var f = 0; f < flips; f++){
          var a = 0.3 + f * 0.18;
          var done = D.sub(u, a, a + 0.14);
          if (done > 0) shown.push({ head: f < heads, t: done });
          if (f < heads) g += D.easeOut(D.sub(u, a + 0.06, a + 0.26));
        }
        node.grown = Math.min(g, node.h);
        self.coins = { col: n, list: shown, capped: capped, grown: node.grown };
      }, {
        enter: function(){ self.built = n; },
        exit: function(){
          node.vis = 1; node.grown = node.h;
          self.built = n + 1;
          self.coins = null;
        },
        hot: "insert"
      });
    });

    b.add(2.6,
      "That is the whole structure. Every value is in the bottom list; the lucky " +
      "ones are also in the lanes above, which is what a search gets to ride.",
      function(){ self.topLabel = "THE FINISHED SKIP LIST"; self.coins = null; },
      { hot: "space" });

    /* The search: one beat per step of the trace. */
    b.add(1.6,
      "Now find <b>" + this.target + "</b>. Start at the top-left, in the fastest lane.",
      function(u){
        self.topLabel = "SEARCHING FOR " + self.target;
        self.marker = { col: -1, lvl: self.maxH - 1, t: 1, appear: D.easeOut(D.sub(u, 0.2, 0.7)) };
      },
      { enter: function(){ self.compares = 0; }, hot: "search" });

    /* Each kind of step is explained the first time it happens and then left
       alone -- a caption that changes on every hop is unreadable on a wall, and
       by the second overshoot the picture is making the point by itself. */
    var said = {};
    this.trace.forEach(function(st, n){
      var prev = n > 0 ? self.trace[n - 1] : null;
      var dur = st.type === "drop" ? 0.5
              : st.type === "peek" ? 0.72
              : st.type === "end" ? 0.36
              : 0.58;
      var cap, mark;

      if (st.type === "hop"){
        mark = "hop";
        cap = "The value here is still below " + self.target + ", so the search " +
              "skips everything in between and keeps going.";
      } else if (st.type === "peek" && st.hit){
        cap = "There it is.";
      } else if (st.type === "peek"){
        mark = "over";
        cap = "That one overshoots " + self.target + ". The search does not follow " +
              "it — instead it drops to a slower lane and tries a shorter hop.";
      } else if (st.type === "end"){
        mark = "end";
        cap = "This lane has nothing further along it at all.";
      } else if (st.type === "drop"){
        mark = "drop";
        cap = prev && prev.type === "end"
          ? "So drop a level, where there are more nodes to land on."
          : "Drop a level. Every drop makes the hops shorter and the search finer.";
      }
      /* Only the first of each kind keeps its line. */
      if (mark){
        if (said[mark]) cap = undefined;
        else said[mark] = 1;
      }

      b.add(dur, cap, function(u){
        self.step_ = { st: st, u: u };
        if (st.type === "hop"){
          self.marker = { col: D.lerp(st.from, st.to, D.easeInOut(u)), lvl: st.lvl, t: 1, appear: 1 };
        } else if (st.type === "drop"){
          self.marker = { col: st.at, lvl: st.lvl - D.easeInOut(u), t: 1, appear: 1 };
        } else {
          self.marker = { col: st.at, lvl: st.lvl, t: 1, appear: 1 };
        }
      }, {
        exit: function(){
          if (st.type === "hop" || st.type === "peek") self.compares++;
        },
        hot: "search"
      });
    });

    b.add(2.4,
      "Found in <b>" + this.trace.filter(function(s){ return s.type === "hop" || s.type === "peek"; }).length +
      "</b> comparisons.",
      function(u){ self.foundT = D.easeOut(D.sub(u, 0, 0.4)); },
      { enter: function(){ self.foundT = 0; }, hot: "search" });

    /* The contrast. The same value, along the bottom list only. */
    b.add(3.8,
      "The same search along the bottom list alone — which is what you would be " +
      "doing without the lanes — takes <b>" + this.listCompares + "</b>.",
      function(u){
        self.topLabel = "THE SAME SEARCH, WITHOUT THE LANES";
        var p = D.sub(u, 0.08, 0.82);
        self.ghost = { col: D.lerp(-1, self.targetIdx, p), done: p >= 1 };
        self.listShown = Math.min(self.listCompares, Math.floor(p * self.listCompares) + (p > 0 ? 1 : 0));
      },
      { enter: function(){ self.listShown = 0; }, hot: "order" });

    b.add(4.4,
      "Fourteen values is a small list. At a million, the bottom walk averages " +
      "half a million steps and the lanes still finish in about twenty. All of it " +
      "paid for with a coin.",
      function(){ self.topLabel = "WHY THE LANES ARE WORTH IT"; },
      { enter: function(){ self.ghost = null; self.marker = null; self.step_ = null; }, hot: "search" });

    this.beats = b;
  },

  step: function(dt){ this.beats.step(dt); },

  /* ----------------------------------------------------------------- draw */
  draw: function(ctx){
    var i, lvl;

    D.sectionLabel(ctx, this.topLabel, X0, 40, 894, T.dim);

    /* Level guides and labels, drawn under everything. Level 0 is named for
       what it is, because "the bottom one is an ordinary sorted linked list"
       is the fact the whole scene rests on. */
    for (lvl = 0; lvl < this.maxH; lvl++){
      var y = levelY(lvl) + NODE_H / 2;
      ctx.strokeStyle = D.fade(T.grid, 0.9);
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 6]);
      ctx.beginPath(); ctx.moveTo(X0 - 4, y); ctx.lineTo(970, y); ctx.stroke();
      ctx.setLineDash([]);
      D.text(ctx, "L" + lvl, X0 - 16, y, { size: 12, color: T.dim, align: "right" });
      if (lvl === 0){
        /* Set on two lines: the margin to the left of the list is only about
           60px wide, and "every value" on one line runs off the canvas. */
        D.text(ctx, "every", X0 - 16, y + 15, { size: 9.5, color: T.dim, align: "right" });
        D.text(ctx, "value", X0 - 16, y + 27, { size: 9.5, color: T.dim, align: "right" });
      }
    }

    /* The head sentinel: a full-height tower, since the search starts there at
       whatever the top level is. */
    for (lvl = 0; lvl < this.maxH; lvl++){
      D.box(ctx, X0, levelY(lvl), NODE_W, NODE_H, {
        r: 5, fill: D.fade(T.panel, 0.8), stroke: T.line, lineWidth: 1.2
      });
      D.text(ctx, "head", X0 + NODE_W / 2, levelY(lvl) + NODE_H / 2, { size: 11, color: T.dim });
    }

    /* Express lanes. Drawn before the nodes so an arrow runs behind the boxes
       it joins rather than over their corners. */
    for (lvl = 0; lvl < this.maxH; lvl++){
      var lane = this.lanes[lvl];
      var prev = -1;
      for (i = 0; i < lane.length; i++){
        var idx = lane[i];
        var node = this.nodes[idx];
        var shown = node.vis > 0 && node.grown > lvl + 0.15;
        if (!shown) break;      /* the lane is built left to right with the list */
        var y = levelY(lvl) + NODE_H / 2;
        var live = this.step_ && this.step_.st.lvl === lvl &&
                   ((this.step_.st.type === "hop" && this.step_.st.from === prev && this.step_.st.to === idx) ||
                    (this.step_.st.type === "peek" && this.step_.st.at === prev && this.step_.st.look === idx));
        D.arrow(ctx, colX(prev) + NODE_W, y, colX(idx) - 3, y, {
          color: live ? ACCENT : D.fade(T.line, 1),
          width: live ? 2.4 : 1.6,
          headSize: 7
        });
        prev = idx;
      }
    }

    /* The nodes. */
    for (i = 0; i < this.nodes.length; i++){
      var n = this.nodes[i];
      if (n.vis <= 0) continue;
      var height = Math.max(1, Math.ceil(n.grown - 0.001));
      for (lvl = 0; lvl < height; lvl++){
        var part = D.clamp(n.grown - lvl, 0, 1);
        if (part <= 0) continue;
        var ny = levelY(lvl);
        var rise = (1 - (lvl === 0 ? n.vis : part)) * 16;

        var state = this.nodeState(i, lvl);
        var fill = T.panel, stroke = T.line, col = T.text, glow = null, lw = 1.2;
        if (state === "found"){ fill = D.fade(T.good, 0.18); stroke = T.good; glow = D.fade(T.good, 0.55); lw = 2; }
        else if (state === "compare"){ fill = D.fade(ACCENT, 0.16); stroke = ACCENT; glow = D.fade(ACCENT, 0.45); lw = 2; }
        else if (state === "reject"){ fill = D.fade(T.bad, 0.13); stroke = D.fade(T.bad, 0.8); col = T.text; lw = 1.8; }
        else if (lvl > 0){ fill = D.fade(T.panel, 0.85); stroke = D.fade(ACCENT, 0.32); }

        ctx.save();
        ctx.globalAlpha = (lvl === 0 ? n.vis : part);
        D.box(ctx, colX(i), ny + rise, NODE_W, NODE_H, {
          r: 5, fill: fill, stroke: stroke, lineWidth: lw, glow: glow, glowSize: 14
        });
        D.text(ctx, String(n.v), colCX(i), ny + rise + NODE_H / 2, {
          size: 18, weight: 600, color: lvl === 0 ? col : D.fade(ACCENT, 0.95)
        });
        ctx.restore();
      }
    }

    /* The coins for the value going in. */
    if (this.coins && this.coins.list.length){
      var c = this.coins;
      /* Sit just above the tower as it stands, not where it will end up: a
         coin parked at level 3 above a node that is still one box tall reads
         as unrelated to it. Riding the current height instead makes each flip
         look like the thing that pushed the tower up. */
      var cy = levelY(D.clamp(c.grown - 1, 0, MAX_H - 1)) - 32;
      var cx0 = colCX(c.col) - (c.list.length - 1) * 16;
      for (i = 0; i < c.list.length; i++){
        var flip = c.list[i];
        var cc = flip.head ? ACCENT : T.dim;
        ctx.save();
        ctx.globalAlpha = flip.t;
        /* The coin lands by squashing flat and springing back, which reads as
           a flip without needing a coin drawn in perspective. */
        var squash = 0.35 + 0.65 * D.easeBack(flip.t);
        ctx.translate(cx0 + i * 32, cy);
        ctx.scale(1, D.clamp(squash, 0.1, 1.2));
        ctx.fillStyle = D.fade(cc, 0.18);
        ctx.strokeStyle = cc;
        ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = flip.t;
        D.text(ctx, flip.head ? "H" : "T", cx0 + i * 32, cy, { size: 12, weight: 700, color: cc });
        ctx.restore();
      }
      if (c.capped && c.list.length){
        D.text(ctx, "(four levels is the ceiling here)", colCX(c.col), cy - 26, {
          size: 11, color: T.dim
        });
      }
    }

    /* The search marker: a chevron sitting under whatever is being looked at. */
    if (this.marker && this.marker.appear > 0){
      var mx = colCX(this.marker.col);
      var my = BASE_Y - this.marker.lvl * LVL_H + NODE_H + 12;
      ctx.save();
      ctx.globalAlpha = this.marker.appear;
      ctx.fillStyle = ACCENT;
      ctx.beginPath();
      ctx.moveTo(mx, my - 9); ctx.lineTo(mx - 8, my + 4); ctx.lineTo(mx + 8, my + 4);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }

    /* Running off the end of a lane. Without this the step is half a second in
       which nothing on the wall moves, and the drop that follows looks
       unmotivated. The rail carries the words, so this is only the stub and
       the stop -- and it is clamped inside the world, because the lane that
       runs out is often the one whose last node is already at the right edge. */
    if (this.step_ && this.step_.st.type === "end"){
      var elvl = this.step_.st.lvl;
      var ey = levelY(elvl) + NODE_H / 2;
      var from = colX(this.step_.st.at) + NODE_W;
      var ex = Math.min(from + 30, 978);
      var et = D.easeOut(this.step_.u);
      ctx.save();
      ctx.globalAlpha = et;
      ctx.strokeStyle = D.fade(T.dim, 0.9);
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(from + 4, ey); ctx.lineTo(ex - 10, ey); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(ex - 7, ey - 7); ctx.lineTo(ex + 7, ey + 7);
      ctx.moveTo(ex + 7, ey - 7); ctx.lineTo(ex - 7, ey + 7);
      ctx.stroke();
      ctx.restore();
    }

    /* The ghost walking the bottom list in the contrast beat. */
    if (this.ghost){
      var gx = colCX(this.ghost.col);
      var gy = levelY(0) + NODE_H / 2;
      ctx.save();
      ctx.strokeStyle = D.fade(T.muted, 0.85);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(gx, gy, 24, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }

    this.drawTally(ctx);
  },

  /* What a node should look like this frame, given where the search is. */
  nodeState: function(i, lvl){
    if (this.foundT > 0 && i === this.targetIdx) return "found";
    var s = this.step_;
    if (!s) return null;
    if (s.st.lvl !== lvl && s.st.type !== "drop") return null;
    if (s.st.type === "hop" && s.st.to === i && s.u > 0.55) return "compare";
    if (s.st.type === "peek" && s.st.look === i){
      return s.st.hit ? "found" : "reject";
    }
    return null;
  },

  drawTally: function(ctx){
    var y = 548, h = 64, w = 430;
    var pairs = [
      {
        x: X0, label: "SKIP LIST", n: this.compares,
        note: "hops, across " + this.maxH + " levels", color: ACCENT, on: this.compares > 0
      },
      {
        x: X0 + 894 - w, label: "PLAIN LINKED LIST", n: this.listShown,
        note: "one node at a time", color: T.muted, on: this.listShown > 0
      }
    ];
    for (var i = 0; i < pairs.length; i++){
      var p = pairs[i];
      D.box(ctx, p.x, y, w, h, {
        r: 8,
        fill: p.on ? D.fade(p.color, 0.08) : D.fade(T.panel, 0.55),
        stroke: p.on ? D.fade(p.color, 0.45) : T.line,
        lineWidth: 1.2
      });
      D.text(ctx, p.label, p.x + 18, y + 20, {
        size: 10.5, color: p.on ? p.color : T.dim, align: "left", track: 1.8, weight: 600
      });
      D.text(ctx, p.note, p.x + 18, y + 44, { size: 13, color: T.dim, align: "left" });
      /* A hard 0 before this walk has run reads as a result rather than as an
         absence, and "the plain linked list took 0 comparisons" is the exact
         opposite of the point being made. */
      D.text(ctx, p.on ? String(p.n) : "—", p.x + w - 20, y + h / 2, {
        size: 34, weight: 700, align: "right",
        color: p.on ? p.color : T.dim
      });
      D.text(ctx, "comparisons", p.x + w - 20, y + h - 13, {
        size: 10.5, color: T.dim, align: "right"
      });
    }
  }
};

global.Scenes = global.Scenes || [];
global.Scenes.push(scene);

})(window);
