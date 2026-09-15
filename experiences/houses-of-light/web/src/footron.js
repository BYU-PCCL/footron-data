/**
 * The wall's end of the phone controls.
 *
 * Footron serves a small React UI to a visitor's phone (`controls/lib/index.js`
 * in this repo) which talks to this page over a WebSocket. This module is the
 * receiving end.
 *
 * Protocol — keep in sync with controls/lib/index.js:
 *
 *   { type: "goto", value: "<temple id>" }
 *        put this temple on the wall now
 *   { type: "region", value: "utah" | "north-america" | "latin-america" |
 *                             "europe" | "africa-mideast" | "asia" | "pacific" }
 *        send the wall to a part of the world — the useful one on a public
 *        wall, because a visitor knows where they are from and does not know
 *        the name of a temple
 *   { type: "next"  }                 skip the slide on screen
 *   { type: "pause", value: <bool> }
 *   { type: "release" }               hand the wall back to the unattended loop
 *
 * Anything unrecognised is ignored. A controls bundle newer than the deployed
 * wall should degrade rather than throw, and no malformed message should be
 * able to park the wall somewhere a visitor cannot get it out of — which is
 * also why `release` exists and why the wall returns to its own loop on its own
 * after a period of quiet, without needing the phone to say so.
 */

const IDLE_RETURN = 45000;   // ms of phone silence before the wall resumes itself

/* Coarse lat/lon boxes, resolved in order — the FIRST box that contains a
 * temple owns it. The order is load-bearing, because the boxes overlap and a
 * plain per-key test gets it wrong: Lisbon sits inside the Africa/Middle East
 * rectangle, Hawaii sits inside the North America one, and the Philippines sit
 * inside the Pacific one. Testing Europe, then Asia, then the Pacific, before
 * the two big continental catch-alls puts each of those where a visitor would
 * expect to find it.
 *
 * Deliberately coarse otherwise: this is "somewhere near where I am from", not
 * a gazetteer, and a visitor tapping "Europe" wants a temple in Europe rather
 * than the correct answer to a boundary dispute.
 */
const REGIONS = [
  ["utah",           (t) => t.lat > 36.9 && t.lat < 42.1 && t.lon > -114.2 && t.lon < -108.9],
  ["europe",         (t) => t.lat > 35 && t.lat < 72 && t.lon > -25 && t.lon < 45],
  ["asia",           (t) => t.lat > 0 && t.lat < 60 && t.lon > 60 && t.lon < 150],
  ["pacific",        (t) => t.lat > -50 && t.lat < 30 && (t.lon > 110 || t.lon < -130)],
  ["africa-mideast", (t) => t.lat > -36 && t.lat < 40 && t.lon > -20 && t.lon < 60],
  ["latin-america",  (t) => t.lat > -60 && t.lat < 25 && t.lon > -120 && t.lon < -30],
  ["north-america",  (t) => t.lat > 7 && t.lat < 75 && t.lon > -170 && t.lon < -50],
];

/** The one region a temple belongs to, or null if it is off every map. */
export function regionOf(t) {
  if (!Number.isFinite(t.lat) || !Number.isFinite(t.lon)) return null;
  for (const [name, test] of REGIONS) if (test(t)) return name;
  return null;
}

/* Footron passes the socket URL as `?ftMsgUrl=…`. Without it the client would
 * retry ws://localhost:8089 forever, so away from the wall we simply do not
 * connect. `?ftmsg=1` forces it on for testing against a local server. */
export function footronEnabled(search = location.search) {
  return /[?&]ftMsgUrl=/.test(search) || /[?&]ftmsg=1(&|$)/.test(search);
}

/**
 * Route one inbound message. Pure with respect to the socket — it only touches
 * the app — so the protocol can be exercised without a browser.
 * @returns {boolean} whether the message was acted on
 */
export function dispatchControlMessage(body, app) {
  if (!body || typeof body !== "object") return false;

  switch (body.type) {
    case "goto": {
      const t = app.byId.get(body.value);
      if (!t || !t.slides?.length) return false;
      // Cut to this temple's best photograph. The cursor is left alone, so once
      // it has had its turn the wall carries on exactly where it was.
      app.show.jump({ temple: t, image: t.slides[0] });
      return true;
    }

    case "region": {
      if (!REGIONS.some(([n]) => n === body.value)) return false;
      const hits = app.slides.filter((s) => regionOf(s.temple) === body.value);
      if (!hits.length) return false;
      // Pick at random rather than best-first: a visitor pressing the same
      // button twice should get somewhere else, not the same photograph.
      app.show.jump(hits[(Math.random() * hits.length) | 0]);
      return true;
    }

    case "next":
      app.show.next();
      return true;

    case "pause":
      if (typeof body.value !== "boolean") return false;
      app.paused = body.value;      // freezes the globe and the ribbon
      app.show.pause(body.value);   // and the slide timer
      return true;

    case "release":
      app.paused = false;
      app.show.pause(false);
      return true;

    default:
      return false;
  }
}

/**
 * Connect, and route everything the phone sends. Returns a teardown function.
 * Safe to call off the wall and safe if the vendored client failed to load —
 * a missing script must not take the piece down with it.
 */
export function connectFootron(app, opts = {}) {
  const enabled = opts.enabled !== undefined ? opts.enabled : footronEnabled();
  if (!enabled) return () => {};

  const lib = globalThis.FootronMessaging;
  if (!lib || typeof lib.Messaging !== "function") {
    console.warn("[footron] messaging client not loaded; phone controls are off");
    return () => {};
  }

  let idle = null;
  const armIdle = () => {
    clearTimeout(idle);
    idle = setTimeout(() => { app.paused = false; app.show.pause(false); }, IDLE_RETURN);
  };

  const client = new lib.Messaging();
  const onMessage = (body) => {
    if (dispatchControlMessage(body, app)) armIdle();
  };
  client.addMessageListener(onMessage);
  client.mount();

  return () => {
    clearTimeout(idle);
    client.removeMessageListener(onMessage);
    client.unmount();
  };
}
