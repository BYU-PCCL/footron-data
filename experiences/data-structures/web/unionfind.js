/*
 * Union-Find (disjoint sets) -- "Are these two connected?"
 *
 * The structure is an array of integers, and that is genuinely all it is, so
 * the array is on screen the entire time with the forest drawn directly above
 * it. Every element keeps the same x for the whole scene: node i is always
 * above cell i. Nothing moves sideways, so when a union or a compression
 * changes the shape, the only thing that moves is depth -- which is exactly
 * the quantity the scene is about.
 *
 * The unions are deliberately done the naive way first. A chain is not what a
 * real implementation produces, but it is what the two optimisations exist to
 * prevent, and path compression flattening a four-deep chain in one pass is
 * the most convincing thing this structure does.
 */
(function (global) {
"use strict";

var D = global.D, T = D.T;

var N = 12;
var CELL = 58, GAP = 6, PITCH = CELL + GAP;
var ARR_W = N * PITCH - GAP;
var ARR_X = Math.round((1000 - ARR_W) / 2);
var ARR_Y = 462, ARR_H = 52;

var TOP_Y = 132;      /* where roots sit                                     */
var LEVEL_H = 58;     /* one level of depth                                  */
var R = 21;           /* node radius                                         */

var ACCENT = "#A98BE8";

/* A colour per group, so "these two are in the same set" is answerable from
   across the room without following any pointers. A merged group takes the
   surviving root's colour, which is its own small piece of narration. */
var GROUP_COLS = ["#A98BE8", "#5BD5D0", "#F5B54C", "#FF8FA3", "#7CC8FF", "#9BE38A"];

/* The unions, done without union-by-size on purpose: each one attaches the
   root it finds first under the root it finds second, which for this order of
   pairs grows 0..4 into a chain. */
var UNIONS = [[0,1],[1,2],[2,3],[3,4],[5,6],[7,8],[6,8],[9,10]];

function nodeX(i){ return ARR_X + i * PITCH + CELL / 2; }

var scene = {
  id: "unionfind",
  name: "Union-Find",
  question: "Are these two connected?",
  accent: ACCENT,

  cost: [
    { key: "union",  op: "union", big: "α(n)", note: "amortized, ~constant" },
    { key: "find",   op: "find root", big: "α(n)", note: "with compression" },
    { key: "naive",  op: "find, done naively", big: "O(n)", note: "a chain" },
    { key: "space",  op: "space", big: "O(n)", note: "one int per element" }
  ],

  uses: "Kruskal's minimum spanning tree is mostly union-find. So is cycle " +
        "detection in a graph, the flood-fill behind image segmentation, and " +
        "percolation models in physics.",

  /* --------------------------------------------------------------- state */
  parent: [], nodes: [], flash: [], size: [],
  walker: null,        /* the find() pointer climbing a path                 */
  compress: null,      /* the compression pass, 0..1                         */
  sizesShown: false,   /* the union-by-size beat shows the two counts        */
  verdict: null,       /* a connected? answer                                */
  findCost: 0, opLabel: "", topLabel: "",
  beats: null,

  reset: function(seed){
    var i;
    this.parent = [];
    this.nodes = [];
    this.flash = [];
    for (i = 0; i < N; i++){
      this.parent.push(i);
      this.flash.push(0);
      var c = this.hexToRgb(GROUP_COLS[i % GROUP_COLS.length]);
      this.nodes.push({
        x: nodeX(i), y: TOP_Y, ty: TOP_Y,
        px: nodeX(i), py: TOP_Y,          /* animated anchor of the parent arc */
        cr: c[0], cg: c[1], cb: c[2]
      });
    }
    this.walker = null;
    this.compress = null;
    this.sizesShown = false;
    this.verdict = null;
    this.findCost = 0;
    this.opLabel = "";
    this.topLabel = "";
    this.retarget(true);
    this.script();
  },

  /* ------------------------------------------------------------- the data */

  findRoot: function(i){
    var guard = 0;
    while (this.parent[i] !== i && guard++ < N + 2) i = this.parent[i];
    return i;
  },

  pathTo: function(i){
    var path = [i], guard = 0;
    while (this.parent[i] !== i && guard++ < N + 2){ i = this.parent[i]; path.push(i); }
    return path;
  },

  depthOf: function(i){
    var d = 0, guard = 0;
    while (this.parent[i] !== i && guard++ < N + 2){ i = this.parent[i]; d++; }
    return d;
  },

  groupSize: function(root){
    var n = 0;
    for (var i = 0; i < N; i++) if (this.findRoot(i) === root) n++;
    return n;
  },

  groupCount: function(){
    var n = 0;
    for (var i = 0; i < N; i++) if (this.parent[i] === i) n++;
    return n;
  },

  maxDepth: function(){
    var m = 0;
    for (var i = 0; i < N; i++) m = Math.max(m, this.depthOf(i));
    return m;
  },

  hexToRgb: function(hex){
    var n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  },

  /* Where every node belongs, given the parent array as it stands. Called
     whenever the array changes; settle() walks the nodes there over the next
     few frames rather than teleporting them. */
  retarget: function(immediate){
    for (var i = 0; i < N; i++){
      var n = this.nodes[i];
      n.ty = TOP_Y + this.depthOf(i) * LEVEL_H;
      if (immediate){
        n.y = n.ty;
        var p = this.parent[i];
        n.px = nodeX(p); n.py = TOP_Y + this.depthOf(p) * LEVEL_H;
        var c = this.hexToRgb(GROUP_COLS[this.findRoot(i) % GROUP_COLS.length]);
        n.cr = c[0]; n.cg = c[1]; n.cb = c[2];
      }
    }
  },

  /* The only part of the scene that runs on real time rather than on beat
     progress: nodes easing to their new depth, arcs swinging to new parents,
     groups taking on a new colour, array cells cooling down after a write. */
  settle: function(dt){
    var k = 1 - Math.pow(0.001, Math.min(dt, 0.1));   /* frame-rate independent */
    for (var i = 0; i < N; i++){
      var n = this.nodes[i];
      n.y += (n.ty - n.y) * k;
      var p = this.parent[i];
      var tpx = nodeX(p), tpy = this.nodes[p].ty;
      n.px += (tpx - n.px) * k;
      n.py += (tpy - n.py) * k;
      var c = this.hexToRgb(GROUP_COLS[this.findRoot(i) % GROUP_COLS.length]);
      n.cr += (c[0] - n.cr) * k;
      n.cg += (c[1] - n.cg) * k;
      n.cb += (c[2] - n.cb) * k;
      if (this.flash[i] > 0) this.flash[i] = Math.max(0, this.flash[i] - dt * 1.6);
    }
  },

  /* --------------------------------------------------------------- script */
  script: function(){
    var self = this;
    var b = new D.Beats();

    b.add(3.2,
      "Twelve things, and nothing connected to anything. The whole structure is " +
      "the row of numbers along the bottom: <b>parent[i] = i</b> means <i>i</i> is " +
      "its own group.",
      function(){ self.topLabel = "TWELVE GROUPS OF ONE"; self.opLabel = ""; },
      { hot: "space" });

    /* The unions. Each finds the two roots and hangs one under the other. */
    UNIONS.forEach(function(pair, n){
      var a = pair[0], bb = pair[1];
      var ra = null, rb = null, committed = false;

      var cap;
      if (n === 0){
        cap = "To join two groups, walk each one up to its root and hang one root " +
              "under the other. One number changes.";
      } else if (n === 3){
        cap = "Done carelessly, this is what you get: a chain. Nothing here ever " +
              "checked which tree was taller.";
      } else if (n === 4){
        cap = undefined;
      } else {
        cap = undefined;
      }

      b.add(1.2, cap, function(u){
        self.topLabel = "UNION " + (n + 1) + " OF " + UNIONS.length;
        self.opLabel = "union(" + a + ", " + bb + ")";
        self.joining = { a: a, bb: bb, ra: ra, rb: rb, u: u };
        if (u >= 0.55 && !committed) commit();
      }, {
        enter: function(){
          ra = self.findRoot(a); rb = self.findRoot(bb); committed = false;
        },
        exit: function(){
          if (!committed) commit();
          self.joining = null;
        },
        hot: "union"
      });

      function commit(){
        committed = true;
        if (ra !== rb){
          self.parent[ra] = rb;
          self.flash[ra] = 1;
          self.retarget(false);
        }
      }
    });

    b.add(2.4,
      "Four groups now. The first one is four levels deep, which is the problem.",
      function(){ self.topLabel = "FOUR GROUPS"; self.opLabel = ""; self.joining = null; },
      { hot: "space" });

    /* find() up the chain, the slow way. */
    var chainPath = null;
    b.add(3.0,
      "<b>find(0)</b> answers \"which group is 0 in?\" by walking to the root — and " +
      "on a chain that is the whole length of it. Every question about this group " +
      "pays the same walk.",
      function(u){
        self.topLabel = "FINDING THE ROOT OF 0";
        self.opLabel = "find(0)";
        var p = D.sub(u, 0.1, 0.92) * (chainPath.length - 1);
        self.walker = { path: chainPath, p: p, compress: 0 };
        self.findCost = Math.min(chainPath.length - 1, Math.floor(p + 0.5));
      },
      {
        enter: function(){ chainPath = self.pathTo(0); self.findCost = 0; },
        hot: "naive"
      });

    /* Path compression: the same walk, with every node on it re-pointed at the
       root on the way back. */
    b.add(3.8,
      "<b>Path compression:</b> on the way back down, every node the walk touched " +
      "is pointed straight at the root. The work is done once, and everyone who " +
      "asks afterwards gets the short answer.",
      function(u){
        self.topLabel = "COMPRESSING THE PATH";
        self.opLabel = "find(0) — again, and this time it tidies up";
        var c = D.easeInOut(D.sub(u, 0.12, 0.72));
        self.walker = { path: chainPath, p: chainPath.length - 1, compress: c };
        self.compress = c;
        if (c >= 1 && !self.compressed) doCompress();
      },
      {
        enter: function(){ self.compressed = false; },
        exit: function(){ if (!self.compressed) doCompress(); },
        hot: "find"
      });

    function doCompress(){
      self.compressed = true;
      var root = chainPath[chainPath.length - 1];
      for (var i = 0; i < chainPath.length - 1; i++){
        if (self.parent[chainPath[i]] !== root){
          self.parent[chainPath[i]] = root;
          self.flash[chainPath[i]] = 1;
        }
      }
      self.retarget(false);
    }

    b.add(2.6,
      "One hop now — for 0, and for 1, 2 and 3 as well. The tree is as flat as a " +
      "tree can be.",
      function(u){
        self.topLabel = "THE SAME QUESTION, AFTER COMPRESSION";
        self.opLabel = "find(0)";
        var path = self.pathTo(0);
        self.walker = { path: path, p: D.sub(u, 0.15, 0.6) * (path.length - 1), compress: 0 };
        self.findCost = path.length - 1;
      },
      { enter: function(){ self.compress = null; }, hot: "find" });

    /* Union by size, the other half of why this structure is fast. */
    var ur = null;
    b.add(3.4,
      "The other trick is <b>union by size</b>: when two groups merge, the smaller " +
      "tree goes under the bigger one's root. Put the big tree under the small one " +
      "instead and everything in it gets a level deeper.",
      function(u){
        self.topLabel = "UNION BY SIZE";
        self.opLabel = "union(9, 0)";
        self.sizesShown = true;
        self.joining = { a: 9, bb: 0, ra: ur && ur.small, rb: ur && ur.big, u: u };
        if (u >= 0.62 && ur && !ur.done){
          ur.done = true;
          self.parent[ur.small] = ur.big;
          self.flash[ur.small] = 1;
          self.retarget(false);
        }
      },
      {
        enter: function(){
          var r1 = self.findRoot(9), r2 = self.findRoot(0);
          var s1 = self.groupSize(r1), s2 = self.groupSize(r2);
          ur = s1 <= s2
            ? { small: r1, big: r2, sizes: [s1, s2], done: false }
            : { small: r2, big: r1, sizes: [s2, s1], done: false };
        },
        exit: function(){
          if (ur && !ur.done){
            ur.done = true;
            self.parent[ur.small] = ur.big;
            self.retarget(false);
          }
          self.joining = null;
          self.sizesShown = false;
        },
        hot: "union"
      });

    /* The question the structure exists to answer. */
    this.query(b, 2, 11, false);
    this.query(b, 0, 9, true);

    b.add(4.4,
      "With both tricks, a union or a find costs <b>α(n)</b> — the inverse Ackermann " +
      "function, which is below 5 for any number of elements that could be stored " +
      "on any machine that will ever be built. It is not constant time. You will " +
      "never measure the difference.",
      function(){
        self.topLabel = "WHAT IT COSTS";
        self.opLabel = "";
        self.walker = null;
        self.verdict = null;
      },
      { hot: "find" });

    this.beats = b;
  },

  /* A connected? query: walk both elements to their roots, then compare. */
  query: function(b, a, c, expectSame){
    var self = this;
    var pa = null, pc = null;
    b.add(3.0,
      "<b>connected(" + a + ", " + c + ")</b>? Walk both to their roots and compare. " +
      (expectSame
        ? "Same root — so yes, and no part of the answer needed the path between them."
        : "Different roots, so no."),
      function(u){
        self.topLabel = "ASKING THE QUESTION";
        self.opLabel = "connected(" + a + ", " + c + ")";
        var t = D.sub(u, 0.08, 0.6);
        self.walker = {
          pair: [
            { path: pa, p: t * (pa.length - 1) },
            { path: pc, p: t * (pc.length - 1) }
          ]
        };
        var settled = D.sub(u, 0.62, 0.74);
        self.verdict = settled > 0
          ? { same: pa[pa.length - 1] === pc[pc.length - 1], t: settled }
          : null;
      },
      {
        enter: function(){ pa = self.pathTo(a); pc = self.pathTo(c); self.verdict = null; },
        exit: function(){ self.walker = null; },
        hot: "find"
      });
  },

  step: function(dt){
    this.settle(dt);
    this.beats.step(dt);
  },

  /* ----------------------------------------------------------------- draw */
  draw: function(ctx){
    var i;

    D.sectionLabel(ctx, this.topLabel, ARR_X, 40, ARR_W, T.dim);
    if (this.opLabel){
      D.text(ctx, this.opLabel, ARR_X + ARR_W, 40, {
        size: 15, color: ACCENT, align: "right", weight: 600
      });
    }

    /* Depth guides, so "one level deeper" is a thing you can see rather than
       something to be taken on trust. */
    for (i = 0; i <= 4; i++){
      var gy = TOP_Y + i * LEVEL_H;
      ctx.strokeStyle = D.fade(T.grid, i === 0 ? 1 : 0.7);
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 7]);
      ctx.beginPath(); ctx.moveTo(ARR_X - 6, gy); ctx.lineTo(ARR_X + ARR_W, gy); ctx.stroke();
      ctx.setLineDash([]);
      D.text(ctx, i === 0 ? "roots" : "+" + i, ARR_X - 18, gy, {
        size: 11, color: T.dim, align: "right"
      });
    }

    this.drawArcs(ctx);
    this.drawNodes(ctx);
    this.drawWalker(ctx);
    this.drawArray(ctx);
    this.drawTally(ctx);
    if (this.verdict) this.drawVerdict(ctx);
  },

  nodeCol: function(i){
    var n = this.nodes[i];
    return "rgb(" + Math.round(n.cr) + "," + Math.round(n.cg) + "," + Math.round(n.cb) + ")";
  },

  /* Parent pointers. Drawn as arcs rather than straight lines so that two
     nodes in adjacent columns do not produce a pointer hidden under the row of
     circles, and so a compression reads as a swing rather than a jump. */
  drawArcs: function(ctx){
    for (var i = 0; i < N; i++){
      if (this.parent[i] === i) continue;
      var n = this.nodes[i];
      var dx = n.px - n.x, dy = n.py - n.y;
      var len = Math.hypot(dx, dy) || 1;
      if (len < 2) continue;
      /* Start and end on the rims, not the centres. */
      var sx = n.x + (dx / len) * R, sy = n.y + (dy / len) * R;
      var ex = n.px - (dx / len) * (R + 5), ey = n.py - (dy / len) * (R + 5);
      var lit = this.onWalk(i);
      D.arcTo(ctx, sx, sy, ex, ey, Math.min(24, len * 0.16), {
        color: lit ? "#FFFFFF" : D.fade(this.nodeCol(i), 0.55),
        width: lit ? 3 : 2,
        head: true, headSize: 8
      });
    }
  },

  /* Is this node on the path the find() pointer is currently walking? */
  onWalk: function(i){
    var w = this.walker;
    if (!w) return false;
    if (w.pair){
      for (var k = 0; k < w.pair.length; k++){
        var seg = w.pair[k];
        if (seg.path.indexOf(i) >= 0 && seg.path.indexOf(i) <= seg.p + 0.02) return true;
      }
      return false;
    }
    if (!w.path) return false;
    var at = w.path.indexOf(i);
    return at >= 0 && at <= w.p + 0.02;
  },

  drawNodes: function(ctx){
    for (var i = 0; i < N; i++){
      var n = this.nodes[i];
      var col = this.nodeCol(i);
      var isRoot = this.parent[i] === i;
      var lit = this.onWalk(i);
      var joining = this.joining &&
                    (this.joining.a === i || this.joining.bb === i) &&
                    this.joining.u < 0.6;
      var isJoinRoot = this.joining &&
                       (this.joining.ra === i || this.joining.rb === i) &&
                       this.joining.u >= 0.25;

      if (lit || isJoinRoot){
        ctx.save();
        ctx.shadowColor = D.fade(col, 0.9);
        ctx.shadowBlur = 20;
      }
      ctx.fillStyle = isRoot ? D.fade(col, 0.28) : D.fade(T.panel, 0.95);
      ctx.strokeStyle = lit ? "#FFFFFF" : col;
      ctx.lineWidth = isRoot ? 2.6 : 1.8;
      ctx.beginPath(); ctx.arc(n.x, n.y, R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      if (lit || isJoinRoot) ctx.restore();

      /* A root wears a second ring -- it is the name of the whole group, which
         is what every query ends up comparing. */
      if (isRoot){
        ctx.strokeStyle = D.fade(col, 0.45);
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(n.x, n.y, R + 5, 0, Math.PI * 2); ctx.stroke();
      }
      if (joining){
        D.ping(ctx, n.x, n.y, R, R + 16, D.sub(this.joining.u, 0, 0.55), col, 2);
      }

      D.text(ctx, String(i), n.x, n.y, {
        size: 17, weight: 600, color: lit ? "#FFFFFF" : (isRoot ? col : T.text)
      });

      if (this.sizesShown && isRoot){
        D.text(ctx, this.groupSize(i) + " in here", n.x, n.y - R - 15, {
          size: 11.5, color: col, weight: 600
        });
      }
    }
  },

  /* The find() pointer, riding whatever path it is on. */
  drawWalker: function(ctx){
    var w = this.walker;
    if (!w) return;
    var segs = w.pair ? w.pair : [{ path: w.path, p: w.p }];
    for (var k = 0; k < segs.length; k++){
      var seg = segs[k];
      if (!seg.path || seg.path.length === 0) continue;
      var p = D.clamp(seg.p, 0, seg.path.length - 1);
      var i0 = Math.floor(p), i1 = Math.min(i0 + 1, seg.path.length - 1);
      var f = p - i0;
      var a = this.nodes[seg.path[i0]], b2 = this.nodes[seg.path[i1]];

      /*
       * Follow the same bow the parent pointer is drawn with, rather than
       * cutting straight from one node to the other. After compression a node
       * often points at a root several columns away, and a straight slide
       * passes directly over the nodes in between -- which reads as the walk
       * visiting them, when the whole point of compression is that it no
       * longer does.
       */
      var dx = b2.x - a.x, dy = b2.y - a.y;
      var len = Math.hypot(dx, dy) || 1;
      var bow = Math.min(24, len * 0.16);
      var mx = (a.x + b2.x) / 2, my = (a.y + b2.y) / 2;
      var cx = mx - (dy / len) * bow, cy = my + (dx / len) * bow;
      var iu = 1 - f;
      var x = iu*iu*a.x + 2*iu*f*cx + f*f*b2.x;
      var y = iu*iu*a.y + 2*iu*f*cy + f*f*b2.y;
      ctx.save();
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "rgba(255,255,255,.55)";
      ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(x, y, R + 8, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
    }
  },

  /* The parent array. This is the structure; everything above it is a picture
     of what these twelve numbers mean. */
  drawArray: function(ctx){
    D.sectionLabel(ctx, "THE WHOLE STRUCTURE: parent[]", ARR_X, ARR_Y - 22, ARR_W, T.dim);

    for (var i = 0; i < N; i++){
      var x = ARR_X + i * PITCH;
      var col = this.nodeCol(i);
      var isRoot = this.parent[i] === i;
      var hot = this.flash[i];
      var lit = this.onWalk(i);

      D.box(ctx, x, ARR_Y, CELL, ARR_H, {
        r: 6,
        fill: hot > 0 ? D.fade("#FFFFFF", 0.1 * hot) : D.fade(isRoot ? col : T.panel, isRoot ? 0.16 : 0.9),
        stroke: hot > 0 ? "#FFFFFF" : (lit ? col : D.fade(col, isRoot ? 0.8 : 0.35)),
        lineWidth: hot > 0 ? 2.2 : (isRoot ? 1.8 : 1.2),
        glow: hot > 0 ? D.fade("#FFFFFF", 0.5 * hot) : null,
        glowSize: 16
      });
      D.text(ctx, String(this.parent[i]), x + CELL / 2, ARR_Y + ARR_H / 2, {
        size: 21, weight: 600,
        color: isRoot ? col : T.text
      });
      D.text(ctx, String(i), x + CELL / 2, ARR_Y + ARR_H + 16, {
        size: 12, color: T.dim
      });
    }
    D.text(ctx, "index", ARR_X - 18, ARR_Y + ARR_H + 16, { size: 11, color: T.dim, align: "right" });
  },

  drawTally: function(ctx){
    var items = [
      { label: "GROUPS", v: String(this.groupCount()), note: "roots in the array" },
      { label: "DEEPEST TREE", v: String(this.maxDepth()), note: "levels below a root" },
      { label: "LAST find()", v: this.findCost ? this.findCost + " hop" + (this.findCost === 1 ? "" : "s") : "—", note: "pointers followed" }
    ];
    var w = 250, gap = 16;
    var total = items.length * w + (items.length - 1) * gap;
    var x0 = (1000 - total) / 2;
    for (var i = 0; i < items.length; i++){
      var it = items[i], x = x0 + i * (w + gap);
      D.box(ctx, x, 560, w, 56, {
        r: 8, fill: D.fade(T.panel, 0.55), stroke: T.line, lineWidth: 1.1
      });
      D.text(ctx, it.label, x + 16, 578, {
        size: 10, color: T.dim, align: "left", track: 1.6, weight: 600
      });
      D.text(ctx, it.note, x + 16, 599, { size: 12, color: T.dim, align: "left" });
      D.text(ctx, it.v, x + w - 16, 588, {
        size: 24, weight: 700, color: ACCENT, align: "right"
      });
    }
  },

  drawVerdict: function(ctx){
    var v = this.verdict;
    var col = v.same ? T.good : T.bad;
    var label = v.same ? "SAME ROOT — CONNECTED" : "DIFFERENT ROOTS — NOT CONNECTED";
    var t = D.easeOut(v.t);
    ctx.save();
    ctx.globalAlpha = t;
    var w = 560, x = (1000 - w) / 2;
    D.box(ctx, x, 396, w, 46, {
      r: 8, fill: D.fade(col, 0.12), stroke: D.fade(col, 0.6), lineWidth: 1.4
    });
    D.text(ctx, label, 500, 419, { size: 18, weight: 700, color: col, track: 1.2 });
    ctx.restore();
  }
};

global.Scenes = global.Scenes || [];
global.Scenes.push(scene);

})(window);
