// Phone controls for the Footron wall.
//
// The wall has no keyboard, no mouse and no touchscreen, so this is the whole of
// the exhibit's input. Footron serves a small React UI to a visitor's phone —
// `footron/controls/lib/index.js` in this repo, copied into the experience by
// scripts/package-footron.mjs — which talks to this page over a WebSocket. This
// module is the receiving end.
//
// Protocol (keep in sync with footron/controls/lib/index.js):
//
//   { type: "swell", key: "amplitude"|"frequency"|"angle"|"chop"|"wind"
//                         |"tide"|"erosion"|"speed", value: <number> }
//   { type: "coast", value: "classic"|"sandbar"|…  }   rebuild the sea bed
//   { type: "light", value: "day"|"sunset"|"night" }
//   { type: "mood",  value: "glassy"|"surf"|"storm" }  a whole sea state at once
//   { type: "rogue" }                                  one big wave, now
//   { type: "lesson", value: "shoal"|"rip"|…  }        a demonstration
//   { type: "touch", x: <0…1>, y: <0…1>, tool: "splash"|"toy"|"prop"|"river"
//                                              |"raise"|"dig"|"smooth" }
//   { type: "view",  key: "flow"|"depth"|"section"|"pause", value: <bool> }
//   { type: "reset" }                                  rebuild the beach
//   { type: "calm" }                                   flatten the sea
//   { type: "release" }                                hand back to the attract loop
//
// Anything unrecognised, out of range, or the wrong type is ignored: a controls
// UI newer than the deployed build should degrade rather than throw, and no
// malformed message may be able to park the wall in a state a visitor cannot get
// it out of. That last point is why every numeric field is clamped here rather
// than trusted — the phone UI already keeps its sliders in range, but the phone
// UI is not the only thing that can open the socket.

// The one authority for what a slider may be set to. The phone UI reads these
// same bounds out of the message it gets back, so the two cannot drift.
export const RANGES = {
  amplitude: [0.05, 1.4],
  frequency: [0.03, 0.18],
  angle: [-45, 45],
  chop: [0, 1],
  wind: [0, 1],
  tide: [-1.5, 1.5],
  erosion: [0, 1],
  speed: [0.25, 2],
};

export const COASTS = ['classic', 'sandbar', 'coves', 'reef', 'pier', 'jetty', 'flat'];
export const LIGHTS = ['day', 'sunset', 'night'];
export const MOODS = ['glassy', 'surf', 'storm'];
export const LESSONS = ['shoal', 'rip', 'groin', 'refract', 'surge', 'delta',
  'reefbreak', 'pierscour'];
export const TOOLS = ['splash', 'toy', 'prop', 'river', 'raise', 'dig', 'smooth'];
export const VIEWS = ['flow', 'depth', 'section', 'pause'];

const finite = (v) => typeof v === 'number' && Number.isFinite(v);
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

/**
 * Footron passes the socket URL as `?ftMsgUrl=…`. Without it the client retries
 * ws://localhost:8089 forever, so off the wall we simply don't connect —
 * `?ftmsg=1` forces it on for local testing against a dev messaging server.
 */
export function footronEnabled(search) {
  const q = search === undefined
    ? (typeof location === 'undefined' ? '' : location.search)
    : search;
  const params = new URLSearchParams(q);
  return params.has('ftMsgUrl') || params.get('ftmsg') === '1';
}

/**
 * Route one inbound message. Pure — no socket, no DOM, no simulation — so the
 * whole protocol is checked in scripts/verify.mjs without a browser. Returns
 * whether the message was acted on.
 */
export function dispatchControlMessage(body, h) {
  if (!body || typeof body !== 'object') return false;
  const msg = body;

  switch (msg.type) {
    case 'swell': {
      const range = RANGES[msg.key];
      if (!range || !finite(msg.value)) return false;
      h.onActivity();
      h.onSwell(msg.key, clamp(msg.value, range[0], range[1]));
      return true;
    }
    case 'coast':
      if (!COASTS.includes(msg.value)) return false;
      h.onActivity();
      h.onCoast(msg.value);
      return true;
    case 'light':
      if (!LIGHTS.includes(msg.value)) return false;
      h.onActivity();
      h.onLight(msg.value);
      return true;
    case 'mood':
      if (!MOODS.includes(msg.value)) return false;
      h.onActivity();
      h.onMood(msg.value);
      return true;
    case 'rogue':
      h.onActivity();
      h.onRogue();
      return true;
    case 'lesson':
      if (!LESSONS.includes(msg.value)) return false;
      h.onActivity();
      h.onLesson(msg.value);
      return true;
    case 'touch': {
      if (!finite(msg.x) || !finite(msg.y)) return false;
      const tool = TOOLS.includes(msg.tool) ? msg.tool : 'splash';
      // Fractions of the wall, so the phone never needs to know the grid size —
      // which is chosen at load from the display, and differs between machines.
      h.onActivity();
      h.onTouch(clamp(msg.x, 0, 1), clamp(msg.y, 0, 1), tool);
      return true;
    }
    case 'view':
      if (!VIEWS.includes(msg.key) || typeof msg.value !== 'boolean') return false;
      h.onActivity();
      h.onView(msg.key, msg.value);
      return true;
    case 'reset':
      h.onActivity();
      h.onReset();
      return true;
    case 'calm':
      h.onActivity();
      h.onCalm();
      return true;
    case 'release':
      // Deliberately does *not* poke the idle timer: this is someone saying they
      // are done, so the attract loop should be allowed to take over.
      h.onRelease();
      return true;
    default:
      return false;
  }
}

/**
 * Connect to the wall's messaging server and route everything it sends.
 * Returns a teardown function. Safe to call when not on the wall — it no-ops,
 * and it no-ops again if the vendored client failed to load, because a missing
 * script must not take the simulation down with it.
 */
export function connectFootron(handlers, opts) {
  const enabled = opts && opts.enabled !== undefined ? opts.enabled : footronEnabled();
  if (!enabled) return () => {};

  const lib = typeof globalThis !== 'undefined' ? globalThis.FootronMessaging : null;
  if (!lib || typeof lib.Messaging !== 'function') {
    console.warn('[footron] messaging client not loaded; phone controls are off');
    return () => {};
  }

  const client = new lib.Messaging();
  const onMessage = (body) => dispatchControlMessage(body, handlers);
  client.addMessageListener(onMessage);
  client.mount();
  return () => {
    client.removeMessageListener(onMessage);
    client.unmount();
  };
}
