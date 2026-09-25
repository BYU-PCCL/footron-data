// Phone controls for the Footron wall.
//
// The wall has no keyboard, no mouse and no touchscreen, so a visitor's phone is
// the whole of the exhibit's input. Footron serves a small React UI to the
// phone (`controls/lib/index.js` in this repo, copied into the
// experience by scripts/package-footron.mjs) which talks to this page over a
// WebSocket. This module is the receiving end.
//
// Almost everything goes phone -> wall, so the wall must cope with any message
// arriving in any state (a "test" before anything has grown, say) by quietly
// ignoring it. The one thing that goes back is a state report, so the phone can
// grey out what the wall would ignore anyway (see `send` below). Protocol (keep
// in sync with controls/lib/protocol.js — test.js checks the two agree):
//
//   { type: "hello" }                                    a phone just opened: answer with the state
//   wall -> phone: { type: "state", canEdit: <bool> }   can a bridge be edited yet? (false until one
//                                                        has finished growing, and while it grows)
//   { type: "setup", key: "stone",  value: <kg> }        how much stone
//   { type: "setup", key: "weight", value: <0..1> }      test weight, along its log slider
//   { type: "setup", key: "spot",   value: <0..1> }      where the weight lands, along the span
//   { type: "grow", stone?, weight?, spot? }             grow a bridge; any setup fields carried
//                                                        are applied first, so what the phone
//                                                        shows is exactly what the wall uses
//   { type: "lesson", value: <id> }                      a guided demonstration
//   { type: "skip" }                                     skip the step-by-step explanation
//   { type: "scrub", value: <0..1> }                     scrub the recorded iterations
//   { type: "replay" }                                   play / pause the replay
//   { type: "test" }                                     drop the weight on the finished bridge
//   { type: "yourTurn", value: <bool> }                  open / close the paint-your-own editor
//   { type: "paint", x: <0..1>, y: <0..1>, erase: <bool> }  one point of a stroke; x, y are
//                                                        fractions of the design area (y from the top)
//   { type: "stroke", value: "end" }                     the finger lifted
//   { type: "brush", value: <0..4> }     { type: "clear" }     { type: "reveal", value: <bool> }
//   { type: "testMine" }
//
// Anything unrecognised, out of range, or the wrong type is ignored, and every
// number is clamped here rather than trusted: the phone UI keeps its sliders in
// range, but it is not the only thing that can open the socket.

export const RANGES = {
  stone: [230, 1560],
  weight: [0, 1],
  spot: [0, 1],
};

export const LESSON_IDS = ["meet", "heavy", "spot", "stiff"];
export const BRUSH_RANGE = [0, 4];

// Where a 0..1 position along the span lands, as a load column. Kept clear of the
// two supports: a weight AT a support is no bridge at all. The phone draws its
// pad's weight arrow from the same rule (controls/lib/protocol.js).
export function spotToColumn(fraction, numElemX) {
  return Math.min(numElemX - 3, Math.max(3, Math.round(fraction * numElemX)));
}

const finite = (v) => typeof v === "number" && Number.isFinite(v);
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

// Footron passes the socket URL as `?ftMsgUrl=…`. Without it the client retries
// ws://localhost:8089 forever, so off the wall we simply don't connect —
// `?ftmsg=1` forces it on for local testing against a dev messaging server.
export function footronEnabled(search) {
  const q = search === undefined ? (typeof location === "undefined" ? "" : location.search) : search;
  const params = new URLSearchParams(q);
  return params.has("ftMsgUrl") || params.get("ftmsg") === "1";
}

// Routes one inbound message. Pure — no socket, no DOM, no simulation — so the
// whole protocol is checked without a browser. Returns whether the message was
// acted on. `h.onActivity()` is called for every accepted message (it is what
// keeps the wall out of its unattended loop while someone is playing).
export function dispatchControlMessage(body, h) {
  if (!body || typeof body !== "object") return false;

  switch (body.type) {
    case "hello":
      // Not activity: a phone merely opening must not end the unattended loop.
      h.onHello();
      return true;
    case "setup": {
      const range = RANGES[body.key];
      if (!range || !finite(body.value)) return false;
      h.onActivity();
      h.onSetup(body.key, clamp(body.value, range[0], range[1]));
      return true;
    }
    case "grow": {
      // The wall never reports back and its own state can change under the phone
      // (a lesson, the unattended loop), so the phone sends the setup it is
      // SHOWING with the request. A field that isn't a finite number is ignored.
      const setup = {};
      for (const key of ["stone", "weight", "spot"]) {
        if (finite(body[key])) setup[key] = clamp(body[key], RANGES[key][0], RANGES[key][1]);
      }
      h.onActivity();
      h.onGrow(setup);
      return true;
    }
    case "lesson":
      if (!LESSON_IDS.includes(body.value)) return false;
      h.onActivity();
      h.onLesson(body.value);
      return true;
    case "skip":
      h.onActivity();
      h.onSkip();
      return true;
    case "scrub":
      if (!finite(body.value)) return false;
      h.onActivity();
      h.onScrub(clamp(body.value, 0, 1));
      return true;
    case "replay":
      h.onActivity();
      h.onReplay();
      return true;
    case "test":
      h.onActivity();
      h.onTest();
      return true;
    case "yourTurn":
      if (typeof body.value !== "boolean") return false;
      h.onActivity();
      h.onYourTurn(body.value);
      return true;
    case "paint":
      if (!finite(body.x) || !finite(body.y)) return false;
      h.onActivity();
      h.onPaint(clamp(body.x, 0, 1), clamp(body.y, 0, 1), body.erase === true);
      return true;
    case "stroke":
      if (body.value !== "end") return false;
      h.onActivity();
      h.onStrokeEnd();
      return true;
    case "brush":
      if (!finite(body.value)) return false;
      h.onActivity();
      h.onBrush(Math.round(clamp(body.value, BRUSH_RANGE[0], BRUSH_RANGE[1])));
      return true;
    case "clear":
      h.onActivity();
      h.onClear();
      return true;
    case "reveal":
      if (typeof body.value !== "boolean") return false;
      h.onActivity();
      h.onReveal(body.value);
      return true;
    case "testMine":
      h.onActivity();
      h.onTestMine();
      return true;
    default:
      return false;
  }
}

// Connects to the wall's messaging server and routes everything it sends.
// Returns { send, close }. Safe off the wall: it no-ops, and it no-ops again
// if the vendored client failed to load, because a missing script must not take
// the exhibit down with it.
export function connectFootron(handlers, opts) {
  const off = { send() {}, close() {} };
  const enabled = opts && opts.enabled !== undefined ? opts.enabled : footronEnabled();
  if (!enabled) return off;

  const lib = typeof globalThis !== "undefined" ? globalThis.FootronMessaging : null;
  if (!lib || typeof lib.Messaging !== "function") {
    console.warn("[footron] messaging client not loaded; phone controls are off");
    return off;
  }

  const client = new lib.Messaging();
  const onMessage = (body) => dispatchControlMessage(body, handlers);
  client.addMessageListener(onMessage);
  client.mount();
  return {
    // Tell the phone something. With no phone connected yet there is nobody to
    // hear it, so a failure is expected and swallowed.
    send(message) {
      try {
        const sent = client.sendMessage(message);
        if (sent && typeof sent.catch === "function") sent.catch(() => {});
      } catch {
        // no phone connected
      }
    },
    close() {
      client.removeMessageListener(onMessage);
      client.unmount();
    },
  };
}
