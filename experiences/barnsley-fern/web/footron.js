/* Phone controls for the Footron wall.
 *
 * The wall has no keyboard, no mouse and no touchscreen, so this is the whole
 * of the exhibit's input. Footron serves a small React UI to a visitor's phone
 * — `.footron/controls/lib/index.js` in this repo — which talks to this page
 * over a WebSocket. This file is the receiving end.
 *
 * Protocol (keep in sync with .footron/controls/lib/index.js):
 *
 *   { type: "knob", key: "turn2" | "scale2" | "twistLeaf" | "scaleLeaf" | "p2",
 *     value: <number>, live: <bool> }
 *        live:true  is a finger still on the slider — sketch the plant and keep up
 *        live:false is the release — re-measure the attractor and draw it properly
 *   { type: "preset", value: "barnsley" | "crozier" | … | "random" }
 *   { type: "walk"  }                 fresh random sequence, same coefficients
 *   { type: "pause", value: <bool> }
 *   { type: "release" }               hand the wall back to the unattended loop
 *
 * Anything unrecognised, out of range, or the wrong type is ignored: a controls
 * UI newer than the deployed build should degrade rather than throw, and no
 * malformed message may be able to park the wall in a state a visitor cannot
 * get it out of. That is why every number is clamped here rather than trusted —
 * the phone UI already keeps its sliders in range, but the phone UI is not the
 * only thing that can open the socket.
 *
 * Loaded as a plain script before app.js and exposed on `window.FernFootron`,
 * because the page has no build step and app.js is a plain script too.
 */
(function (root) {
  'use strict';

  /* Named plants, in knob space. The wall owns the numbers; the phone only
   * knows the ids and what to call them, so a preset can be re-tuned here
   * without shipping a new controls bundle.
   *
   * Every value sits inside its knob's slider range, which is what keeps each
   * map a contraction — see the note on `bend` in app.js. */
  var PRESETS = {
    barnsley: { turn2: 0,   scale2: 1,     twistLeaf: 0,   scaleLeaf: 1,    p2: 0.85 },
    crozier:  { turn2: 15,  scale2: 1.015, twistLeaf: 14,  scaleLeaf: 1.05, p2: 0.86 },
    feather:  { turn2: 0,   scale2: 0.985, twistLeaf: 38,  scaleLeaf: 1.35, p2: 0.72 },
    arch:     { turn2: -4,  scale2: 1.06,  twistLeaf: -12, scaleLeaf: 0.72, p2: 0.90 },
    spiral:   { turn2: -16, scale2: 1.03,  twistLeaf: 26,  scaleLeaf: 1.15, p2: 0.80 },
  };

  var finite = function (v) { return typeof v === 'number' && isFinite(v); };
  var clamp = function (v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); };

  /* Footron passes the socket URL as `?ftMsgUrl=…`. Without it the client
   * retries ws://localhost:8089 forever, so off the wall we simply don't
   * connect — `?ftmsg=1` forces it on for local testing against a dev
   * messaging server. */
  function footronEnabled(search) {
    var q = search === undefined
      ? (typeof location === 'undefined' ? '' : location.search)
      : search;
    return /[?&]ftMsgUrl=/.test(q) || /[?&]ftmsg=1(&|$)/.test(q);
  }

  /* Route one inbound message. Pure — no socket, no DOM, no chaos game — so
   * the whole protocol can be exercised without a browser. `ranges` maps a
   * knob key to [min, max]; app.js passes its own KNOBS in, so the bounds the
   * wall enforces and the bounds the wall draws cannot drift apart.
   * Returns whether the message was acted on. */
  function dispatchControlMessage(body, h, ranges) {
    if (!body || typeof body !== 'object') return false;

    switch (body.type) {
      case 'knob': {
        var r = ranges && ranges[body.key];
        if (!r || !finite(body.value)) return false;
        h.onActivity();
        h.onKnob(body.key, clamp(body.value, r[0], r[1]), body.live === true);
        return true;
      }
      case 'preset': {
        if (body.value === 'random') {
          h.onActivity();
          h.onRandom();
          return true;
        }
        var p = PRESETS[body.value];
        if (!p) return false;
        h.onActivity();
        // Clamped on the way through for the same reason as a knob: the table
        // above is ours, but the id that selected it came off a socket.
        var out = {};
        for (var k in p) {
          if (!Object.prototype.hasOwnProperty.call(p, k)) continue;
          var rr = ranges && ranges[k];
          out[k] = rr ? clamp(p[k], rr[0], rr[1]) : p[k];
        }
        h.onPreset(body.value, out);
        return true;
      }
      case 'walk':
        h.onActivity();
        h.onWalk();
        return true;
      case 'pause':
        if (typeof body.value !== 'boolean') return false;
        h.onActivity();
        h.onPause(body.value);
        return true;
      case 'release':
        // Deliberately does *not* poke the idle timer: this is someone saying
        // they are done, so the unattended loop should be allowed to take over.
        h.onRelease();
        return true;
      default:
        return false;
    }
  }

  /* Connect to the wall's messaging server and route everything it sends.
   * Returns a teardown function. Safe to call when not on the wall — it
   * no-ops, and it no-ops again if the vendored client failed to load, because
   * a missing script must not take the fern down with it. */
  function connectFootron(handlers, opts) {
    opts = opts || {};
    var enabled = opts.enabled !== undefined ? opts.enabled : footronEnabled();
    if (!enabled) return function () {};

    var lib = root.FootronMessaging;
    if (!lib || typeof lib.Messaging !== 'function') {
      console.warn('[footron] messaging client not loaded; phone controls are off');
      return function () {};
    }

    var client = new lib.Messaging();
    var onMessage = function (b) { dispatchControlMessage(b, handlers, opts.ranges); };
    client.addMessageListener(onMessage);
    client.mount();
    return function () {
      client.removeMessageListener(onMessage);
      client.unmount();
    };
  }

  root.FernFootron = {
    PRESETS: PRESETS,
    footronEnabled: footronEnabled,
    dispatchControlMessage: dispatchControlMessage,
    connectFootron: connectFootron,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
