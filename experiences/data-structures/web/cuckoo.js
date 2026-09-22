/*
 * Cuckoo hashing -- "Where did I put it?"
 *
 * Two tables, two hash functions, and a rule: a key may live in its slot in
 * table 1 or its slot in table 2, and nowhere else. Everything interesting
 * follows from that. A lookup is two probes whatever happens, which is a
 * worst-case guarantee ordinary chaining cannot make. The price is that an
 * insert can have to shove a key out of the way, and that key shoves out
 * another, and occasionally the whole thing gives up and rebuilds.
 *
 * None of the eviction chains here are staged. reset() shuffles the keys,
 * simulates the real algorithm over them, and keeps a shuffle whose run of
 * inserts happens to contain a short chain, a long one and -- once the tables
 * pass about half full -- a genuine failure. The wall then replays that
 * simulation, so the hops on screen are the hops the algorithm took.
 */
(function (global) {
"use strict";

var D = global.D, T = D.T;

var SLOTS = 8;            /* per table                                       */
var MAX_KICKS = 8;        /* before declaring a cycle and rehashing          */

/* The eight rows have to clear the readouts along the bottom: at a 50px pitch
   the last slot ended six pixels above them, which on the wall reads as the
   table resting on the panel below it. */
var TW = 250, TH = 42, TPITCH = 48;
var T1X = 130, T2X = 620, TOP = 140;
var INBOX_Y = 84;         /* where a key waits before it is placed           */

var ACCENT = "#FF7A8A";

var POOL = [
  "cat", "fox", "owl", "bee", "elk", "ram", "yak", "ibis", "crab", "moth",
  "newt", "wren", "lynx", "hare", "seal", "toad", "swan", "mole", "vole",
  "stoat", "otter", "finch", "heron", "raven", "adder", "gecko", "skink",
  "shrew", "tapir", "eagle", "bison", "koala", "lemur", "panda", "zebra"
];

function slotX(table){ return table === 0 ? T1X : T2X; }
function slotY(i){ return TOP + i * TPITCH; }
function slotCX(table){ return slotX(table) + TW / 2; }
function slotCY(i){ return slotY(i) + TH / 2; }

var scene = {
  id: "cuckoo",
  name: "Cuckoo hashing",
  question: "Where did I put it?",
  accent: ACCENT,

  cost: [
    { key: "lookup", op: "lookup", big: "O(1)", note: "two probes, worst case" },
    { key: "delete", op: "delete", big: "O(1)", note: "two probes, then clear" },
    { key: "insert", op: "insert", big: "O(1)", note: "amortized, under 50% full" },
    { key: "rehash", op: "insert, on a cycle", big: "O(n)", note: "rebuild both tables" }
  ],

  uses: "Used where a lookup must never be slow rather than merely fast on " +
        "average: hardware routing tables, some language runtimes, and the " +
        "cuckoo filter, which is a Bloom filter you are allowed to delete from.",

  /* --------------------------------------------------------------- state */
  salt: "", tables: null, steps: [], lookupKey: null,
  view: null,          /* the table contents being drawn this frame          */
  flying: null,        /* { key, x, y, from, evicted }                       */
  probes: null,        /* the lookup's two probes                            */
  homeless: null,      /* the key left over when a chain cycles              */
  probeCount: 0, kicks: 0, hashLabel: null,
  topLabel: "", opLabel: "",
  beats: null,

  reset: function(seed){
    var rand = D.rng(seed);
    var found = null;

    for (var attempt = 0; attempt < 300 && !found; attempt++){
      var deck = POOL.slice();
      for (var i = deck.length - 1; i > 0; i--){
        var j = Math.floor(rand() * (i + 1));
        var s = deck[i]; deck[i] = deck[j]; deck[j] = s;
      }
      var sim = this.simulate(deck, "", MAX_KICKS);

      /*
       * Keep a shuffle only if its run of inserts tells the whole story in
       * order: a few keys that just sit down, then a single eviction, then a
       * chain long enough to be worth watching, and then a genuine failure --
       * which only happens once the tables are past about half full, so it has
       * to be reached without the run going on so long that nobody is still
       * watching.
       */
      var failAt = -1, firstEvict = -1, bigChain = -1, quiet = 0;
      for (var k = 0; k < sim.steps.length; k++){
        var hops = sim.steps[k].chain.length - 1;
        if (!sim.steps[k].ok){ failAt = k; break; }
        if (hops === 0 && firstEvict < 0) quiet++;
        if (hops >= 1 && hops <= 2 && firstEvict < 0) firstEvict = k;
        if (hops >= 3 && bigChain < 0 && firstEvict >= 0) bigChain = k;
      }
      if (failAt < 4 || failAt > 12) continue;
      if (firstEvict < 0 || bigChain < 0) continue;
      if (quiet < 3) continue;

      /* A rehash is only a rehash if the new functions actually work. Salts
         are tried in turn until one places every key, which is exactly what a
         real implementation does when it gives up. */
      var keys = sim.steps.slice(0, failAt + 1).map(function(st){ return st.word; });
      var newSalt = null;
      for (var sa = 1; sa <= 60 && !newSalt; sa++){
        var retry = this.simulate(keys, "r" + sa, MAX_KICKS);
        if (retry.steps.length === keys.length && retry.steps[retry.steps.length - 1].ok){
          newSalt = "r" + sa;
        }
      }
      if (!newSalt) continue;

      found = {
        steps: sim.steps.slice(0, failAt + 1),
        firstEvict: firstEvict, bigChain: bigChain, failAt: failAt,
        newSalt: newSalt,
        rehashed: this.simulate(keys, newSalt, MAX_KICKS)
      };
    }

    if (!found){
      /* Never seen in testing, but the wall has to show something: play the
         keys in pool order with no failure rather than nothing at all. */
      var plain = this.simulate(POOL.slice(0, 7), "", MAX_KICKS);
      found = {
        steps: plain.steps, firstEvict: -1, bigChain: -1, failAt: -1,
        newSalt: null, rehashed: null
      };
    }

    this.plan = found;
    this.salt = "";
    this.steps = found.steps;
    this.view = this.emptyTables();
    this.flying = null;
    this.probes = null;
    this.homeless = null;
    this.probeCount = 0;
    this.kicks = 0;
    this.hashLabel = null;
    this.topLabel = "";
    this.opLabel = "";

    /*
     * A key to look up, chosen from those sitting in table 2 -- so the first
     * probe misses and the second one hits. Both are the real probes for that
     * key; picking one that lands in the second table just means the scene
     * shows the two-probe guarantee doing something rather than getting lucky
     * on the first try.
     */
    var after = found.steps[Math.min(found.bigChain < 0 ? found.steps.length - 1 : found.bigChain, found.steps.length - 1)];
    var snap = after.snaps[after.snaps.length - 1];
    this.lookupKey = null;
    for (var q = 0; q < SLOTS && !this.lookupKey; q++){
      if (snap[1][q]) this.lookupKey = snap[1][q];
    }

    this.script();
  },

  /* ------------------------------------------------------------- the data */

  emptyTables: function(){
    var t = [[], []];
    for (var i = 0; i < SLOTS; i++){ t[0].push(null); t[1].push(null); }
    return t;
  },

  copy: function(t){ return [t[0].slice(), t[1].slice()]; },

  /* Which slot a key may use in a given table. */
  slotFor: function(table, key, salt){
    return D.HASHES[table](key, salt) % SLOTS;
  },

  /*
   * Textbook cuckoo insertion. A key goes to its slot in table 0; whoever was
   * there is evicted to its *other* table, and so on, until an empty slot
   * turns up or MAX_KICKS is spent and the insert is declared failed.
   */
  simulate: function(words, salt, maxKicks){
    var tables = this.emptyTables();
    var steps = [];
    for (var w = 0; w < words.length; w++){
      var cur = words[w], table = 0, chain = [], snaps = [this.copy(tables)], ok = false;
      for (var k = 0; k <= maxKicks; k++){
        var slot = this.slotFor(table, cur, salt);
        var occupant = tables[table][slot];
        chain.push({ table: table, slot: slot, key: cur, evicted: occupant });
        tables[table][slot] = cur;
        snaps.push(this.copy(tables));
        if (!occupant){ ok = true; break; }
        cur = occupant;
        table = 1 - table;
      }
      steps.push({ word: words[w], chain: chain, snaps: snaps, ok: ok, homeless: ok ? null : cur });
      if (!ok) break;
    }
    return { steps: steps, tables: tables };
  },

  /* --------------------------------------------------------------- script */
  script: function(){
    var self = this;
    var b = new D.Beats();
    var plan = this.plan;

    b.add(4.0,
      "Two tables and two hash functions. A key may live in its slot in table 1 " +
      "or its slot in table 2 — <b>those two and nowhere else</b>. Everything " +
      "else about this structure follows from that one rule.",
      function(){
        self.topLabel = "TWO TABLES, TWO HASHES";
        self.opLabel = "";
        self.view = self.emptyTables();
        self.hashLabel = null;
      },
      { hot: "lookup" });

    var said = {};
    plan.steps.forEach(function(st, n){
      var hops = st.chain.length - 1;
      var isFail = !st.ok;
      var dur = isFail
        ? 1.0 + 0.42 * st.chain.length
        : (hops === 0 ? 1.05 : 1.0 + 0.62 * hops);

      var cap;
      if (n === 0){
        cap = "<b>" + st.word + "</b> hashes to a slot in table 1. It is empty, so " +
              "that is where it goes.";
      } else if (isFail){
        /* Don't claim a load factor -- say the one this run actually reached.
           Where the cycle turns up moves around with the shuffle, and it is
           often a little under half, which is exactly the point: the 50% limit
           is where failure becomes likely, not where it begins. */
        var before = 0;
        for (var t0 = 0; t0 < 2; t0++){
          for (var s0 = 0; s0 < SLOTS; s0++) if (st.snaps[0][t0][s0]) before++;
        }
        cap = "<b>" + st.word + "</b> starts a chain that never finds an empty slot — " +
              "it has come back round to a slot it already tried. With " + before +
              " keys in " + (SLOTS * 2) + " slots, the two tables are too tangled to " +
              "take another. There is no repair for this.";
      } else if (hops >= 3 && !said.big){
        said.big = 1;
        cap = "Now a real chain. <b>" + st.word + "</b> evicts the key in its slot, " +
              "which has to go to its <i>other</i> table, where it evicts another — " +
              "" + hops + " keys move before one finds an empty slot.";
      } else if (hops >= 1 && !said.evict){
        said.evict = 1;
        cap = "This slot is taken. <b>" + st.word + "</b> sits down anyway and the key " +
              "that was there is evicted — to its other table, which is always an " +
              "option, because every key has exactly two.";
      } else {
        cap = undefined;
      }

      b.add(dur, cap, function(u){
        self.topLabel = isFail ? "AN INSERT THAT CANNOT FINISH" : "INSERTING " + (n + 1) + " OF " + plan.steps.length;
        self.opLabel = "insert(" + st.word + ")";
        self.playChain(st, u, isFail);
      }, {
        enter: function(){
          self.view = self.copy(st.snaps[0]);
          self.probes = null;
          self.kicks = 0;
          self.homeless = null;
        },
        exit: function(){
          self.view = self.copy(st.snaps[st.snaps.length - 1]);
          self.flying = null;
          self.kicks = st.chain.length - 1;
          self.homeless = st.homeless ? { key: st.homeless } : null;
        },
        hot: isFail ? "rehash" : "insert"
      });

      /* The lookup goes in right after the long chain, while the tables are
         busy enough for the two probes to mean something. */
      if (n === plan.bigChain && self.lookupKey){
        b.add(4.2,
          "Where is <b>" + self.lookupKey + "</b>? There are only two places it could " +
          "be. Check its slot in table 1 — not there. Check its slot in table 2 — " +
          "there it is. <b>Two probes, and never more, no matter how full the " +
          "tables get.</b>",
          function(u){
            self.topLabel = "LOOKING SOMETHING UP";
            self.opLabel = "lookup(" + self.lookupKey + ")";
            var s0 = self.slotFor(0, self.lookupKey, self.salt);
            var s1 = self.slotFor(1, self.lookupKey, self.salt);
            var p0 = D.sub(u, 0.12, 0.34), p1 = D.sub(u, 0.46, 0.68);
            self.probes = [
              { table: 0, slot: s0, t: p0, hit: self.view[0][s0] === self.lookupKey },
              { table: 1, slot: s1, t: p1, hit: self.view[1][s1] === self.lookupKey }
            ];
            self.probeCount = (p0 > 0 ? 1 : 0) + (p1 > 0 ? 1 : 0);
          },
          {
            enter: function(){ self.flying = null; self.probeCount = 0; },
            exit: function(){ self.probes = null; },
            hot: "lookup"
          });
      }
    });

    /* The rebuild. */
    if (plan.newSalt && plan.rehashed){
      b.add(4.4,
        "So it throws both hash functions away, picks new ones, and puts every key " +
        "back. That costs <b>O(n)</b> — but it is rare, and between rebuilds every " +
        "single lookup is still two probes.",
        function(u){
          self.topLabel = "REHASHING WITH NEW FUNCTIONS";
          self.opLabel = "rehash()";
          var clear = D.sub(u, 0.05, 0.3);
          var fill = D.sub(u, 0.38, 0.92);
          self.hashLabel = { t: D.sub(u, 0.3, 0.45) };
          if (clear >= 1 && !self.cleared){
            self.cleared = true;
            self.view = self.emptyTables();
          }
          if (self.cleared){
            /* Keys reappear in their new homes a few at a time. The state
               after the first `upto` keys have been placed is just the last
               snapshot of step upto-1, so there is nothing to replay. */
            var total = plan.rehashed.steps.length;
            var upto = fill >= 1 ? total : Math.floor(fill * total);
            if (upto <= 0){
              self.view = self.emptyTables();
            } else {
              var stq = plan.rehashed.steps[Math.min(upto, total) - 1];
              self.view = self.copy(stq.snaps[stq.snaps.length - 1]);
            }
          }
          self.fade = clear;
        },
        {
          enter: function(){ self.cleared = false; self.homeless = null; self.flying = null; },
          exit: function(){
            self.salt = plan.newSalt;
            var f = plan.rehashed.steps[plan.rehashed.steps.length - 1];
            self.view = self.copy(f.snaps[f.snaps.length - 1]);
            self.hashLabel = null;
          },
          hot: "rehash"
        });
    }

    b.add(4.6,
      "Chained hashing is quick on average and its worst case is a walk down a long " +
      "bucket. Cuckoo hashing gives that up for a promise: <b>two places, always</b>. " +
      "Which trade you want depends on whether you care about the average or the " +
      "worst day.",
      function(){
        self.topLabel = "THE TRADE";
        self.opLabel = "";
        self.flying = null;
        self.probes = null;
      },
      { hot: "lookup" });

    this.beats = b;
  },

  /* Replays one insert's eviction chain across the beat, one hop per slice. */
  playChain: function(st, u, isFail){
    var hops = st.chain.length;
    var per = 1 / hops;
    var idx = Math.min(hops - 1, Math.floor(u / per));
    var local = D.clamp((u - idx * per) / per, 0, 1);
    var hop = st.chain[idx];

    /* Everything placed by earlier hops is already down. */
    this.view = this.copy(st.snaps[idx]);
    this.kicks = idx;

    var to = { x: slotCX(hop.table), y: slotCY(hop.slot) };
    var from;
    if (idx === 0){
      from = { x: 500, y: INBOX_Y };
    } else {
      var prev = st.chain[idx - 1];
      from = { x: slotCX(prev.table), y: slotCY(prev.slot) };
    }

    var travel = D.easeInOut(D.clamp(local / 0.72, 0, 1));
    this.flying = {
      key: hop.key,
      from: from, to: to,
      t: travel,
      target: { table: hop.table, slot: hop.slot },
      landed: travel >= 1,
      evicted: hop.evicted,
      /* The occupant lifts out as the incoming key arrives. */
      evictT: hop.evicted ? D.sub(local, 0.6, 1) : 0
    };
    if (travel >= 1){
      this.view[hop.table][hop.slot] = hop.key;
    }
    if (isFail && idx === hops - 1 && local > 0.8){
      this.homeless = { key: st.homeless, t: D.sub(local, 0.8, 1) };
    }
  },

  step: function(dt){ this.beats.step(dt); },

  /* ----------------------------------------------------------------- draw */
  draw: function(ctx){
    D.sectionLabel(ctx, this.topLabel, T1X, 40, T2X + TW - T1X, T.dim);
    if (this.opLabel){
      D.text(ctx, this.opLabel, T2X + TW, 40, {
        size: 15, color: ACCENT, align: "right", weight: 600
      });
    }

    this.drawTable(ctx, 0);
    this.drawTable(ctx, 1);

    /* The arc a travelling key follows, drawn behind it. */
    if (this.flying && this.flying.t > 0 && this.flying.t < 1){
      var f = this.flying;
      var bow = f.from.x < f.to.x ? -46 : 46;
      D.arcTo(ctx, f.from.x, f.from.y, f.to.x, f.to.y, bow, {
        t: f.t, color: D.fade(ACCENT, 0.5), width: 2, dash: [5, 5]
      });
    }

    if (this.flying) this.drawFlying(ctx);
    if (this.homeless) this.drawHomeless(ctx);
    if (this.hashLabel) this.drawNewHashes(ctx);

    this.drawTally(ctx);
  },

  drawTable: function(ctx, table){
    var x = slotX(table);
    var label = table === 0 ? "TABLE 1" : "TABLE 2";
    var hlabel = table === 0 ? "slot = h1(key) mod 8" : "slot = h2(key) mod 8";

    D.text(ctx, label, x, 108, { size: 12, color: T.muted, align: "left", track: 2, weight: 600 });
    D.text(ctx, hlabel, x + TW, 108, { size: 12, color: T.dim, align: "right" });

    for (var i = 0; i < SLOTS; i++){
      var y = slotY(i);
      var key = this.view ? this.view[table][i] : null;

      var probe = null;
      if (this.probes){
        for (var p = 0; p < this.probes.length; p++){
          var pr = this.probes[p];
          if (pr.table === table && pr.slot === i && pr.t > 0) probe = pr;
        }
      }
      var incoming = this.flying && this.flying.target.table === table &&
                     this.flying.target.slot === i;
      var evicting = incoming && this.flying.evicted && this.flying.evictT > 0;

      var fill = key ? D.fade(ACCENT, 0.13) : D.fade(T.panel, 0.75);
      var stroke = key ? D.fade(ACCENT, 0.5) : T.line;
      var lw = 1.2, glow = null;

      if (probe && probe.t >= 1){
        if (probe.hit){ stroke = T.good; fill = D.fade(T.good, 0.16); glow = D.fade(T.good, 0.5); lw = 2.2; }
        else { stroke = T.bad; fill = D.fade(T.bad, 0.1); lw = 2; }
      } else if (incoming && this.flying.t >= 1){
        stroke = "#FFFFFF"; glow = D.fade(ACCENT, 0.6); lw = 2.2;
      } else if (incoming){
        stroke = D.fade(ACCENT, 0.9); lw = 1.8;
      }

      D.box(ctx, x, y, TW, TH, {
        r: 6, fill: fill, stroke: stroke, lineWidth: lw, glow: glow, glowSize: 16
      });

      /* The slot index, outside the table on the side away from the middle, so
         the gap between the tables stays clear for the arcs. */
      D.text(ctx, String(i),
        table === 0 ? x - 14 : x + TW + 14, y + TH / 2,
        { size: 12.5, color: T.dim, align: table === 0 ? "right" : "left" });

      if (key){
        /* The occupant being lifted out rises and fades as its replacement
           lands, so the two are never both simply sitting there. */
        var lift = evicting ? D.easeOut(this.flying.evictT) : 0;
        ctx.save();
        ctx.globalAlpha = 1 - lift * 0.85;
        D.text(ctx, key, x + TW / 2, y + TH / 2 - lift * 12, {
          size: 20, weight: 600, color: probe && probe.t >= 1 && probe.hit ? T.good : T.text
        });
        ctx.restore();
      } else if (probe && probe.t >= 1 && !probe.hit){
        D.text(ctx, "empty", x + TW / 2, y + TH / 2, { size: 14, color: T.dim });
      }

      if (probe && probe.t > 0 && probe.t < 1){
        D.ping(ctx, x + TW / 2, y + TH / 2, 20, 60, probe.t, ACCENT, 2);
      }
    }

    /* A probe is labelled where it lands, because "this is probe 1 of 2" is
       the claim the whole scene is making. */
    if (this.probes){
      for (var q = 0; q < this.probes.length; q++){
        var pq = this.probes[q];
        if (pq.table !== table || pq.t < 1) continue;
        var ly = slotCY(pq.slot);
        var lx = table === 0 ? x - 34 : x + TW + 34;
        D.text(ctx, "probe " + (q + 1), lx, ly, {
          size: 11.5, color: pq.hit ? T.good : T.bad,
          align: table === 0 ? "right" : "left", weight: 600
        });
      }
    }
  },

  drawFlying: function(ctx){
    var f = this.flying;
    if (f.t >= 1) return;
    var x = D.lerp(f.from.x, f.to.x, f.t);
    var y = D.lerp(f.from.y, f.to.y, f.t);
    /* Follow the same bow the trail uses, so the key rides its own arc. */
    var bow = f.from.x < f.to.x ? -46 : 46;
    var mx = (f.from.x + f.to.x) / 2, my = (f.from.y + f.to.y) / 2;
    var dx = f.to.x - f.from.x, dy = f.to.y - f.from.y;
    var len = Math.hypot(dx, dy) || 1;
    var cx = mx - (dy / len) * bow, cy = my + (dx / len) * bow;
    var iu = 1 - f.t;
    x = iu*iu*f.from.x + 2*iu*f.t*cx + f.t*f.t*f.to.x;
    y = iu*iu*f.from.y + 2*iu*f.t*cy + f.t*f.t*f.to.y;

    ctx.font = "600 20px " + D.MONO;
    var w = ctx.measureText(f.key).width + 30;
    D.box(ctx, x - w / 2, y - 18, w, 36, {
      r: 8, fill: D.fade(ACCENT, 0.9), stroke: "#FFFFFF", lineWidth: 1.4,
      glow: D.fade(ACCENT, 0.7), glowSize: 22
    });
    D.text(ctx, f.key, x, y, { size: 20, weight: 700, color: "#12111A" });
  },

  /* The key with nowhere to go: the cycle, made concrete. */
  drawHomeless: function(ctx){
    var h = this.homeless;
    var t = h.t === undefined ? 1 : D.easeOut(h.t);
    ctx.save();
    ctx.globalAlpha = t;
    ctx.font = "700 22px " + D.MONO;
    var w = ctx.measureText(h.key).width + 40;
    D.box(ctx, 500 - w / 2, INBOX_Y - 22, w, 44, {
      r: 10, fill: D.fade(T.bad, 0.2), stroke: T.bad, lineWidth: 2,
      glow: D.fade(T.bad, 0.55), glowSize: 24
    });
    D.text(ctx, h.key, 500, INBOX_Y, { size: 22, weight: 700, color: T.bad });
    D.text(ctx, "nowhere left to put this one", 500, INBOX_Y + 36, {
      size: 13, color: T.bad, sans: true
    });
    ctx.restore();
  },

  drawNewHashes: function(ctx){
    var t = D.easeOut(this.hashLabel.t);
    if (t <= 0) return;
    ctx.save();
    ctx.globalAlpha = t;
    D.text(ctx, "new h1, new h2", 500, INBOX_Y, {
      size: 20, weight: 700, color: ACCENT
    });
    D.text(ctx, "every key moves", 500, INBOX_Y + 28, {
      size: 13, color: T.muted, sans: true
    });
    ctx.restore();
  },

  drawTally: function(ctx){
    var used = 0;
    if (this.view){
      for (var t = 0; t < 2; t++){
        for (var i = 0; i < SLOTS; i++) if (this.view[t][i]) used++;
      }
    }
    var load = Math.round((used / (SLOTS * 2)) * 100);

    var items = [
      { label: "KEYS STORED", v: used + " / " + (SLOTS * 2), note: load + "% full" },
      { label: "LAST INSERT", v: this.kicks ? this.kicks + " evicted" : "no evictions", note: "keys that had to move" },
      { label: "A LOOKUP COSTS", v: "2", note: "probes, guaranteed" }
    ];
    var w = 250, gap = 16;
    var total = items.length * w + (items.length - 1) * gap;
    var x0 = (1000 - total) / 2;
    for (var k = 0; k < items.length; k++){
      var it = items[k], x = x0 + k * (w + gap);
      var live = k === 2 && this.probes;
      D.box(ctx, x, 550, w, 56, {
        r: 8,
        fill: live ? D.fade(ACCENT, 0.1) : D.fade(T.panel, 0.55),
        stroke: live ? D.fade(ACCENT, 0.5) : T.line,
        lineWidth: 1.1
      });
      D.text(ctx, it.label, x + 16, 568, {
        size: 10, color: T.dim, align: "left", track: 1.6, weight: 600
      });
      D.text(ctx, it.note, x + 16, 589, { size: 12, color: T.dim, align: "left" });
      D.text(ctx, it.v, x + w - 16, 578, {
        size: it.v.length > 8 ? 17 : 24, weight: 700, color: ACCENT, align: "right"
      });
    }

    /* The limit the whole structure lives under. Two-table cuckoo hashing is
       reliable up to about 50% and unreliable above it, so the note earns its
       place from about 40% on -- which is where the runs here tend to break. */
    if (load >= 38){
      D.text(ctx, "two-table cuckoo hashing gets unreliable above 50% full",
        500, 622, { size: 12.5, color: T.warn, sans: true });
    }
  }
};

global.Scenes = global.Scenes || [];
global.Scenes.push(scene);

})(window);
