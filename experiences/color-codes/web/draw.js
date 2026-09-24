/*
 * Drawing, timing and colour maths for the scene.
 *
 * The scene paints into a fixed 1000x640 world and is fitted to its box by
 * index.html, so nothing below ever asks how big the wall is. A length here is
 * a length in that world and stays put.
 *
 * The middle of this file is Beats, which is what makes the attract run
 * readable. The run is a *script* -- a list of timed beats, each carrying the
 * line of narration it puts in the rail -- rather than a state machine with a
 * clock threaded through it. Beats owns the clock; the scene only says what
 * happens.
 *
 * The last section is the colour maths, and it is the exhibit's one claim to
 * honesty: every number on the wall comes out of these functions at runtime.
 * Nothing is a table of pre-picked colours with their codes typed in beside
 * them.
 *
 * This file started as `draw.js` from the data-structures exhibits
 * (`bloom-filter`, `skip-list`) and is the same file with the string hashes
 * swapped for the colour conversions and the palette flattened to neutrals --
 * so a fix to `box`, `text` or `Beats` is worth carrying across all of them.
 */
(function (global) {
"use strict";

/* ------------------------------------------------------------------ maths */

function clamp(v, a, b){ return v < a ? a : (v > b ? b : v); }
function lerp(a, b, t){ return a + (b - a) * t; }

/* The three easings everything here is animated with. easeOut for anything
   arriving, since it should decelerate into place; easeInOut for anything
   moving between two places it is equally happy in; easeBack for anything that
   should land with weight -- a bit flipping, a key sitting down in a slot. */
function easeOut(t){ return 1 - Math.pow(1 - t, 3); }
function easeInOut(t){ return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2; }
function easeBack(t){
  var c = 1.70158, c3 = c + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
}

/* Progress through a window inside a beat: sub(u, 0.2, 0.6) is 0 before the
   beat is a fifth through and 1 after it is three fifths through. The scenes
   are written almost entirely in terms of this, so one beat can stage several
   things without carrying timers of its own. */
function sub(u, a, b){ return clamp((u - a) / (b - a), 0, 1); }

/* A seeded generator, so a layout re-rolled by "new data" from the phone is a
   fresh arrangement but never an unplayable one: a scene can re-roll until it
   gets an arrangement it likes without that depending on Math.random. */
function rng(seed){
  var s = seed >>> 0;
  return function(){
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    var t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ----------------------------------------------------------------- colour */

/* #rrggbb to rgba(). Every colour in the scenes is a hex constant and almost
   every use of one is at some opacity, so this is the most-called function in
   the file -- a bit grid alone asks for a few dozen a frame. Hence the cache. */
var alphaCache = {};
function fade(hex, a){
  var key = hex + "|" + a;
  var hit = alphaCache[key];
  if (hit) return hit;
  var n = parseInt(hex.slice(1), 16);
  var out = "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  alphaCache[key] = out;
  return out;
}

/* Blend two hex colours, for anything that changes colour over time: a bit
   warming up as it is set, a node cooling back down after a visit. */
function mix(hexA, hexB, t){
  var a = parseInt(hexA.slice(1), 16), b = parseInt(hexB.slice(1), 16);
  var r = Math.round(lerp((a >> 16) & 255, (b >> 16) & 255, t));
  var g = Math.round(lerp((a >> 8) & 255, (b >> 8) & 255, t));
  var bl = Math.round(lerp(a & 255, b & 255, t));
  return "rgb(" + r + "," + g + "," + bl + ")";
}

/* ------------------------------------------------------------------ paint */

function roundRect(ctx, x, y, w, h, r){
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* A filled box with an optional border and an optional glow behind it. This is
   the swatch, the bar, the digit and the option card: close to everything on
   screen is one of these. */
function box(ctx, x, y, w, h, o){
  o = o || {};
  var r = o.r === undefined ? 0 : o.r;
  if (o.glow){
    ctx.save();
    ctx.shadowColor = o.glow;
    ctx.shadowBlur = o.glowSize || 18;
    ctx.fillStyle = o.fill || "#000";
    roundRect(ctx, x, y, w, h, r); ctx.fill();
    ctx.restore();
  }
  if (o.fill){ ctx.fillStyle = o.fill; roundRect(ctx, x, y, w, h, r); ctx.fill(); }
  if (o.stroke){
    ctx.strokeStyle = o.stroke;
    ctx.lineWidth = o.lineWidth || 1.5;
    roundRect(ctx, x, y, w, h, r); ctx.stroke();
  }
}

var MONO = '"IBM Plex Mono", ui-monospace, "Cascadia Mono", Consolas, monospace';
var SANS = '"Inter", "Segoe UI", system-ui, sans-serif';

/*
 * The ground the scene is painted on. These are the canvas-side twins of the
 * custom properties in index.html's :root block and have to be changed with
 * them -- the canvas sits inside a panel painted by CSS, so an `ink` here that
 * has drifted from `--viz` there shows up as a visible rectangle.
 *
 * Every one of these is a neutral, and that is the whole palette decision. On
 * an exhibit whose subject is colour, the only saturated thing on the wall has
 * to be the colour being talked about: a tinted ground would sit next to the
 * swatch and quietly change what it looks like. `good` and `bad` are the two
 * exceptions, and they are only ever on screen for a second at a time while
 * the game marks an answer.
 */
var T = {
  ink:    "#17171B",   /* the canvas ground                         */
  panel:  "#232329",   /* a card, a bar's empty track               */
  panel2: "#2C2C34",   /* a card that is being looked at            */
  line:   "#3E3E48",   /* every border and rule                     */
  grid:   "#1F1F25",   /* the faintest structural line              */
  text:   "#F3F3F6",   /* a value, a code, anything being read      */
  muted:  "#B7B7C2",   /* a label                                   */
  dim:    "#82828F",   /* an index, a tick, a disabled thing        */
  good:   "#5FD99A",   /* a right answer                            */
  bad:    "#FF6B7E",   /* a wrong answer                            */
  warn:   "#FFC861"    /* the answer you should have picked         */
};

/* One text call for the whole file. Size and colour are always given; the rest
   defaults to the common case, which is centred mono -- a cell label. */
function text(ctx, str, x, y, o){
  o = o || {};
  var weight = o.weight || 500;
  var family = o.sans ? SANS : MONO;
  ctx.font = weight + " " + (o.size || 14) + "px " + family;
  ctx.fillStyle = o.color || "#fff";
  ctx.textAlign = o.align || "center";
  ctx.textBaseline = o.baseline || "middle";
  if (o.track){
    /* Canvas has no letter-spacing everywhere this page has to run, so a
       tracked-out label is drawn a glyph at a time. Only the short uppercase
       headings use it, and there the tracking is the whole look. */
    var total = 0, i;
    for (i = 0; i < str.length; i++) total += ctx.measureText(str[i]).width + o.track;
    total -= o.track;
    var cx = o.align === "left" ? x : (o.align === "right" ? x - total : x - total / 2);
    ctx.textAlign = "left";
    for (i = 0; i < str.length; i++){
      ctx.fillText(str[i], cx, y);
      cx += ctx.measureText(str[i]).width + o.track;
    }
    return;
  }
  ctx.fillText(str, x, y);
}

/* A straight line with an arrowhead, drawn from 0 to `t` of its length. */
function arrow(ctx, x0, y0, x1, y1, o){
  o = o || {};
  var t = o.t === undefined ? 1 : o.t;
  if (t <= 0) return;
  var x = lerp(x0, x1, t), y = lerp(y0, y1, t);
  ctx.strokeStyle = o.color || "#fff";
  ctx.lineWidth = o.width || 2;
  ctx.lineCap = "round";
  if (o.dash){ ctx.setLineDash(o.dash); ctx.lineDashOffset = o.dashOffset || 0; }
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x, y); ctx.stroke();
  ctx.setLineDash([]);
  if (o.head === false) return;
  var ang = Math.atan2(y - y0, x - x0), hs = o.headSize || 8;
  ctx.fillStyle = o.color || "#fff";
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - hs * Math.cos(ang - 0.42), y - hs * Math.sin(ang - 0.42));
  ctx.lineTo(x - hs * Math.cos(ang + 0.42), y - hs * Math.sin(ang + 0.42));
  ctx.closePath(); ctx.fill();
}

/* A quadratic arc between two points, bowed perpendicular to the line between
   them and drawn from 0 to `t` of its length. The leaders that tie a channel
   bar to the hex digits it becomes are these.
   It is sampled by hand rather than handed to quadraticCurveTo because it has
   to be drawable partway: an arc that appears all at once reads as a line
   rather than as something travelling. */
function arcTo(ctx, x0, y0, x1, y1, bow, o){
  o = o || {};
  var t = o.t === undefined ? 1 : o.t;
  if (t <= 0) return null;
  var mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  var dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
  var cx = mx - (dy / len) * bow, cy = my + (dx / len) * bow;
  var steps = Math.max(8, Math.round(28 * t));
  var px = x0, py = y0, hx = x0, hy = y0;
  ctx.strokeStyle = o.color || "#fff";
  ctx.lineWidth = o.width || 2;
  ctx.lineCap = "round";
  if (o.dash){ ctx.setLineDash(o.dash); ctx.lineDashOffset = o.dashOffset || 0; }
  ctx.beginPath(); ctx.moveTo(x0, y0);
  for (var i = 1; i <= steps; i++){
    var u = (i / steps) * t, iu = 1 - u;
    var X = iu*iu*x0 + 2*iu*u*cx + u*u*x1;
    var Y = iu*iu*y0 + 2*iu*u*cy + u*u*y1;
    ctx.lineTo(X, Y);
    hx = px; hy = py; px = X; py = Y;
  }
  ctx.stroke();
  ctx.setLineDash([]);
  if (o.head){
    var ang = Math.atan2(py - hy, px - hx), hs = o.headSize || 8;
    ctx.fillStyle = o.color || "#fff";
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px - hs * Math.cos(ang - 0.42), py - hs * Math.sin(ang - 0.42));
    ctx.lineTo(px - hs * Math.cos(ang + 0.42), py - hs * Math.sin(ang + 0.42));
    ctx.closePath(); ctx.fill();
  }
  /* The head position comes back so a caller can ride something along the arc:
     the travelling key in the cuckoo scene is drawn at this point. */
  return { x: px, y: py };
}

/* The heading over a region of the world: a tracked-out label with a rule
   running off to the right of it, matching the card headings in the rail. */
function sectionLabel(ctx, str, x, y, w, color){
  text(ctx, str, x, y, { size: 11, color: color, align: "left", track: 2.2, weight: 600 });
  ctx.font = "600 11px " + MONO;
  var used = ctx.measureText(str).width + str.length * 2.2 + 12;
  if (x + used >= x + w) return;
  ctx.strokeStyle = fade(color, 0.22);
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x + used, y); ctx.lineTo(x + w, y); ctx.stroke();
}

/* A ring that expands and fades, drawn wherever something lands. */
function ping(ctx, x, y, r0, r1, t, color, width){
  if (t <= 0 || t >= 1) return;
  ctx.strokeStyle = fade(color, (1 - t) * 0.75);
  ctx.lineWidth = width || 2;
  ctx.beginPath();
  ctx.arc(x, y, lerp(r0, r1, easeOut(t)), 0, Math.PI * 2);
  ctx.stroke();
}

/* ------------------------------------------------------------------ beats */

/*
 * A scene pushes beats at reset() and then only draws. Each beat is
 *
 *   { dur, cap, hot, enter, tick, exit }
 *
 * `cap` is the line of narration that goes in the rail while it runs and `hot`
 * names the row of the cost table to light, so the words on the wall cannot
 * drift out of step with the picture: they are set by the same object that
 * schedules the picture.
 *
 * `tick` gets the beat's progress from 0 to 1, and is always called with
 * exactly 1 as the beat ends -- so a beat that moves something into place
 * finishes with it in place however coarse the frames were.
 */
function Beats(){
  this.list = [];
  this.i = 0;
  this.t = 0;
  this.started = false;
  this.done = false;
  this.cap = "";
  this.hot = null;
}

Beats.prototype.add = function(dur, cap, tick, o){
  o = o || {};
  this.list.push({ dur: dur, cap: cap, tick: tick, enter: o.enter, exit: o.exit, hot: o.hot });
  return this;
};

Beats.prototype.rewind = function(){
  this.i = 0; this.t = 0; this.started = false; this.done = false;
  this.cap = ""; this.hot = null;
};

Beats.prototype.step = function(dt){
  /* A beat shorter than a frame must not swallow the frame, so the remainder
     is carried into the next one. The guard is only there because a scene
     could in principle be written with a long run of zero-length beats. */
  var guard = 0;
  while (this.i < this.list.length && guard++ < 400){
    var b = this.list[this.i];
    if (!this.started){
      this.started = true; this.t = 0;
      if (b.cap !== undefined && b.cap !== null) this.cap = b.cap;
      this.hot = b.hot === undefined ? null : b.hot;
      if (b.enter) b.enter();
    }
    var room = b.dur - this.t;
    if (dt < room){
      this.t += dt;
      if (b.tick) b.tick(b.dur > 0 ? this.t / b.dur : 1);
      return;
    }
    dt -= room;
    if (b.tick) b.tick(1);
    if (b.exit) b.exit();
    this.i++; this.started = false; this.t = 0;
    if (dt <= 0) return;
  }
  if (this.i >= this.list.length) this.done = true;
};

/* How far through the whole script we are, for the progress bar under the
   scene. Beats are unequal, so this is measured in seconds and not in beats. */
Beats.prototype.progress = function(){
  var total = 0, before = 0, i;
  for (i = 0; i < this.list.length; i++){
    if (i < this.i) before += this.list[i].dur;
    total += this.list[i].dur;
  }
  return total > 0 ? clamp((before + this.t) / total, 0, 1) : 0;
};

/* ---------------------------------------------------------------- colour */

/*
 * The conversions the exhibit is about. Everything the wall says about a colour
 * comes through here at runtime -- the hex digits, the hue angle, the options
 * in the game and the swatches drawn beside them are all computed from one
 * {r,g,b} triple of bytes. There is no table of colours with their codes typed
 * in beside them anywhere in this experience, which is the only way the wall
 * can be trusted when it claims two notations are the same colour.
 *
 * These are the textbook formulas, unchanged. sRGB is treated as a plain cube
 * of bytes, the way CSS treats it: `hsl()` in a browser is exactly this, not a
 * perceptual space. That is worth knowing but not worth saying on the wall.
 */

var HEXDIGITS = "0123456789ABCDEF";

/* One byte as two hex digits. Returned split, because the whole hex beat is
   about the fact that the two digits are the sixteens and the ones. */
function hexPair(byte){
  var v = Math.round(clamp(byte, 0, 255));
  return { hi: (v >> 4) & 15, lo: v & 15, text: HEXDIGITS[(v >> 4) & 15] + HEXDIGITS[v & 15] };
}

function toHex(c){
  return "#" + hexPair(c.r).text + hexPair(c.g).text + hexPair(c.b).text;
}

/* "#2E86C1" or "2E86C1" back to bytes. Only used by the authoring query
   parameters, so it is allowed to be strict about what it accepts. */
function fromHex(str){
  var s = String(str).replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
  var n = parseInt(s, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/*
 * RGB to HSL. The relationship the exhibit spends half its run on is all in
 * the first three lines: every one of H, S and L is read off the *largest* and
 * *smallest* of the three channels.
 *
 *   L is where they sit      -- the midpoint of the two, so a light colour is
 *                               one whose channels are all high.
 *   S is how far apart       -- the gap between them, divided by the widest
 *                               gap that is possible at that lightness.
 *   H is which one is on top -- the sector is chosen by which channel is the
 *                               maximum, and the position inside that sector
 *                               by where the middle channel falls.
 *
 * So hue is genuinely a fact about the ordering of the three numbers, which is
 * what the sweep beat on the wall is showing when the bars chase each other.
 */
function rgbToHsl(c){
  var r = c.r / 255, g = c.g / 255, b = c.b / 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var d = max - min;
  var l = (max + min) / 2;
  var h = 0, s = 0;
  if (d > 0){
    /* 1 - |2L - 1| is the widest the gap could be at this lightness: a colour
       near black or near white has no room to be far apart, which is why a
       nearly-black pixel can still be reported as fully saturated. */
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r)      h = ((g - b) / d + (g < b ? 6 : 0));
    else if (max === g) h = ((b - r) / d + 2);
    else                h = ((r - g) / d + 4);
    h *= 60;
  }
  return { h: h, s: s, l: l, max: max, min: min, d: d };
}

/* HSL back to bytes, by the same sectors run backwards. */
function hslToRgb(h, s, l){
  h = ((h % 360) + 360) % 360;
  s = clamp(s, 0, 1); l = clamp(l, 0, 1);
  var c = (1 - Math.abs(2 * l - 1)) * s;
  var x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  var m = l - c / 2;
  var r = 0, g = 0, b = 0;
  if (h < 60)       { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else              { r = c; b = x; }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

function hslHex(h, s, l){ return toHex(hslToRgb(h, s, l)); }

/* The three notations, written the way CSS writes them, because that is where
   a visitor will next meet them. Rounded for display only -- every calculation
   above runs on the unrounded values. */
function rgbText(c){ return "rgb(" + c.r + ", " + c.g + ", " + c.b + ")"; }
function hexText(c){ return toHex(c); }
function hslText(c){
  var v = rgbToHsl(c);
  return "hsl(" + Math.round(v.h) + ", " + Math.round(v.s * 100) + "%, " +
         Math.round(v.l * 100) + "%)";
}

/*
 * A version of a colour that can be read as text on the dark ground. The
 * exhibit accents its own chrome with whatever colour it is currently showing,
 * which is the right idea and an unreadable one for anything dark or grey: so
 * the hue is kept, and the saturation and lightness are floored.
 */
function legible(c){
  var v = rgbToHsl(c);
  return hslHex(v.h, Math.max(v.s, 0.45), clamp(Math.max(v.l, 0.62), 0, 0.78));
}

/* Black or white, whichever can be read on top of the given colour. The 0.55
   threshold is on L rather than on a luminance, which is close enough on a
   swatch this size and keeps it in step with the number the wall is showing
   for lightness a few centimetres away. */
function onColor(c){
  return rgbToHsl(c).l > 0.55 ? "#101014" : "#F8F8FA";
}

/* How far apart two colours are, as a plain distance in the byte cube. Used
   only by the game, to keep the four options from including two that a visitor
   could not tell apart on the wall. */
function dist(a, b){
  var dr = a.r - b.r, dg = a.g - b.g, db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

global.D = {
  clamp: clamp, lerp: lerp, sub: sub,
  easeOut: easeOut, easeInOut: easeInOut, easeBack: easeBack,
  rng: rng, fade: fade, mix: mix,
  roundRect: roundRect, box: box, text: text, arrow: arrow, arcTo: arcTo,
  sectionLabel: sectionLabel, ping: ping,
  Beats: Beats, MONO: MONO, SANS: SANS, T: T,
  HEXDIGITS: HEXDIGITS,
  toHex: toHex, hexPair: hexPair, fromHex: fromHex,
  rgbToHsl: rgbToHsl, hslToRgb: hslToRgb, hslHex: hslHex,
  rgbText: rgbText, hslText: hslText, hexText: hexText,
  legible: legible, onColor: onColor, dist: dist
};

})(window);
