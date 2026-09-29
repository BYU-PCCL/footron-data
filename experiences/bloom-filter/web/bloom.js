/*
 * Bloom filter -- "Have I seen this before?"
 *
 * The scene is built around the one thing that makes a Bloom filter worth
 * showing rather than describing: it answers from bits that no longer have any
 * connection to what was put in. So the wall never holds the names anywhere
 * except in the strip along the bottom, which is there precisely to make the
 * point that the filter itself is not holding them.
 *
 * The three hash functions are real (FNV-1a, djb2, sdbm in draw.js) and the
 * bit positions are whatever they actually produce. That matters for the last
 * query: the false positive is a genuine one, found by asking the filter, not
 * a word planted at three bits that were chosen to be set.
 */
(function (global) {
"use strict";

var D = global.D, T = D.T;

var M = 32;          /* bits in the filter -- one row across the world       */
var K = 3;           /* hash functions per key                               */
var N_INSERT = 7;    /* names added before any question is asked             */

/* Geometry. The bit row is the spine of the scene and everything else is
   placed off it. */
var CELL = 25, GAP = 3, PITCH = CELL + GAP;
var ROW_W = M * PITCH - GAP;
var ROW_X = Math.round((1000 - ROW_W) / 2);
var ROW_Y = 300, ROW_H = 34;

var WORD_Y = 98;         /* the name currently being added or asked about    */
var ARC_TOP = 132;       /* where the three arcs leave the name              */
var PANEL_Y = 424;       /* the hash chips, and then the verdict             */

var ACCENT = "#FF7A6B";

/*
 * Computer scientists, which is a pool the exhibit can draw a different seven
 * from every time without any of them needing to be explained. Burton Bloom is
 * in there on purpose.
 */
var POOL = [
  "ada", "grace", "linus", "knuth", "turing", "hopper", "dijkstra", "lovelace",
  "babbage", "shannon", "hamming", "liskov", "rivest", "hoare", "backus",
  "curry", "church", "floyd", "wirth", "codd", "thompson", "ritchie", "cerf",
  "perlis", "minsky", "mccarthy", "engelbart", "iverson", "milner", "tarjan",
  "karp", "cook", "valiant", "blum", "rabin", "lamport", "gray", "naur",
  "dahl", "nygaard", "bloom", "kay", "hejlsberg", "torvalds", "stallman"
];

function bitX(i){ return ROW_X + i * PITCH; }
function bitCX(i){ return bitX(i) + CELL / 2; }

/* The k positions a key occupies. This is the whole of the data structure's
   key-handling: everything else is reading and writing bits. */
function positions(word){
  var out = [];
  for (var i = 0; i < K; i++) out.push(D.HASHES[i](word, "") % M);
  return out;
}

var scene = {
  id: "bloom",
  name: "Bloom filter",
  question: "Have I seen this before?",
  accent: ACCENT,

  /* The rail's cost table. `key` is what a beat names in its `hot` field to
     light the row, so the table tracks whatever the picture is doing. */
  cost: [
    { key: "insert", op: "add", big: "O(k)", note: "k bits, k hashes" },
    { key: "query",  op: "might contain?", big: "O(k)", note: "same k bits" },
    { key: "delete", op: "remove", big: "—", note: "not possible" },
    { key: "space",  op: "space", big: "m bits", note: "no keys kept" }
  ],

  uses: "Chrome checked every URL you visited against a Bloom filter of known " +
        "malicious sites for years. Cassandra and Bitcoin wallets use them to " +
        "skip disk reads. Anywhere a <em>maybe</em> is cheap and a lookup is not.",

  /* --------------------------------------------------------------- state */
  bits: [], anim: [], pingT: [], owners: [],
  inserted: [], probe: [], word: "", targets: [],
  mode: "idle",          /* idle | insert | check                            */
  verdict: null,         /* null | { kind, t }                               */
  reveal: 0,             /* the false-positive explanation, 0..1             */
  topLabel: "",
  beats: null,

  reset: function(seed){
    var rand = D.rng(seed);
    var i;

    /*
     * Pick a set of names that will actually demonstrate the point: the seven
     * that go in, one the filter is sure it has never seen, and one it wrongly
     * thinks it has. A run of seven random names usually gives both -- at this
     * fill roughly a fifth of the pool comes back as a false positive -- but
     * "usually" is not good enough for something that has to play unattended,
     * so it re-rolls until it has them.
     */
    var chosen = null;
    for (var attempt = 0; attempt < 200 && !chosen; attempt++){
      var deck = POOL.slice();
      for (i = deck.length - 1; i > 0; i--){
        var j = Math.floor(rand() * (i + 1));
        var s = deck[i]; deck[i] = deck[j]; deck[j] = s;
      }
      var members = deck.slice(0, N_INSERT);
      var bits = [];
      for (i = 0; i < M; i++) bits.push(0);
      for (i = 0; i < members.length; i++){
        var p = positions(members[i]);
        for (var q = 0; q < K; q++) bits[p[q]] = 1;
      }
      /* Which member first set a given bit -- the same rule the owners list
         built during playback follows, worked out here so the wording of the
         caption can depend on it. */
      function ownerOf(bit){
        for (var m = 0; m < members.length; m++){
          if (positions(members[m]).indexOf(bit) >= 0) return members[m];
        }
        return null;
      }

      var fp = null, fpOwners = null, no = null;
      for (i = N_INSERT; i < deck.length; i++){
        var pos = positions(deck[i]);
        var all = bits[pos[0]] && bits[pos[1]] && bits[pos[2]];
        var distinctPos = pos[0] !== pos[1] && pos[1] !== pos[2] && pos[0] !== pos[2];
        if (all && distinctPos){
          /*
           * Prefer the false positive whose bits were set by the most
           * different names. All of them are real false positives, but one
           * that collided with a single name is a weaker story than three
           * unrelated names between them happening to cover it -- and the
           * caption says which it was, so the two cannot disagree.
           */
          var owners = [pos[0], pos[1], pos[2]].map(ownerOf);
          var uniq = owners.filter(function(v, ix, arr){ return v && arr.indexOf(v) === ix; });
          if (!fp || uniq.length > fpOwners.length){ fp = deck[i]; fpOwners = uniq; }
        } else if (!all && !no) no = deck[i];
      }
      if (fp && no) chosen = { members: members, fp: fp, no: no, fpOwners: fpOwners };
    }
    /* Unreachable in practice; if the pool were ever edited down to something
       that cannot produce both, play the inserts and skip the two queries
       rather than showing nothing. */
    if (!chosen) chosen = { members: POOL.slice(0, N_INSERT), fp: null, no: null };

    this.members = chosen.members;
    this.hitWord = chosen.members[Math.floor(rand() * chosen.members.length)];
    this.fpWord = chosen.fp;
    this.fpOwners = chosen.fpOwners || [];
    this.noWord = chosen.no;

    this.bits = []; this.anim = []; this.pingT = []; this.owners = [];
    for (i = 0; i < M; i++){
      this.bits.push(0); this.anim.push(0); this.pingT.push(1); this.owners.push([]);
    }
    this.inserted = [];
    this.probe = [];
    this.word = "";
    this.targets = [];
    this.mode = "idle";
    this.verdict = null;
    this.reveal = 0;
    this.topLabel = "";

    this.script();
  },

  /* --------------------------------------------------------------- script */
  script: function(){
    var self = this;
    var b = new D.Beats();

    b.add(3.2,
      "A Bloom filter is a set that never stores what you put into it. This one " +
      "is 32 bits — four bytes — and seven names are about to go in.",
      function(u){ self.mode = "idle"; self.topLabel = "AN EMPTY FILTER: 32 BITS, ALL ZERO"; },
      { hot: "space" });

    /* The inserts. Each name hashes to three positions and sets those bits;
       a bit already set just stays set, which is where the information starts
       going missing and is the reason deletion is impossible later. */
    this.members.forEach(function(word, n){
      b.add(2.0,
        "Adding <b>" + word + "</b>. Three hash functions turn the name into " +
        "three positions, and those three bits go to 1.",
        function(u){
          self.mode = "insert";
          self.topLabel = "ADDING NAME " + (n + 1) + " OF " + N_INSERT;
          self.word = word;
          self.targets = positions(word);
          self.wordIn = D.easeOut(D.sub(u, 0, 0.18));
          self.probe = self.targets.map(function(pos, j){
            var a = 0.18 + j * 0.10;
            var land = a + 0.34;
            var t = D.easeInOut(D.sub(u, a, land));
            if (t >= 1){
              self.anim[pos] = Math.max(self.anim[pos], D.easeBack(D.sub(u, land, land + 0.16)));
              self.pingT[pos] = Math.min(self.pingT[pos], D.sub(u, land, land + 0.42));
            }
            return { pos: pos, t: t, result: null };
          });
        },
        {
          enter: function(){
            /* The ping is a one-shot, so it is re-armed here rather than left
               at whatever the previous name's beat wound it to. */
            positions(word).forEach(function(pos){ self.pingT[pos] = 0; });
          },
          exit: function(){
            positions(word).forEach(function(pos){
              self.bits[pos] = 1;
              self.anim[pos] = 1;
              if (self.owners[pos].indexOf(word) < 0) self.owners[pos].push(word);
            });
            self.inserted.push(word);
            self.probe = [];
          },
          hot: "insert"
        });
    });

    b.add(2.6,
      "Seven names are in, and not one of them is anywhere on this wall. " +
      "There are only bits.",
      function(u){ self.mode = "idle"; self.word = ""; self.topLabel = "THE FILTER, FULL"; },
      { hot: "space" });

    if (this.hitWord){
      b.add(3.6,
        "Is <b>" + this.hitWord + "</b> in the set? Hash it again, look at the " +
        "same three bits. All three are 1.",
        function(u){ self.check(u, self.hitWord, "in"); },
        { enter: function(){ self.verdict = null; self.reveal = 0; }, hot: "query" });
    }

    if (this.noWord){
      b.add(4.0,
        "Is <b>" + this.noWord + "</b> in the set? One of its bits is still 0 — " +
        "so it cannot have been added, because adding it would have set that bit. " +
        "A Bloom filter is never wrong when it says no.",
        function(u){ self.check(u, self.noWord, "out"); },
        { enter: function(){ self.verdict = null; self.reveal = 0; }, hot: "query" });
    }

    if (this.fpWord){
      /* Say how many names actually set those bits, because it is not always
         three: two of the positions can share an owner. */
      var n = this.fpOwners.length;
      var blame = n >= 3 ? "Three other names set those bits between them."
                : n === 2 ? "Two other names set those bits between them."
                : "Another name set all three of those bits by itself.";
      b.add(6.0,
        "Is <b>" + this.fpWord + "</b> in the set? All three bits are 1, so the " +
        "filter says yes — but " + this.fpWord + " was never added. " + blame +
        " This is a false positive.",
        function(u){
          self.check(u, self.fpWord, "fp");
          self.reveal = D.easeOut(D.sub(u, 0.5, 0.68));
        },
        { enter: function(){ self.verdict = null; self.reveal = 0; }, hot: "query" });
    }

    b.add(4.6,
      "So every answer is either <b>definitely not</b> or <b>probably</b>. You " +
      "never get a wrong no — only, now and then, a wrong yes. In exchange the " +
      "whole set costs four bytes.",
      function(u){ self.mode = "idle"; self.word = ""; self.reveal = 0; self.topLabel = "THE BARGAIN"; },
      { enter: function(){ self.verdict = null; }, hot: "space" });

    this.beats = b;
  },

  /* One query, shared by all three of them. The only difference between a hit,
     a miss and a false positive is what the bits happen to say -- so this does
     not take the answer as an argument, it reads it off the filter, and the
     `kind` is only used to colour the verdict once it lands. */
  check: function(u, word, kind){
    var self = this;
    this.mode = "check";
    this.topLabel = "ASKING THE FILTER";
    this.word = word;
    this.targets = positions(word);
    this.wordIn = D.easeOut(D.sub(u, 0, 0.12));
    this.probe = this.targets.map(function(pos, j){
      var a = 0.12 + j * 0.09;
      var land = a + 0.26;
      var t = D.easeInOut(D.sub(u, a, land));
      return { pos: pos, t: t, result: t >= 1 ? (self.bits[pos] ? "ok" : "zero") : null };
    });
    var settled = D.sub(u, 0.12 + 2 * 0.09 + 0.26, 0.12 + 2 * 0.09 + 0.34);
    this.verdict = settled > 0 ? { kind: kind, t: settled } : null;
  },

  step: function(dt){ this.beats.step(dt); },

  /* ----------------------------------------------------------------- draw */
  draw: function(ctx){
    var i, j;
    var setCount = 0;
    for (i = 0; i < M; i++) if (this.bits[i]) setCount++;

    D.sectionLabel(ctx, this.topLabel, 54, 40, ROW_W, T.dim);

    /* The name under consideration, with a sign for what is being done to it:
       a plus while it is going in, a question mark while it is being asked
       about. */
    if (this.word){
      var lift = 1 - (this.wordIn === undefined ? 1 : this.wordIn);
      ctx.save();
      ctx.globalAlpha = this.wordIn === undefined ? 1 : this.wordIn;
      var sign = this.mode === "insert" ? "+ " : "";
      var tail = this.mode === "check" ? " ?" : "";
      D.text(ctx, sign + this.word + tail, 500, WORD_Y - lift * 18, {
        size: 46, weight: 600, color: T.text
      });
      ctx.restore();
    }

    /* The arcs. Each is labelled with which hash drew it and where it landed,
       because "three positions" is the claim and an unlabelled arc does not
       make it. */
    for (j = 0; j < this.probe.length; j++){
      var pr = this.probe[j];
      if (pr.t <= 0) continue;
      var tx = bitCX(pr.pos), ty = ROW_Y - 4;
      var dx = tx - 500;
      var bow = -D.clamp(dx / 5, -60, 60);
      var col = ACCENT;
      if (pr.result === "ok") col = T.good;
      else if (pr.result === "zero") col = T.bad;
      var head = D.arcTo(ctx, 500, ARC_TOP, tx, ty, bow, {
        t: pr.t,
        color: D.fade(col, this.mode === "check" ? 0.95 : 0.8),
        width: 2.2,
        dash: this.mode === "check" ? [6, 5] : null,
        head: true,
        headSize: 9
      });
      if (pr.t > 0.45){
        var lx = D.lerp(500, tx, 0.52) + (dx < 0 ? -1 : 1) * 26;
        /* Stepped down the arc region by hash index rather than all set at the
           arcs' midpoint: two of the three positions are often close together,
           and at a shared height their labels print straight over each other. */
        var ly = 198 + j * 23;
        D.text(ctx, "h" + (j + 1) + " → " + pr.pos, lx, ly, {
          size: 13, color: D.fade(col, 0.85), weight: 500
        });
      }
      if (head && pr.t < 1){
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(head.x, head.y, 4, 0, Math.PI * 2); ctx.fill();
      }
    }

    /* The bit row. */
    for (i = 0; i < M; i++){
      var x = bitX(i), on = Math.max(this.bits[i], this.anim[i]);
      var isTarget = this.targets.indexOf(i) >= 0 && this.mode !== "idle";
      var probed = null;
      for (j = 0; j < this.probe.length; j++){
        if (this.probe[j].pos === i && this.probe[j].t >= 1) probed = this.probe[j].result;
      }

      var fill = on > 0 ? D.mix(T.panel, ACCENT, 0.25 + 0.7 * on) : T.panel;
      var stroke = null;
      var glow = null;
      if (probed === "ok"){ stroke = T.good; glow = D.fade(T.good, 0.5); }
      else if (probed === "zero"){ stroke = T.bad; glow = D.fade(T.bad, 0.55); }
      else if (isTarget && on > 0){ stroke = D.fade(ACCENT, 0.9); glow = D.fade(ACCENT, 0.4); }

      /* A bit lands with a small vertical kick, so a 0 becoming a 1 is visible
         from across the room rather than only being a colour change. */
      var kick = (isTarget && this.anim[i] > 0 && this.anim[i] < 1) ? (1 - this.anim[i]) * 5 : 0;

      D.box(ctx, x, ROW_Y - kick, CELL, ROW_H, {
        r: ROW_H / 2, fill: fill, stroke: stroke, lineWidth: 2.5,
        glow: glow, glowSize: 14
      });
      D.text(ctx, on > 0.5 ? "1" : "0", x + CELL / 2, ROW_Y + ROW_H / 2 - kick, {
        size: 15, weight: 600,
        color: on > 0.5 ? "#241E26" : T.dim
      });

      if (this.pingT[i] < 1){
        D.ping(ctx, bitCX(i), ROW_Y + ROW_H / 2, 16, 34, this.pingT[i], ACCENT, 2);
      }

      /* Index ticks every four bits, so an arc landing on 23 can be checked. */
      if (this.reveal <= 0 && i % 4 === 0){
        D.text(ctx, String(i), bitCX(i), ROW_Y + ROW_H + 16, { size: 11, color: T.dim });
      }
    }

    /* The false-positive explanation: which earlier name set each of the three
       bits this query just found already set. This is the whole reason the
       owners are tracked at all. */
    if (this.reveal > 0){
      ctx.save();
      ctx.globalAlpha = this.reveal;

      /*
       * Two of the three bits are often only a cell or two apart, and a name
       * is far wider than the 28px between bit centres -- so the labels are
       * laid out left to right and dropped to a second row whenever the one
       * before it is still in the way. The tick keeps each label attached to
       * its own bit.
       */
      var ROWS = [ROW_Y + ROW_H + 19, ROW_Y + ROW_H + 37];
      var rowFree = [-1e9, -1e9];
      var labels = [];
      for (j = 0; j < this.targets.length; j++){
        labels.push({ pos: this.targets[j], x: bitCX(this.targets[j]) });
      }
      labels.sort(function(a, b){ return a.x - b.x; });

      ctx.font = "500 11.5px " + D.MONO;
      for (j = 0; j < labels.length; j++){
        var lab = labels[j];
        var owner = this.owners[lab.pos][0] || "—";
        var txt = "set by " + owner;
        var half = ctx.measureText(txt).width / 2 + 8;
        var row = lab.x - half >= rowFree[0] ? 0 : 1;
        rowFree[row] = lab.x + half;
        var ly2 = ROWS[row];

        ctx.strokeStyle = D.fade(T.warn, 0.45);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(lab.x, ROW_Y + ROW_H + 3); ctx.lineTo(lab.x, ly2 - 8);
        ctx.stroke();
        D.text(ctx, txt, lab.x, ly2, { size: 11.5, color: T.warn, weight: 500 });
        ctx.font = "500 11.5px " + D.MONO;
      }
      ctx.restore();
    }

    /* The running readout. The false-positive rate is the real formula for
       this filter at this fill, so it climbs as the inserts go in and is
       standing at whatever it actually is when the wrong yes arrives. */
    var fill01 = setCount / M;
    var fpRate = Math.pow(fill01, K);
    D.text(ctx, setCount + " of " + M + " bits set", 54, 404, {
      size: 13, color: T.muted, align: "left"
    });
    /* An empty filter has a false-positive rate of zero, which is true and
       says nothing; the number is only worth showing once it is climbing. */
    if (setCount > 0){
      D.text(ctx,
        "a wrong yes about " + Math.round(fpRate * 100) + "% of the time at this fill",
        54 + ROW_W, 404, { size: 13, color: T.warn, align: "right" });
    }

    /* The panel under the row: the hash arithmetic while names are going in,
       the answer while questions are being asked. */
    if (this.verdict) this.drawVerdict(ctx);
    else if (this.mode === "insert") this.drawHashChips(ctx);

    /* The names that went in, kept at the very bottom and deliberately apart
       from the filter: this strip is the exhibit label for what the 32 bits
       above are standing in for, not part of the structure. */
    if (this.inserted.length){
      D.text(ctx, "IN THE SET", 54, 570, { size: 10.5, color: T.dim, align: "left", track: 2 });
      var cx = 54;
      ctx.font = "500 17px " + D.MONO;
      for (i = 0; i < this.inserted.length; i++){
        var w = ctx.measureText(this.inserted[i]).width;
        var isSubject = this.inserted[i] === this.word;
        D.box(ctx, cx - 9, 582, w + 18, 30, {
          r: 15,
          fill: isSubject ? D.fade(ACCENT, 0.2) : T.panel
        });
        D.text(ctx, this.inserted[i], cx + w / 2, 597, {
          size: 17, color: isSubject ? ACCENT : T.muted, weight: 500
        });
        cx += w + 28;
        ctx.font = "500 17px " + D.MONO;
      }
      /* The word being asked about is not in the set, so it is shown off the
         end of the strip with a rule between: the gap is the point. */
      if (this.mode === "check" && this.inserted.indexOf(this.word) < 0 && this.word){
        ctx.strokeStyle = T.line;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx - 4, 580); ctx.lineTo(cx - 4, 614); ctx.stroke();
        var vw = ctx.measureText(this.word).width;
        D.text(ctx, this.word, cx + 14 + vw / 2, 597, {
          size: 17, color: T.bad, weight: 600
        });
        D.text(ctx, "never added", cx + 14 + vw / 2, 572, { size: 11, color: T.bad });
      }
    }
  },

  drawHashChips: function(ctx){
    var labels = ["FNV-1a", "djb2", "sdbm"];
    var w = 214, gap = 18;
    var total = K * w + (K - 1) * gap;
    var x0 = (1000 - total) / 2;
    for (var j = 0; j < K; j++){
      var landed = this.probe[j] && this.probe[j].t >= 1;
      var x = x0 + j * (w + gap);
      D.box(ctx, x, PANEL_Y, w, 56, {
        r: 0,
        fill: landed ? D.fade(ACCENT, 0.16) : D.fade(T.panel, 0.7)
      });
      D.text(ctx, labels[j], x + 16, PANEL_Y + 19, {
        size: 10.5, color: T.dim, align: "left", track: 1.6
      });
      D.text(ctx, "h" + (j + 1) + "(" + this.word + ") mod 32", x + 16, PANEL_Y + 39, {
        size: 13, color: T.muted, align: "left"
      });
      D.text(ctx, landed ? String(this.targets[j]) : "·", x + w - 18, PANEL_Y + 30, {
        size: 26, color: landed ? ACCENT : T.dim, align: "right", weight: 600
      });
    }
  },

  drawVerdict: function(ctx){
    var v = this.verdict;
    var kinds = {
      in:  { big: "PROBABLY IN",  color: T.good, sub: "All three bits are 1. The filter has almost certainly seen this name." },
      out: { big: "DEFINITELY NOT", color: T.bad, sub: "A bit is still 0, so this name was never added. No Bloom filter can be wrong about that." },
      fp:  { big: "PROBABLY IN",  color: T.warn, sub: "All three bits are 1 — but nobody ever added this name. A false positive." }
    };
    var k = kinds[v.kind] || kinds["in"];
    var t = D.easeOut(v.t);
    var w = 700, x = (1000 - w) / 2;

    ctx.save();
    ctx.globalAlpha = t;
    D.box(ctx, x, PANEL_Y - 4, w, 92, {
      r: 0,
      fill: D.fade(k.color, 0.15)
    });
    D.text(ctx, k.big, 500, PANEL_Y + 26, {
      size: 30, weight: 700, color: k.color, track: 1.5
    });
    D.text(ctx, k.sub, 500, PANEL_Y + 62, {
      size: 15.5, color: T.muted, sans: true, weight: 400
    });
    ctx.restore();

    /* On the false positive the verdict is the wrong answer, so it gets struck
       through once the explanation below has arrived. */
    if (v.kind === "fp" && this.reveal > 0){
      ctx.save();
      ctx.strokeStyle = D.fade(T.bad, 0.8 * this.reveal);
      ctx.lineWidth = 2.5;
      ctx.font = "700 30px " + D.MONO;
      var tw = ctx.measureText(k.big).width + k.big.length * 1.5;
      ctx.beginPath();
      ctx.moveTo(500 - tw / 2, PANEL_Y + 27);
      ctx.lineTo(500 - tw / 2 + tw * this.reveal, PANEL_Y + 27);
      ctx.stroke();
      ctx.restore();
    }
  }
};

global.Scenes = global.Scenes || [];
global.Scenes.push(scene);

})(window);
