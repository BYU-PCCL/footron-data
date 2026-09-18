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
 * The channel is one-way. Every panel in this repository is send-only, and the
 * wall has nothing it needs to tell a phone: the controls are all verbs, none
 * of them need to know the state of the battle to be worth pressing, and a
 * ship already lost is simply ignored here.
 *
 * Anything unrecognised is ignored: a controls bundle newer than the deployed
 * wall should degrade rather than throw. No message can park the wall in a
 * state a visitor cannot get it out of, which is why `release` exists and why
 * the wall returns to its attract loop on its own after a period of quiet
 * without needing the phone to say so.
 */

const IDLE_RETURN = 40000;   // ms of phone silence before the wall resumes itself

/**
 * Footron passes the router's socket URL as `?ftMsgUrl=…`. Without it the
 * client falls back to `ws://localhost:8089/out` and retries that forever, so
 * a plain dev server spends the session failing to open a socket and filling
 * the console — which is noise every headless test then has to filter. Append
 * `?ftmsg=1` to connect by hand against a local router.
 *
 * Same gate as barnsley-fern, wave-lab and houses-of-light.
 */
export function footronEnabled(search) {
  const q = search === undefined
    ? (typeof location === 'undefined' ? '' : location.search)
    : search;
  const params = new URLSearchParams(q);
  return params.has('ftMsgUrl') || params.get('ftmsg') === '1';
}

export function connectFootron(api, opts = {}) {
  const enabled = opts.enabled !== undefined ? opts.enabled : footronEnabled();
  if (!enabled) return { connected: false };

  const ns = globalThis.FootronMessaging;
  if (!ns) {
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

  // `FootronMessaging` is a UMD *namespace* — { Connection, Messaging } — and
  // `Messaging` is a class. It is not callable and there is no default export,
  // so this has to be `new ns.Messaging()`. Getting that wrong threw a
  // TypeError which the catch below then reported as "not on the wall", and
  // the phone sat on "disconnected" with nothing in the console to say why.
  if (typeof ns.Messaging !== 'function') {
    console.error('[footron] FootronMessaging.Messaging is missing; phone controls will not connect');
    return { connected: false };
  }

  let messaging;
  try {
    messaging = new ns.Messaging();
  } catch (err) {
    // The global exists, so we ARE on the wall and this is a real failure.
    // Never swallow it: a silent return here is indistinguishable from running
    // on a dev server, which is exactly how the last one hid.
    console.error('[footron] could not construct the messaging client', err);
    return { connected: false };
  }

  messaging.addMessageListener((msg) => {
    try { handle(msg); } catch (err) { /* a bad message must not stop the wall */ }
  });

  // mount() is async and rejects if the router is unreachable
  Promise.resolve(messaging.mount()).catch((err) => {
    console.error('[footron] messaging failed to mount', err);
  });

  return { connected: true, messaging };
}
