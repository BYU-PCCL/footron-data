/*
 * Color codes -- "What color is this?"
 *
 * One color, written three ways, with the arithmetic that gets from each way
 * to the next drawn rather than stated. The run is built around the one fact
 * that makes RGB and HSL worth showing together: they are the same three
 * numbers. Hue, saturation and lightness are all read off the largest and the
 * smallest of the red, green and blue channels, so the last beat turns the hue
 * and lets a visitor watch the three channels chase each other around.
 *
 * Everything on screen is computed at runtime by the conversions in draw.js.
 * There is no table of colors with their codes typed in beside them: the wall
 * picks a color, and every digit, percentage and angle it shows is derived
 * from those three bytes. That is what lets the game mark an answer.
 *
 * The scene has two modes. `show` is the attract loop -- a scripted run, the
 * same shape as the other exhibits in this family. `game` is what a phone can
 * switch it into: the color, four codes, and the wall waiting to be told which
 * one is right.
 */
(function (global) {
"use strict";

var D = global.D, T = D.T;

/* ------------------------------------------------------------- geometry */

/* All of this is in the fixed 1000x640 world the shell fits to the wall. */

/* The swatch and the three notations under it, in attract mode. */
var SW = { x: 56, y: 96, w: 292, h: 292 };
var LINE_Y = [420, 482, 544];          /* label baseline; value sits 24 below */

var DIV_X = 378;                       /* the rule between the two columns    */
var RX = 404, RW = 552;                /* the right column                    */

/* RGB: three bars, each with its value and its eight bits. */
var BAR_Y = [108, 152, 196], BAR_H = 24;
var BAR_X = 436, BAR_W = 264;
var VAL_X = 748;                       /* right edge of the number            */
var BIT_X = 762, BIT_W = 20, BIT_GAP = 4;

/* HEX: six digit boxes, grouped in pairs. */
var HEX_Y = 272, HEX_H = 58, DIG_W = 54;
var PAIR_X = [436, 566, 696];          /* left edge of each channel's pair    */
var HEX_NOTE_X = 826;

/* HSL: the hue ring, and bars for saturation and lightness. */
var RING_X = 490, RING_Y = 474, RING_R = 62, RING_T = 16;
var SL_X = 600, SL_W = 330, SL_H = 18;
var S_Y = 442, L_Y = 506;

/* The channel-against-hue chart, only on screen during the sweep. Inset from
   the column so the 0 and 255 marks have somewhere to sit. */
var CH_X = 440, CH_W = 516, CH_Y = 566, CH_H = 60;

/* Game mode. */
var GSW = { x: 56, y: 96, w: 340, h: 340 };
var OPT_X = 448, OPT_W = 508, OPT_Y = 96, OPT_H = 78, OPT_GAP = 12;

var CHAN = ["r", "g", "b"];
var CHAN_LABEL = ["R", "G", "B"];
/* The three channels are drawn in their own light, which is the one place in
   the exhibit where a structural element is allowed to be colored: a bar
   labelled G that is not green would be working against the thing it is for. */
var CHAN_COLOR = ["#FF6B6B", "#63D473", "#6BA8FF"];

var NOTATIONS = ["hex", "rgb", "hsl"];
var NOTATION_NAME = { hex: "hex", rgb: "rgb()", hsl: "hsl()" };

/* How long the game waits, in seconds. */
var REVEAL_HOLD = 7.0;    /* sitting on a marked answer before the next round */
var IDLE_GIVE_UP = 75;    /* nobody has touched a phone: back to the loop     */

function optY(i){ return OPT_Y + i * (OPT_H + OPT_GAP); }

/* ---------------------------------------------------------------- scene */

var scene = {
  id: "color",
  name: "Color codes",
  question: "What color is this?",

  /* The accent is the color itself, floored to something readable so the rail
     and the progress bar can wear it. The shell reads this every frame. */
  accent: "#8AB4FF",

  uses: "Hex is what CSS, Photoshop and every design handoff speak. " +
        "<em>rgb()</em> is what an image file and a screen actually hold. " +
        "<em>hsl()</em> is what you want the moment you need this color but " +
        "darker, or this color's opposite.",

  /* --------------------------------------------------------------- state */
  mode: "show",              /* show | game                                  */
  c: { r: 0, g: 0, b: 0 },   /* the color on screen right now                */
  base: { r: 0, g: 0, b: 0 },/* the run's color, which the sweep departs from */
  topLabel: "",
  beats: null,
  seed: 1,

  /* Reveal amounts, 0..1, one per block of the right column. */
  show: { swatch: 0, rgb: 0, bits: 0, hex: 0, hsl: 0, ring: 0, chart: 0, lines: [0, 0, 0] },
  /* Which block the narration is on. Everything else dims. */
  focus: null,
  em: { rgb: 1, hex: 1, hsl: 1 },
  /* Per-beat working values the draw pass reads. */
  hexStep: -1,          /* which channel the hex arithmetic is on, -1 for none */
  hexArc: 0,
  mark: 0,              /* the max/min markers on the bars, 0..1              */
  sweep: false,

  /* Game state. */
  game: null,
  stateVersion: 0,      /* bumped whenever the phone's view of this is stale  */
  request: null,        /* a mode the scene would like the shell to switch to */

  /* -------------------------------------------------------------- colors */

  /*
   * A color worth looking at. Picked in HSL, because picking three random
   * bytes gives a run of muddy colors that all look like each other, and kept
   * as bytes from there on -- the bytes are the truth, and every number the
   * wall shows is derived back out of them.
   */
  pick: function(rand){
    var h = Math.floor(rand() * 360);
    var s = 0.45 + rand() * 0.48;
    var l = 0.36 + rand() * 0.26;
    return D.hslToRgb(h, s, l);
  },

  setColor: function(c){
    this.c = c;
    this.accent = D.legible(c);
  },

  /* ---------------------------------------------------------------- init */

  reset: function(seed){
    this.seed = seed >>> 0;
    var rand = D.rng(this.seed);
    this.base = this.pick(rand);
    this.setColor(this.base);
    this.topLabel = "";
    this.focus = null;
    this.hexStep = -1; this.hexArc = 0; this.mark = 0; this.sweep = false;
    this.show = { swatch: 0, rgb: 0, bits: 0, hex: 0, hsl: 0, ring: 0, chart: 0, lines: [0, 0, 0] };
    this.em = { rgb: 1, hex: 1, hsl: 1 };

    if (this.mode === "game"){
      this.startGame();
    } else {
      this.game = null;
      this.script();
    }
    this.stateVersion++;
  },

  /* ------------------------------------------------------------- the run */

  script: function(){
    var self = this;
    var b = new D.Beats();

    b.add(3.4,
      "Every color on this wall is three numbers, and nothing else. Here is " +
      "one of them — this square is all the computer is actually holding.",
      function(u){
        self.topLabel = "ONE COLOR";
        self.focus = null;
        self.show.swatch = D.easeOut(D.sub(u, 0, 0.45));
      },
      { hot: "rgb" });

    b.add(5.0,
      "Three lights — <b>red</b>, <b>green</b> and <b>blue</b> — each turned up " +
      "somewhere between 0 and 255. Mixed together, they are the square on the left.",
      function(u){
        self.topLabel = "RGB — HOW MUCH OF EACH LIGHT";
        self.focus = "rgb";
        self.show.rgb = D.easeOut(D.sub(u, 0.05, 0.6));
        self.show.lines[1] = D.easeOut(D.sub(u, 0.55, 0.85));
      },
      { hot: "rgb" });

    b.add(4.6,
      "Each of those numbers fits in one byte — <b>eight bits</b>. Three bytes " +
      "is the whole color: 24 bits, and 16,777,216 colors to choose from.",
      function(u){
        self.topLabel = "24 BITS: THREE BYTES, EIGHT BITS EACH";
        self.focus = "rgb";
        self.show.bits = D.easeOut(D.sub(u, 0, 0.5));
      },
      { hot: "bits" });

    b.add(6.4,
      "Hex writes those same three bytes in base 16, two digits each. A byte " +
      "is however many sixteens, and then what is left over.",
      function(u){
        self.topLabel = "HEX — THE SAME THREE NUMBERS, BASE 16";
        self.focus = "hex";
        self.show.hex = D.easeOut(D.sub(u, 0, 0.18));
        /* One channel at a time, so the arithmetic beside it is readable. */
        var seg = D.clamp(Math.floor(D.sub(u, 0.06, 0.96) * 3), 0, 2);
        self.hexStep = seg;
        self.hexArc = D.easeOut(D.sub(u, 0.06 + seg * 0.3, 0.06 + seg * 0.3 + 0.2));
        self.show.lines[0] = D.easeOut(D.sub(u, 0.7, 0.95));
      },
      { enter: function(){ self.hexStep = 0; }, exit: function(){ self.hexStep = -1; }, hot: "hex" });

    b.add(3.8,
      "Which is the whole of the trick behind <i>#FFFFFF</i> and <i>#000000</i>: " +
      "FF is 255, all three lights full. 00 is all three off.",
      function(u){ self.topLabel = "HEX — TWO DIGITS PER CHANNEL"; self.focus = "hex"; },
      { hot: "hex" });

    b.add(5.2,
      "HSL asks three different questions, and answers every one of them out of " +
      "the <b>largest</b> and <b>smallest</b> of those same three channels.",
      function(u){
        self.topLabel = "HSL — READ OFF THE BIGGEST AND SMALLEST CHANNEL";
        self.focus = "hsl";
        self.show.hsl = D.easeOut(D.sub(u, 0, 0.3));
        self.mark = D.easeOut(D.sub(u, 0.15, 0.6));
      },
      { hot: "hsl" });

    b.add(4.6,
      "<b>Lightness</b> is where those two sit: halfway between the biggest " +
      "channel and the smallest. Push all three up and the color gets paler.",
      function(u){
        self.topLabel = "L — HALFWAY BETWEEN THE TWO";
        self.focus = "hsl";
        self.mark = 1;
        self.show.hsl = Math.max(self.show.hsl, D.easeOut(D.sub(u, 0, 0.3)));
      },
      { hot: "hsl" });

    b.add(4.6,
      "<b>Saturation</b> is how far apart they are. All three channels equal is " +
      "gray — no biggest, no smallest, no color left to name.",
      function(u){ self.topLabel = "S — HOW FAR APART THEY ARE"; self.focus = "hsl"; self.mark = 1; },
      { hot: "hsl" });

    b.add(5.0,
      "<b>Hue</b> is which channel is on top, and how far the middle one has " +
      "travelled between the other two. That is the angle on the ring.",
      function(u){
        self.topLabel = "H — WHICH CHANNEL IS ON TOP";
        self.focus = "hsl";
        self.mark = 1;
        self.show.ring = D.easeOut(D.sub(u, 0, 0.45));
        self.show.lines[2] = D.easeOut(D.sub(u, 0.55, 0.85));
      },
      { hot: "hsl" });

    /* The beat the whole run is built to arrive at. Turning the hue is the
       only way to show that hue is not a fourth number stored somewhere: it is
       the shape of the three that are. */
    b.add(9.0,
      "So turn the hue, and watch the three channels chase each other: each one " +
      "climbs, holds at the top, falls, holds at the bottom — one third of a " +
      "turn behind the one before it. <b>Hue is nothing but the order and the " +
      "spacing of those three numbers.</b>",
      function(u){
        self.topLabel = "TURNING THE HUE, HOLDING S AND L";
        self.focus = null;
        self.sweep = true;
        self.show.chart = D.easeOut(D.sub(u, 0, 0.12));
        var v = D.rgbToHsl(self.base);
        /* A full turn, easing in and out so the ends are not a jolt, landing
           exactly back on the color the run started from. */
        var turn = D.easeInOut(D.clamp(u, 0, 1));
        self.setColor(D.hslToRgb(v.h + turn * 360, v.s, v.l));
      },
      {
        exit: function(){ self.sweep = false; self.setColor(self.base); },
        hot: "hsl"
      });

    b.add(5.0,
      "One color, three ways of writing it. Hex and rgb() are the same three " +
      "bytes in two alphabets. hsl() is a different set of questions about them " +
      "— and the reason a designer can ask for <i>this color, but darker</i>.",
      function(u){
        self.topLabel = "THE SAME COLOR, THREE WAYS";
        self.focus = null;
        self.show.chart = Math.max(0, 1 - u * 3);
      },
      { hot: "hex" });

    this.beats = b;
  },

  /* ----------------------------------------------------------- the game */

  /*
   * A round is the color, three distractors, and one of the three notations to
   * write all four in. The notation rotates rather than being drawn at random,
   * so a visitor who plays three rounds has met all three.
   *
   * The distractors are real colors -- the wall draws each of them beside its
   * code once the answer is in, which is the part that actually teaches. They
   * are built to be wrong in three different ways: a color from somewhere else
   * on the ring, a near neighbour on the ring, and the right hue at the wrong
   * lightness. That last one is the one that catches people.
   */
  startGame: function(){
    this.game = {
      round: 0,
      right: 0,
      asked: 0,
      state: "ask",        /* ask | reveal                                   */
      picked: -1,
      t: 0,
      idle: 0,
      options: [],
      correct: 0,
      notation: "hex",
      rand: D.rng((this.seed ^ 0x9e3779b9) >>> 0)
    };
    this.nextRound();
  },

  nextRound: function(){
    var g = this.game;
    if (!g) return;
    var rand = g.rand;

    var notation = NOTATIONS[g.round % NOTATIONS.length];
    var target = null, others = null;

    /* Re-rolled until the four are far enough apart in the byte cube that a
       visitor can tell them apart across a room. Bounded, and the bound is
       never reached in practice -- the transforms below are large. */
    for (var attempt = 0; attempt < 60 && !others; attempt++){
      var h = Math.floor(rand() * 360);
      var s = 0.5 + rand() * 0.42;
      var l = 0.38 + rand() * 0.22;
      target = D.hslToRgb(h, s, l);

      var far = h + 110 + rand() * 140;                      /* another family */
      var near = h + (rand() < 0.5 ? -1 : 1) * (45 + rand() * 35);  /* a neighbour */
      var lFlip = l < 0.5 ? l + 0.26 + rand() * 0.12 : l - (0.26 + rand() * 0.12);

      var cand = [
        D.hslToRgb(far, s, l),
        D.hslToRgb(near, D.clamp(s - 0.15 + rand() * 0.3, 0.3, 1), l),
        D.hslToRgb(h, D.clamp(s - 0.1 + rand() * 0.2, 0.3, 1), lFlip)
      ];

      var all = [target].concat(cand), ok = true;
      for (var i = 0; i < all.length && ok; i++){
        for (var j = i + 1; j < all.length; j++){
          if (D.dist(all[i], all[j]) < 85){ ok = false; break; }
        }
      }
      if (ok) others = cand;
    }
    if (!others) others = [D.hslToRgb(20, 0.8, 0.5), D.hslToRgb(140, 0.7, 0.45), D.hslToRgb(260, 0.7, 0.6)];

    var options = [target].concat(others);
    /* Fisher-Yates, so the answer is not the first card every time. */
    for (var k = options.length - 1; k > 0; k--){
      var m = Math.floor(rand() * (k + 1));
      var tmp = options[k]; options[k] = options[m]; options[m] = tmp;
    }

    g.notation = notation;
    g.options = options;
    g.correct = options.indexOf(target);
    g.state = "ask";
    g.picked = -1;
    g.t = 0;
    g.idle = 0;
    g.round++;

    this.setColor(target);
    this.topLabel = "WHICH CODE IS THIS COLOR?";
    this.stateVersion++;
  },

  /* An answer from a phone. The first one in decides the round: a second
     visitor tapping a moment later is answering a question that has already
     been marked, and quietly changing the score under the first one would be
     worse than ignoring them. */
  answer: function(index){
    var g = this.game;
    if (!g || g.state !== "ask") return;
    index = Math.floor(Number(index));
    if (!(index >= 0 && index < g.options.length)) return;
    g.picked = index;
    g.state = "reveal";
    g.t = 0;
    g.asked++;
    if (index === g.correct) g.right++;
    this.stateVersion++;
  },

  /* The scene never switches its own mode: it asks, and the shell does it on
     the other side of a cross-fade with a fresh seed. Switching in place would
     mean a hard cut from a half-drawn picture of one mode to the other. */
  ask: function(m){ this.request = m; this.stateVersion++; },

  /* What the phone needs in order to draw the same round. The color itself is
     deliberately not in here while a question is open: the point of the exhibit
     is that the color is on the wall, and a phone that showed it would let a
     visitor play with their back to it. */
  phoneState: function(){
    var g = this.game;
    if (this.mode !== "game" || !g){
      return { type: "state", mode: "show" };
    }
    var self = this;
    var revealed = g.state === "reveal";
    return {
      type: "state",
      mode: "game",
      round: g.round,
      notation: g.notation,
      options: g.options.map(function(c){ return self.codeFor(c, g.notation); }),
      picked: g.picked,
      correct: revealed ? g.correct : -1,
      revealed: revealed,
      swatches: revealed ? g.options.map(function(c){ return D.toHex(c); }) : null,
      right: g.right,
      asked: g.asked
    };
  },

  /*
   * Why the answer was the answer, in the notation that was on the board.
   *
   * Worked out from the two colors rather than written per round, which is
   * what keeps it true: it names the channel that actually differs most, with
   * the two numbers a visitor can go and read off the wall. A wrong guess is
   * the only moment in the exhibit when somebody is definitely looking for a
   * rule, so this is where the rule goes.
   */
  hint: function(truth, picked, notation){
    if (notation === "hsl"){
      var a = D.rgbToHsl(truth), b = D.rgbToHsl(picked);
      /* Hue is circular, so the difference has to go the short way round. */
      var dh = Math.abs(a.h - b.h); if (dh > 180) dh = 360 - dh;
      if (dh > 25){
        return "The hue is <b>" + Math.round(a.h) + "°</b>, not " +
               Math.round(b.h) + "° — a different place on the ring.";
      }
      if (Math.abs(a.l - b.l) >= Math.abs(a.s - b.s)){
        return "Same hue, different <b>lightness</b>: " + Math.round(a.l * 100) +
               "% against " + Math.round(b.l * 100) + "%.";
      }
      return "Same hue, different <b>saturation</b>: " + Math.round(a.s * 100) +
             "% against " + Math.round(b.s * 100) + "%.";
    }

    var names = ["red", "green", "blue"];
    var worst = 0, gap = -1;
    for (var i = 0; i < 3; i++){
      var d = Math.abs(truth[CHAN[i]] - picked[CHAN[i]]);
      if (d > gap){ gap = d; worst = i; }
    }
    var more = truth[CHAN[worst]] > picked[CHAN[worst]] ? "more" : "less";
    if (notation === "hex"){
      return "It has " + more + " <b>" + names[worst] + "</b> — the " +
             ["first", "middle", "last"][worst] + " pair is <b>" +
             D.hexPair(truth[CHAN[worst]]).text + "</b>, not " +
             D.hexPair(picked[CHAN[worst]]).text + ".";
    }
    return "It has " + more + " <b>" + names[worst] + "</b>: <b>" +
           truth[CHAN[worst]] + "</b>, not " + picked[CHAN[worst]] + ".";
  },

  codeFor: function(c, notation){
    return notation === "hex" ? D.hexText(c)
         : notation === "rgb" ? D.rgbText(c)
         : D.hslText(c);
  },

  /* ---------------------------------------------------------------- step */

  step: function(dt){
    if (this.mode === "game"){
      var g = this.game;
      if (!g) return;
      g.t += dt;
      g.idle += dt;
      if (g.state === "reveal" && g.t > REVEAL_HOLD) this.nextRound();
      /* Left alone, the exhibit goes back to playing itself. A wall sitting on
         an unanswered question is a wall that looks broken. */
      if (g.state === "ask" && g.idle > IDLE_GIVE_UP) this.ask("show");
      return;
    }

    this.beats.step(dt);

    /* Dim whatever the narration is not on. Smoothed rather than switched, so
       a block that loses focus fades out instead of blinking. */
    var k = Math.min(1, dt * 5);
    var self = this;
    ["rgb", "hex", "hsl"].forEach(function(block){
      var want = (self.focus === null || self.focus === block) ? 1 : 0.34;
      self.em[block] += (want - self.em[block]) * k;
    });
  },

  caption: function(){
    if (this.mode === "game"){
      var g = this.game;
      if (!g) return "";
      if (g.state === "ask"){
        return "Four codes, one color. Which of them is the square on the left? " +
               "<i>Answer on your phone.</i>";
      }
      var right = g.picked === g.correct;
      var trueCode = this.codeFor(g.options[g.correct], g.notation);
      if (right){
        return "<b>Right.</b> " + trueCode + " is this color — and every other " +
               "code on the board is drawn beside it now, so you can see what " +
               "you were choosing between.";
      }
      return "<b>Not this one.</b> The square on the wall is <b>" + trueCode +
             "</b>, and what you picked is drawn beside its code. " +
             this.hint(g.options[g.correct], g.options[g.picked], g.notation);
    }
    return this.beats ? this.beats.cap : "";
  },

  hot: function(){
    if (this.mode === "game") return this.game && this.game.notation === "rgb" ? "rgb"
                                   : this.game && this.game.notation === "hsl" ? "hsl" : "hex";
    return this.beats ? this.beats.hot : null;
  },

  progress: function(){
    if (this.mode === "game"){
      var g = this.game;
      if (!g) return 0;
      return g.state === "reveal" ? D.clamp(g.t / REVEAL_HOLD, 0, 1) : 0;
    }
    return this.beats ? this.beats.progress() : 0;
  },

  finished: function(){
    /* The game never ends on its own -- it hands itself back to the loop from
       step() instead, so the shell has nothing to do here. */
    return this.mode === "show" && this.beats ? this.beats.done : false;
  },

  /* The live values in the rail. Hidden while a game question is open, for the
     obvious reason. */
  readout: function(){
    var c = this.c, v = D.rgbToHsl(c);
    var hide = this.mode === "game" && this.game && this.game.state === "ask";
    var bytes = D.hexPair(c.r).text + " " + D.hexPair(c.g).text + " " + D.hexPair(c.b).text;
    return [
      { key: "hex",  op: "hex",   big: hide ? "—" : D.hexText(c), note: "what CSS and design tools use" },
      { key: "rgb",  op: "rgb()", big: hide ? "—" : D.rgbText(c), note: "how much of each light, 0–255" },
      { key: "hsl",  op: "hsl()", big: hide ? "—" : D.hslText(c), note: "hue angle, then two percentages" },
      { key: "bits", op: "in memory", big: hide ? "—" : bytes,    note: "three bytes, 24 bits" }
    ];
  },

  /* ---------------------------------------------------------------- draw */

  draw: function(ctx){
    if (this.mode === "game") this.drawGame(ctx);
    else this.drawShow(ctx);
  },

  drawShow: function(ctx){
    var c = this.c, s = this.show;

    D.sectionLabel(ctx, this.topLabel, SW.x, 44, 900, T.dim);

    /* The swatch. A plain filled square with a hairline, because anything else
       -- a gradient, a shadow, a rounded corner catching the ground -- changes
       the color it is there to show. */
    if (s.swatch > 0){
      ctx.save();
      ctx.globalAlpha = s.swatch;
      var grow = D.lerp(0.94, 1, D.easeOut(s.swatch));
      var w = SW.w * grow, h = SW.h * grow;
      D.box(ctx, SW.x + (SW.w - w) / 2, SW.y + (SW.h - h) / 2, w, h, {
        fill: D.toHex(c), r: 4, stroke: D.fade("#FFFFFF", 0.08)
      });
      ctx.restore();
    }

    /* The three notations, appearing as the run explains each one. */
    var lines = [
      { label: "HEX", value: D.hexText(c) },
      { label: "RGB", value: D.rgbText(c) },
      { label: "HSL", value: D.hslText(c) }
    ];
    for (var i = 0; i < 3; i++){
      var a = s.lines[i];
      if (a <= 0) continue;
      ctx.save();
      ctx.globalAlpha = a;
      D.text(ctx, lines[i].label, SW.x, LINE_Y[i], {
        size: 10.5, color: T.dim, align: "left", track: 2.2, weight: 600
      });
      D.text(ctx, lines[i].value, SW.x, LINE_Y[i] + 25, {
        size: 21, color: T.text, align: "left", weight: 600
      });
      ctx.restore();
    }

    /* The rule between the columns. */
    ctx.strokeStyle = T.line;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(DIV_X, 80); ctx.lineTo(DIV_X, 600); ctx.stroke();

    this.drawBars(ctx);
    this.drawHex(ctx);
    this.drawHsl(ctx);
    if (s.chart > 0) this.drawChart(ctx);
  },

  /* ------------------------------------------------------- the rgb block */

  drawBars: function(ctx){
    var s = this.show;
    if (s.rgb <= 0) return;
    var c = this.c;
    var vals = [c.r, c.g, c.b];

    ctx.save();
    ctx.globalAlpha = s.rgb * this.em.rgb;

    D.sectionLabel(ctx, "RGB", RX + 4, 80, 150, T.muted);

    for (var i = 0; i < 3; i++){
      var y = BAR_Y[i], val = vals[i], col = CHAN_COLOR[i];

      D.text(ctx, CHAN_LABEL[i], RX + 8, y + BAR_H / 2, {
        size: 16, color: col, align: "left", weight: 700
      });

      /* Track, then fill. The fill is the channel's own color at the fraction
         the channel is turned up to, which is literally what the number says. */
      D.box(ctx, BAR_X, y, BAR_W, BAR_H, { fill: T.panel, r: 2 });
      var w = BAR_W * (val / 255) * D.easeOut(D.clamp(s.rgb * 1.4 - i * 0.12, 0, 1));
      if (w > 0) D.box(ctx, BAR_X, y, w, BAR_H, { fill: col, r: 2 });

      /* The number the bar is a picture of. The track is always the full
         0..255, so the two say the same thing two ways. */
      D.text(ctx, String(val), VAL_X, y + BAR_H / 2, {
        size: 18, color: T.text, align: "right", weight: 600
      });

      /* The eight bits of the byte. */
      if (s.bits > 0){
        ctx.save();
        ctx.globalAlpha = s.bits;
        for (var bit = 0; bit < 8; bit++){
          var on = (val >> (7 - bit)) & 1;
          var bx = BIT_X + bit * (BIT_W + BIT_GAP);
          D.box(ctx, bx, y + 2, BIT_W, BAR_H - 4, {
            fill: on ? D.fade(col, 0.9) : T.panel, r: 2
          });
          D.text(ctx, on ? "1" : "0", bx + BIT_W / 2, y + BAR_H / 2, {
            size: 12, weight: 600, color: on ? "#14141A" : T.dim
          });
        }
        ctx.restore();
      }
    }

    /* The max/min markers, which are the whole of the RGB-to-HSL story. */
    if (this.mark > 0){
      var maxI = 0, minI = 0;
      for (var j = 1; j < 3; j++){
        if (vals[j] > vals[maxI]) maxI = j;
        if (vals[j] < vals[minI]) minI = j;
      }
      ctx.save();
      ctx.globalAlpha = this.mark;
      [[maxI, "biggest"], [minI, "smallest"]].forEach(function(pair){
        var idx = pair[0], y = BAR_Y[idx];
        var x = BAR_X + BAR_W * (vals[idx] / 255);
        ctx.strokeStyle = T.text;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x, y + BAR_H + 6); ctx.stroke();
        /* Flipped to the inside near the end of the track, where a label set
           to the right of the marker would run into the channel's number. */
        var right = x > BAR_X + BAR_W * 0.62;
        D.text(ctx, pair[1], x + (right ? -6 : 6), y - 12, {
          size: 11, color: T.muted, align: right ? "right" : "left", weight: 600, sans: true
        });
      });
      ctx.restore();
    }

    ctx.restore();
  },

  /* ------------------------------------------------------- the hex block */

  drawHex: function(ctx){
    var s = this.show;
    if (s.hex <= 0) return;
    var c = this.c;
    var vals = [c.r, c.g, c.b];

    ctx.save();
    ctx.globalAlpha = s.hex * this.em.hex;

    D.sectionLabel(ctx, "HEX", RX + 4, 246, 150, T.muted);

    D.text(ctx, "#", RX + 8, HEX_Y + HEX_H / 2, {
      size: 30, color: T.dim, align: "left", weight: 600
    });

    for (var i = 0; i < 3; i++){
      var pair = D.hexPair(vals[i]);
      var px = PAIR_X[i];
      var live = this.hexStep === i;

      for (var d = 0; d < 2; d++){
        var x = px + d * (DIG_W + 4);
        D.box(ctx, x, HEX_Y, DIG_W, HEX_H, {
          fill: live ? T.panel2 : T.panel,
          r: 3,
          stroke: live ? D.fade(CHAN_COLOR[i], 0.7) : T.line
        });
        D.text(ctx, D.HEXDIGITS[d === 0 ? pair.hi : pair.lo], x + DIG_W / 2, HEX_Y + HEX_H / 2, {
          size: 34, weight: 600, color: live ? T.text : T.muted
        });
      }

      /* What each digit is worth, under the pair. Sixteens and ones. */
      D.text(ctx, "16s", px + DIG_W / 2, HEX_Y + HEX_H + 15, { size: 10, color: T.dim });
      D.text(ctx, "1s", px + DIG_W + 4 + DIG_W / 2, HEX_Y + HEX_H + 15, { size: 10, color: T.dim });

      /* The leader from this channel's bar down to its two digits, drawn while
         the arithmetic for that channel is on screen. */
      if (live && this.hexArc > 0){
        D.arcTo(ctx, VAL_X + 6, BAR_Y[i] + BAR_H / 2, px + DIG_W, HEX_Y - 8, 26, {
          t: this.hexArc, color: D.fade(CHAN_COLOR[i], 0.65), width: 2, head: true, dash: [5, 5]
        });
      }
    }

    /* The arithmetic itself, for whichever channel is live. */
    if (this.hexStep >= 0){
      var i2 = this.hexStep, v2 = vals[i2], p2 = D.hexPair(v2);
      ctx.save();
      ctx.globalAlpha = D.clamp(this.hexArc * 1.2, 0, 1);
      D.text(ctx, String(v2), HEX_NOTE_X, HEX_Y + 8, {
        size: 22, color: CHAN_COLOR[i2], align: "left", weight: 600
      });
      D.text(ctx, "= " + p2.hi + "×16 + " + p2.lo, HEX_NOTE_X, HEX_Y + 34, {
        size: 16, color: T.muted, align: "left"
      });
      D.text(ctx, "= " + p2.text, HEX_NOTE_X, HEX_Y + 58, {
        size: 16, color: T.text, align: "left", weight: 600
      });
      ctx.restore();
    }

    ctx.restore();
  },

  /* ------------------------------------------------------- the hsl block */

  drawHsl: function(ctx){
    var s = this.show;
    if (s.hsl <= 0) return;
    var c = this.c, v = D.rgbToHsl(c);

    ctx.save();
    ctx.globalAlpha = s.hsl * this.em.hsl;

    D.sectionLabel(ctx, "HSL", RX + 4, 372, 150, T.muted);

    /* Saturation and lightness. Each track is painted with what that number
       would do if you slid it, which makes the two bars readable without their
       labels: the S track runs gray to vivid, the L track black to white. */
    this.slBar(ctx, "SATURATION", S_Y, v.s, function(t){
      return D.hslHex(v.h, t, D.clamp(v.l, 0.25, 0.75));
    });
    this.slBar(ctx, "LIGHTNESS", L_Y, v.l, function(t){
      return D.hslHex(v.h, v.s, t);
    });

    /* The hue ring, painted in the hues themselves at this color's own
       saturation and lightness -- so the ring is a picture of the choice being
       made rather than a decoration: the marker sits on the wall's color. */
    {
      /* The band arrives with the rest of the block, because a hole in the
         middle of the panel for two beats reads as something failing to load.
         The marker and the angle are what wait for the hue beat. */
      ctx.save();
      ctx.globalAlpha = D.lerp(0.4, 1, s.ring);
      var segs = 120;
      for (var i = 0; i < segs; i++){
        var a0 = (i / segs) * Math.PI * 2 - Math.PI / 2;
        var a1 = ((i + 1.02) / segs) * Math.PI * 2 - Math.PI / 2;
        ctx.strokeStyle = D.hslHex((i / segs) * 360, Math.max(v.s, 0.25), D.clamp(v.l, 0.3, 0.7));
        ctx.lineWidth = RING_T;
        ctx.beginPath();
        ctx.arc(RING_X, RING_Y, RING_R, a0, a1);
        ctx.stroke();
      }

      /* The marker, and the angle it is standing at. */
      if (s.ring > 0){
        ctx.globalAlpha = s.ring;
        var ang = (v.h / 360) * Math.PI * 2 - Math.PI / 2;
        var mx = RING_X + Math.cos(ang) * RING_R, my = RING_Y + Math.sin(ang) * RING_R;
        ctx.strokeStyle = D.fade("#FFFFFF", 0.35);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(RING_X + Math.cos(ang) * (RING_R - RING_T), RING_Y + Math.sin(ang) * (RING_R - RING_T));
        ctx.lineTo(RING_X + Math.cos(ang) * (RING_R + RING_T * 0.9), RING_Y + Math.sin(ang) * (RING_R + RING_T * 0.9));
        ctx.stroke();
        D.box(ctx, mx - 9, my - 9, 18, 18, { fill: D.toHex(c), stroke: "#FFFFFF", lineWidth: 2, r: 9 });

        D.text(ctx, Math.round(v.h) + "°", RING_X, RING_Y - 4, {
          size: 30, color: T.text, weight: 600
        });
        D.text(ctx, "hue", RING_X, RING_Y + 22, { size: 11, color: T.dim, track: 2 });
      }
      ctx.restore();
    }

    ctx.restore();
  },

  slBar: function(ctx, label, y, value, colorAt){
    D.text(ctx, label, SL_X, y - 16, {
      size: 10.5, color: T.dim, align: "left", track: 2.2, weight: 600
    });
    D.text(ctx, Math.round(value * 100) + "%", SL_X + SL_W, y - 16, {
      size: 14, color: T.text, align: "right", weight: 600
    });

    /* Painted in steps rather than with a canvas gradient, because the S and L
       ramps are not linear in RGB and a two-stop gradient would be a lie about
       what is in between. */
    var steps = 60;
    for (var i = 0; i < steps; i++){
      ctx.fillStyle = colorAt(i / (steps - 1));
      ctx.fillRect(SL_X + (SL_W / steps) * i, y, SL_W / steps + 0.6, SL_H);
    }
    ctx.strokeStyle = D.fade("#FFFFFF", 0.1);
    ctx.lineWidth = 1;
    ctx.strokeRect(SL_X + 0.5, y + 0.5, SL_W - 1, SL_H - 1);

    var x = SL_X + SL_W * D.clamp(value, 0, 1);
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y - 5); ctx.lineTo(x, y + SL_H + 5); ctx.stroke();
  },

  /* ------------------------------------------------- the channel/hue chart */

  /*
   * The three channels plotted against hue, at this color's own saturation and
   * lightness, with a playhead where the wall currently is. It is the proof of
   * the sentence the beat is saying: three identical curves, each a third of a
   * turn behind the last, and the color is wherever they happen to cross.
   */
  drawChart: function(ctx){
    var v = D.rgbToHsl(this.c);
    ctx.save();
    ctx.globalAlpha = this.show.chart;

    D.text(ctx, "R, G AND B OVER A FULL TURN OF THE HUE", CH_X + 4, CH_Y - 12, {
      size: 10.5, color: T.dim, align: "left", track: 2.2, weight: 600
    });
    D.text(ctx, "0° → 360°", CH_X + CH_W, CH_Y - 12, {
      size: 10.5, color: T.dim, align: "right", track: 2.2, weight: 600
    });

    /* Both ends of the byte, marked. Without them the curves look flat for no
       reason -- at this lightness the channels genuinely never reach 0 or 255,
       and that is the thing to notice, not a drawing that ran out of room. */
    ctx.strokeStyle = T.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(CH_X, CH_Y + CH_H); ctx.lineTo(CH_X + CH_W, CH_Y + CH_H);
    ctx.moveTo(CH_X, CH_Y); ctx.lineTo(CH_X + CH_W, CH_Y);
    ctx.stroke();
    D.text(ctx, "255", CH_X - 8, CH_Y, { size: 10, color: T.dim, align: "right" });
    D.text(ctx, "0", CH_X - 8, CH_Y + CH_H, { size: 10, color: T.dim, align: "right" });

    var steps = 90;
    for (var ch = 0; ch < 3; ch++){
      ctx.strokeStyle = CHAN_COLOR[ch];
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (var i = 0; i <= steps; i++){
        var hue = (i / steps) * 360;
        var col = D.hslToRgb(hue, v.s, v.l);
        var val = col[CHAN[ch]] / 255;
        var x = CH_X + (i / steps) * CH_W;
        var y = CH_Y + CH_H - val * CH_H;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    /* The playhead, and a dot on each curve where it crosses. */
    var px = CH_X + (((v.h % 360) + 360) % 360) / 360 * CH_W;
    ctx.strokeStyle = D.fade("#FFFFFF", 0.4);
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(px, CH_Y - 4); ctx.lineTo(px, CH_Y + CH_H + 4); ctx.stroke();
    for (var k = 0; k < 3; k++){
      var yv = CH_Y + CH_H - (this.c[CHAN[k]] / 255) * CH_H;
      ctx.fillStyle = CHAN_COLOR[k];
      ctx.beginPath(); ctx.arc(px, yv, 4, 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore();
  },

  /* ----------------------------------------------------------- game draw */

  drawGame: function(ctx){
    var g = this.game;
    if (!g) return;
    var revealed = g.state === "reveal";

    D.sectionLabel(ctx, this.topLabel, GSW.x, 44, 900, T.dim);

    D.box(ctx, GSW.x, GSW.y, GSW.w, GSW.h, {
      fill: D.toHex(this.c), r: 4, stroke: D.fade("#FFFFFF", 0.08)
    });

    /* Under the swatch: which round, which notation, and the score. */
    D.text(ctx, "ROUND " + g.round + " · WRITTEN IN " + NOTATION_NAME[g.notation].toUpperCase(),
      GSW.x, GSW.y + GSW.h + 30, {
        size: 11, color: T.dim, align: "left", track: 2.2, weight: 600
      });
    if (g.asked > 0){
      D.text(ctx, g.right + " of " + g.asked + " right", GSW.x, GSW.y + GSW.h + 62, {
        size: 22, color: T.muted, align: "left", weight: 600, sans: true
      });
    } else {
      D.text(ctx, "Pick one on your phone", GSW.x, GSW.y + GSW.h + 62, {
        size: 22, color: T.muted, align: "left", weight: 600, sans: true
      });
    }

    /* The four cards. Before an answer they are four strings and nothing else,
       which is the question. After one, each carries the color it actually is
       -- that is the part that teaches, and it is why the wrong options are
       real colors rather than mangled strings. */
    for (var i = 0; i < g.options.length; i++){
      var y = optY(i);
      var isRight = i === g.correct, isPicked = i === g.picked;
      var edge = T.line, fill = T.panel, ink = T.text;

      if (revealed){
        if (isRight)        { edge = T.good; fill = D.fade(T.good, 0.10); }
        else if (isPicked)  { edge = T.bad;  fill = D.fade(T.bad, 0.10); ink = T.muted; }
        else                { ink = T.dim; }
      }

      D.box(ctx, OPT_X, y, OPT_W, OPT_H, { fill: fill, r: 4, stroke: edge, lineWidth: isRight && revealed ? 2 : 1 });

      /* The letter is what a visitor matches against the button on their
         phone, so it is the largest thing on the card after the code. */
      D.text(ctx, "ABCD"[i], OPT_X + 34, y + OPT_H / 2, {
        size: 26, color: revealed && !isRight && !isPicked ? T.dim : T.muted, weight: 700
      });
      D.text(ctx, this.codeFor(g.options[i], g.notation), OPT_X + 66, y + OPT_H / 2, {
        size: 26, color: ink, align: "left", weight: 600
      });

      if (revealed){
        var sw = OPT_H - 20;
        D.box(ctx, OPT_X + OPT_W - sw - 14, y + 10, sw, sw, {
          fill: D.toHex(g.options[i]), r: 3, stroke: D.fade("#FFFFFF", 0.12)
        });
        if (isRight || isPicked){
          D.text(ctx, isRight ? "✓" : "✕", OPT_X + OPT_W - sw - 36, y + OPT_H / 2, {
            size: 24, color: isRight ? T.good : T.bad, weight: 700
          });
        }
      }
    }

    /* The verdict, under the cards. */
    if (revealed){
      var right = g.picked === g.correct;
      D.text(ctx, right ? "Right" : "Not this one", OPT_X, 486, {
        size: 34, color: right ? T.good : T.bad, align: "left", weight: 700, sans: true
      });
      var line = right
        ? "Every code on the board is a real color — there they are."
        : "You picked " + "ABCD"[g.picked] + ", which is the color beside it.";
      D.text(ctx, line, OPT_X, 522, {
        size: 16, color: T.muted, align: "left", weight: 500, sans: true
      });

      /* A countdown rule to the next round, so the pause reads as a pause. */
      var t = D.clamp(g.t / REVEAL_HOLD, 0, 1);
      ctx.fillStyle = T.line;
      ctx.fillRect(OPT_X, 552, OPT_W, 2);
      ctx.fillStyle = this.accent;
      ctx.fillRect(OPT_X, 552, OPT_W * (1 - t), 2);
      D.text(ctx, "NEXT COLOR", OPT_X, 570, {
        size: 10, color: T.dim, align: "left", track: 2.2, weight: 600
      });
    } else {
      D.text(ctx, "A, B, C or D — on the phone.", OPT_X, 486, {
        size: 20, color: T.dim, align: "left", weight: 500, sans: true
      });
    }

    this.drawKey(ctx, g.notation, GSW.x, 540);
  },

  /*
   * How to read the notation this round is written in, under the swatch.
   *
   * It is here because of who is standing in front of it: somebody who walked
   * up thirty seconds ago, is being asked a question, and has no reason to know
   * which two digits of six are the blue ones. Without this the game is a test
   * of what you already knew; with it, it is answerable from the wall.
   */
  drawKey: function(ctx, notation, x, y){
    var segs = notation === "hex"
      ? [{ t: "#", c: T.dim },
         { t: "RR", c: CHAN_COLOR[0], l: "red" },
         { t: "GG", c: CHAN_COLOR[1], l: "green" },
         { t: "BB", c: CHAN_COLOR[2], l: "blue" }]
      : notation === "rgb"
      ? [{ t: "rgb(", c: T.dim },
         { t: "R", c: CHAN_COLOR[0], l: "0–255" },
         { t: ", ", c: T.dim },
         { t: "G", c: CHAN_COLOR[1], l: "0–255" },
         { t: ", ", c: T.dim },
         { t: "B", c: CHAN_COLOR[2], l: "0–255" },
         { t: ")", c: T.dim }]
      : [{ t: "hsl(", c: T.dim },
         { t: "H", c: T.text, l: "0–360°" },
         { t: ", ", c: T.dim },
         { t: "S", c: T.text, l: "0–100%" },
         { t: ", ", c: T.dim },
         { t: "L", c: T.text, l: "0–100%" },
         { t: ")", c: T.dim }];

    D.text(ctx, "HOW TO READ IT", x, y, {
      size: 10.5, color: T.dim, align: "left", track: 2.2, weight: 600
    });

    /* Laid out by measuring, so the labels underneath sit under the part of
       the template they name whatever the font actually did. */
    var cx = x;
    /* Hex is the one that needs air: RRGGBB is six narrow glyphs and the three
       labels under them would otherwise touch. The other two notations already
       have commas doing that job. */
    var gap = notation === "hex" ? 10 : 0;
    ctx.font = "600 27px " + D.MONO;
    for (var i = 0; i < segs.length; i++){
      var w = ctx.measureText(segs[i].t).width;
      D.text(ctx, segs[i].t, cx, y + 32, {
        size: 27, color: segs[i].c, align: "left", weight: 600
      });
      if (segs[i].l){
        D.text(ctx, segs[i].l, cx + w / 2, y + 58, { size: 10.5, color: T.dim });
      }
      cx += w + (segs[i].l ? gap : 0);
      ctx.font = "600 27px " + D.MONO;
    }
  }
};

(global.Scenes = global.Scenes || []).push(scene);

})(window);
