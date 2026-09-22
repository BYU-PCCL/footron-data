/*
 * Shared drawing and timing for the four scenes.
 *
 * Every scene paints into the same fixed 1000x640 world and is fitted to its
 * box by index.html, so nothing below ever asks how big the wall is. A length
 * here is a length in that world and stays put.
 *
 * The other half of this file is Beats, which is what makes a scene readable.
 * A scene is a *script* -- a list of timed beats, each carrying the line of
 * narration it puts in the rail -- rather than a state machine with a clock
 * threaded through it. Beats owns the clock; a scene only says what happens.
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
   the cell, the slot, the node and the card: close to everything on screen is
   one of these. */
function box(ctx, x, y, w, h, o){
  o = o || {};
  var r = o.r === undefined ? 6 : o.r;
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
 * The ground the scenes are painted on. These are the canvas-side twins of the
 * custom properties in index.html's :root block and have to be changed with
 * them -- the canvas sits inside a panel painted by CSS, so a `ink` here that
 * has drifted from `--viz` there shows up as a visible rectangle.
 *
 * Each scene brings its own accent on top of this. Everything structural is
 * from here, so the four scenes read as four views of one exhibit rather than
 * four separate pages.
 */
var T = {
  ink:    "#0B0F1C",   /* the canvas ground                         */
  panel:  "#141A2C",   /* an empty cell, slot or node               */
  panel2: "#1B2238",   /* an empty cell that is being looked at     */
  line:   "#28324E",   /* every border and rule                     */
  grid:   "#1C2338",   /* the faintest structural line              */
  text:   "#E9EDFB",   /* a value, a key, anything being read       */
  muted:  "#8E9BC2",   /* a label                                   */
  dim:    "#5B678C",   /* an index, a tick, a disabled thing        */
  good:   "#6FE3A8",   /* yes / found / in the set                  */
  bad:    "#FF6B7E",   /* no / missing / evicted                    */
  warn:   "#FFC861"    /* the interesting case: a false positive    */
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

/* A straight line with an arrowhead, drawn from 0 to `t` of its length. Every
   pointer in the skip list and in the forest is one of these. */
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
   them and drawn from 0 to `t` of its length. The hash arcs, the eviction hops
   and the compressed parent pointers are all this.
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

/* A ring that expands and fades, drawn wherever something lands: a bit being
   set, a key sitting down, a root being reached. */
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

/* --------------------------------------------------------------- hashing */

/*
 * Three real string hashes, used by both the Bloom filter and the cuckoo
 * tables. They have to be genuinely different functions rather than one
 * function with three seeds bolted on, because the whole point of both scenes
 * is that the positions are unrelated: a Bloom filter whose three bits moved
 * together would never show a false positive for the right reason, and cuckoo
 * hashing with two correlated hashes would cycle constantly.
 *
 * FNV-1a, djb2 and sdbm, unchanged.
 */
function fnv1a(str){
  var h = 0x811c9dc5;
  for (var i = 0; i < str.length; i++){
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
function djb2(str){
  var h = 5381;
  for (var i = 0; i < str.length; i++) h = (Math.imul(h, 33) + str.charCodeAt(i)) | 0;
  return h >>> 0;
}
function sdbm(str){
  var h = 0;
  for (var i = 0; i < str.length; i++){
    h = (str.charCodeAt(i) + (h << 6) + (h << 16) - h) | 0;
  }
  return h >>> 0;
}

/* The salt lets the cuckoo scene throw its hash functions away and pick new
   ones when it has to rehash, which is exactly what a real implementation does
   after too many evictions. */
var HASHES = [
  function(s, salt){ return fnv1a((salt || "") + s); },
  function(s, salt){ return djb2(s + (salt || "")); },
  function(s, salt){ return sdbm((salt || "") + s + (salt || "")); }
];

global.D = {
  clamp: clamp, lerp: lerp, sub: sub,
  easeOut: easeOut, easeInOut: easeInOut, easeBack: easeBack,
  rng: rng, fade: fade, mix: mix,
  roundRect: roundRect, box: box, text: text, arrow: arrow, arcTo: arcTo,
  sectionLabel: sectionLabel, ping: ping,
  Beats: Beats, HASHES: HASHES, MONO: MONO, SANS: SANS, T: T
};

})(window);
