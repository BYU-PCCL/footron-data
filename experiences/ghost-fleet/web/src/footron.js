/**
 * The wall's end of the phone controls.
 *
 * Footron serves a small React UI to a visitor's phone (`controls/lib/index.js`
 * in this repo) which talks to this page over a WebSocket. This module is the
 * receiving end.
 *
 * Protocol — keep in sync with controls/lib/index.js:
 *
 *   { type: "fire",   value: "crimson" | "azure" | "both" }
 *        order a fleet to give fire. A ship whose guns are trained the wrong
 *        way puts her helm over and answers once she bears, so the order is
 *        never silently dropped.
 *   { type: "target", value: <ship index 0-3> }
 *        mark a ship — the opposing fleet brings guns to bear on her
 *   { type: "camera", value: "orbit" | "follow" | "cinematic" }
 *   { type: "storm",  value: <bool> }   summon or calm the squall
 *   { type: "reset"  }                  raise a fresh fleet
 *   { type: "replay" }                  play the opening explainer again
 *   { type: "release" }                 hand the wall back to its own loop
 *
 * Anything unrecognised is ignored: a controls bundle newer than the deployed
 * wall should degrade rather than throw. No message can park the wall in a
 * state a visitor cannot get it out of, which is why `release` exists and why
 * the wall returns to its attract loop on its own after a period of quiet
 * without needing the phone to say so.
 */

const IDLE_RETURN = 40000;   // ms of phone silence before the wall resumes itself

export function connectFootron(api) {
  const Messaging = globalThis.FootronMessaging;
  if (!Messaging) {
    // running outside the wall — a plain browser, or a dev server
    return { connected: false };
  }

  let idleTimer = null;
  const touch = () => {
    api.markInput();
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => api.release(), IDLE_RETURN);
  };

  const handle = (msg) => {
    if (!msg || typeof msg !== 'object') return;
    switch (msg.type) {
      case 'fire':
        touch();
        if (msg.value === 'both') { api.volley('crimson'); api.volley('azure'); }
        else if (msg.value === 'crimson' || msg.value === 'azure') api.volley(msg.value);
        break;
      case 'target': {
        touch();
        const i = Number(msg.value);
        if (Number.isInteger(i)) api.target(i);
        break;
      }
      case 'camera':
        touch();
        api.camera(msg.value);
        break;
      case 'storm':
        touch();
        api.storm(!!msg.value);
        break;
      case 'reset':
        touch();
        api.reset();
        break;
      case 'replay':
        touch();
        api.replay();
        break;
      case 'release':
        clearTimeout(idleTimer);
        api.release();
        break;
      default:
        break;   // ignore, do not throw
    }
  };

  let messaging;
  try {
    messaging = Messaging.default ? Messaging.default() : Messaging();
  } catch (err) {
    return { connected: false };
  }

  messaging.mount?.();
  messaging.addMessageListener?.((msg) => {
    try { handle(msg); } catch (err) { /* a bad message must not stop the wall */ }
  });

  return {
    connected: true,
    /** Tell the phones what is on the wall, so the controls can label ships. */
    send(payload) {
      try { messaging.sendMessage?.(payload); } catch (err) { /* offline is fine */ }
    }
  };
}
