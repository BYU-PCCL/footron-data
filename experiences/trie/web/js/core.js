/* Shared toolkit for every scene: palette, colour maths, easing, a tiny
 * step-runner for animated algorithms, canvas drawing helpers and the scene
 * registry. Plain script, no build step — everything hangs off window.DS.
 *
 * A scene is an object registered with DS.register({...}):
 *
 *   id, title, idea         identity; `idea` is the one sentence it exists to land
 *   notes[]                 narration beats, rotated under the picture
 *   actions[{id,label}]     what a visitor can do (dock, keyboard, phone)
 *   duration                seconds on the wall in autoplay
 *   init()                  fresh state; called every time the scene is entered
 *   update(dt, auto)        advance; `auto` = the scene may schedule its own ops
 *   draw(g)                 paint, in CSS pixels
 *   act(id)                 perform a visitor action
 *   stats() -> [{k, v, accent?}]
 *   resize?(), pointer?(type, x, y)
 */
(function () {
  'use strict';
  const DS = (window.DS = window.DS || {});

  /* ---------------- palette ---------------- */

  const C = (DS.C = {
    bg: '#0a0d12',
    ink: '#e3e6ed',
    dim: '#8a92a4',
    mute: '#5b6376',
    line: 'rgba(190,200,220,0.22)',
    faint: 'rgba(190,200,220,0.09)',
    cell: '#131820',
    cell2: '#1a202b',
    dark: '#0b0e13',
    teal: '#6cc3b2',
    amber: '#e2b25f',
    rose: '#d27b83',
    blue: '#7f9ddf',
    violet: '#a48bd6',
    sage: '#a2c27c',
    sand: '#cdb793',
    sky: '#78b8d8',
    plum: '#c792b8',
    clay: '#d99a6c',
  });
  // Categorical order: neighbours in this list are far apart in hue.
  DS.HUES = [C.teal, C.violet, C.amber, C.blue, C.rose, C.sage, C.plum, C.sky, C.clay, C.sand];

  const cache = new Map();
  function rgb(h) {
    let v = cache.get(h);
    if (!v) {
      const n = parseInt(h.slice(1), 16);
      v = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
      cache.set(h, v);
    }
    return v;
  }
  DS.rgb = rgb;
  DS.rgba = (h, a) => {
    const [r, g, b] = rgb(h);
    return `rgba(${r},${g},${b},${a})`;
  };
  DS.mix = (a, b, t, alpha = 1) => {
    const A = rgb(a), B = rgb(b);
    const r = Math.round(A[0] + (B[0] - A[0]) * t);
    const g = Math.round(A[1] + (B[1] - A[1]) * t);
    const bl = Math.round(A[2] + (B[2] - A[2]) * t);
    return `rgba(${r},${g},${bl},${alpha})`;
  };
  // Piecewise-linear through a list of hex stops, t in [0,1].
  DS.ramp = (stops, t, alpha = 1) => {
    t = DS.clamp(t, 0, 1) * (stops.length - 1);
    const i = Math.min(stops.length - 2, Math.floor(t));
    return DS.mix(stops[i], stops[i + 1], t - i, alpha);
  };
  // A muted colour wheel, for things whose colour should say "where it belongs".
  DS.wheel = (t, alpha = 1, l = 62, s = 34) =>
    `hsla(${Math.round((((t % 1) + 1) % 1) * 360)},${s}%,${l}%,${alpha})`;

  /* ---------------- maths ---------------- */

  DS.clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  DS.lerp = (a, b, t) => a + (b - a) * t;
  // Frame-rate independent exponential approach.
  DS.ease = (cur, target, dt, rate = 9) => cur + (target - cur) * (1 - Math.exp(-rate * dt));
  DS.smooth = (t) => t * t * (3 - 2 * t);
  DS.angDiff = (a, b) => {
    let d = (b - a) % (Math.PI * 2);
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    return d;
  };
  DS.ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  DS.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  DS.shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  // FNV-1a, 32-bit. Real hash functions, so the collisions on screen are real.
  DS.fnv = (s, seed = 0x811c9dc5) => {
    let h = seed >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h >>> 0;
  };
  // murmur3's fmix32 finaliser over FNV: FNV alone leaves similar strings
  // ("s12:0", "s12:1") at correlated positions, which quietly ruins anything
  // that needs uniform spread — virtual nodes on a hash ring, for one.
  DS.fmix = (h) => {
    h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return h >>> 0;
  };
  DS.hash01 = (s) => DS.fmix(DS.fnv(s)) / 4294967296;
  DS.djb2 = (s) => {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = (Math.imul(h, 33) + s.charCodeAt(i)) >>> 0;
    return h >>> 0;
  };

  /* ---------------- step runner ----------------
   * Algorithms are written as generators that `yield` a hold in seconds after
   * each visible change, so the code on screen reads like the textbook version
   * and the animation falls out of it. Plain functions may be queued too; one
   * that returns a number holds for that long. */

  class Steps {
    constructor() { this.q = []; this.wait = 0; }
    get busy() { return this.q.length > 0 || this.wait > 0; }
    get length() { return this.q.length; }
    clear() { this.q.length = 0; this.wait = 0; }
    run(job) { this.q.push(job); return this; }
    hold(s) { this.q.push(() => s); return this; }
    // Make room for a visitor: finish the operation in flight instantly (so the
    // structure is never left half-changed), and drop queued work that hasn't
    // started. Generators are run to completion with their holds skipped.
    preempt() {
      const head = this.q[0];
      this.q.length = 0;
      this.wait = 0;
      if (head && typeof head.next === 'function') {
        for (let guard = 0; guard < 100000; guard++) {
          const { value, done } = head.next();
          if (done) break;
          if (value && typeof value.next === 'function') { /* nested generator objects are driven by yield* already */ }
        }
      }
    }
    update(dt) {
      this.wait -= dt;
      let guard = 0;
      while (this.wait <= 0 && this.q.length && guard++ < 400) {
        const head = this.q[0];
        if (typeof head === 'function') {
          this.q.shift();
          const r = head();
          if (r && typeof r.next === 'function') this.q.unshift(r);
          else if (typeof r === 'number') this.wait += r;
          continue;
        }
        const { value, done } = head.next();
        if (done) { this.q.shift(); continue; }
        this.wait += typeof value === 'number' ? value : 0.3;
      }
      if (!this.q.length && this.wait < 0) this.wait = 0;
    }
  }
  DS.Steps = Steps;

  /* ---------------- canvas helpers ---------------- */

  const SANS = '"Inter","Helvetica Neue",Helvetica,Arial,sans-serif';
  const MONO = '"JetBrains Mono","SF Mono",Menlo,Consolas,monospace';
  DS.font = (px, o = {}) => `${o.weight || 400} ${Math.max(6, px).toFixed(1)}px ${o.mono ? MONO : SANS}`;

  DS.text = (g, s, x, y, o = {}) => {
    g.font = DS.font(o.size || 13 * DS.u, o);
    g.fillStyle = o.color || C.ink;
    g.textAlign = o.align || 'center';
    g.textBaseline = o.base || 'middle';
    g.fillText(s, x, y);
  };

  DS.circle = (g, x, y, r, fill, stroke, lw) => {
    g.beginPath();
    g.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw || DS.u; g.stroke(); }
  };

  DS.rrect = (g, x, y, w, h, r) => {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  };

  DS.box = (g, x, y, w, h, r, fill, stroke, lw) => {
    DS.rrect(g, x, y, w, h, r);
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw || DS.u; g.stroke(); }
  };

  DS.line = (g, x0, y0, x1, y1, stroke, lw) => {
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(x1, y1);
    g.strokeStyle = stroke;
    g.lineWidth = lw || DS.u;
    g.stroke();
  };

  DS.arrow = (g, x0, y0, x1, y1, stroke, lw, head) => {
    const a = Math.atan2(y1 - y0, x1 - x0);
    head = head || 6 * DS.u;
    DS.line(g, x0, y0, x1 - Math.cos(a) * head * 0.6, y1 - Math.sin(a) * head * 0.6, stroke, lw);
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x1 - Math.cos(a - 0.45) * head, y1 - Math.sin(a - 0.45) * head);
    g.lineTo(x1 - Math.cos(a + 0.45) * head, y1 - Math.sin(a + 0.45) * head);
    g.closePath();
    g.fillStyle = stroke;
    g.fill();
  };

  // Soft halo for the one thing the eye should follow. Cheap: a radial
  // gradient, not shadowBlur, which is ruinous on a 4K canvas.
  DS.halo = (g, x, y, r, hex, a = 0.35) => {
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, DS.rgba(hex, a));
    gr.addColorStop(1, DS.rgba(hex, 0));
    g.fillStyle = gr;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  };

  /* ---------------- scenes & narration hooks ----------------
   * main.js owns the loop and the HUD; scenes talk to it through these. */

  DS.scenes = [];
  DS.register = (def) => { DS.scenes.push(def); };
  DS.say = () => {};        // replaced by main.js: (text, tone?) -> op line
  DS.u = 1;                 // CSS px per 1080p px
  DS.stage = { x: 0, y: 0, w: 1, h: 1, cx: 0, cy: 0, x1: 1, y1: 1 };
  DS.time = 0;

  /* ---------------- word lists ---------------- */

  DS.WORDS = (
    'otter falcon maple cobalt ember lantern orbit pixel quartz raven saffron tundra velvet willow ' +
    'zephyr amber basil cedar dune echo fjord glacier harbor iris jasper kelp lotus meadow nectar ' +
    'onyx pebble quill reef sable thistle umber violet wren yarrow badger heron lynx marten newt ' +
    'osprey puffin quokka robin stoat tapir urchin vole walrus yak zebra acorn birch clover daisy ' +
    'fern ginger hazel ivy juniper kale lilac mint nettle olive poppy rose sage tulip aster bramble ' +
    'canyon delta estuary grove hollow island lagoon mesa oasis prairie ridge steppe valley atlas ' +
    'beacon compass dynamo engine filament gear hinge kernel lever magnet nozzle piston rotor spindle ' +
    'turbine valve widget anchor bridge castle dome forge garden hall kiln library market orchard ' +
    'plaza quarry tower vault wharf apricot banana cherry damson fig grape lemon mango nutmeg papaya ' +
    'quince raisin sesame tomato vanilla walnut comet nebula pulsar quasar nova aurora eclipse zenith ' +
    'photon meteor cosmos galaxy crater lunar solar stellar violin cello flute oboe harp lute sitar ' +
    'tabla banjo bugle cymbal drum gong organ piano tuba kayak canoe ferry glider rocket sled tram ' +
    'wagon yacht blimp barge cutter dinghy skiff sloop copper silver nickel zinc iron cobble granite ' +
    'marble basalt slate shale opal ruby topaz garnet jade pearl coral'
  ).split(' ');
})();
