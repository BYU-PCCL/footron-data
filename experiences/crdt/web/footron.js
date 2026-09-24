/* Phone controls for the Footron wall — the receiving end.
 *
 * The wall has no keyboard, mouse or touchscreen, so a visitor's phone is the
 * whole of the input there. Footron serves `.footron/controls/lib/index.js`
 * to the phone, which talks to this page over a WebSocket.
 *
 * Protocol (keep in sync with .footron/controls/lib/index.js):
 *
 *   phone -> wall
 *     { type: "hello" }                        please send me your state
 *     { type: "scene",  value: <scene id> }    switch structure
 *     { type: "action", value: <action id> }   do something to it
 *     { type: "pause",  value: <bool> }
 *     { type: "speed",  value: <0.25 .. 3> }
 *     { type: "release" }                      hand the wall back to autoplay
 *
 *   wall -> phone
 *     { type: "state", scene, mode, paused, speed,
 *       scenes: [{id, title}], actions: [{id, label}] }
 *
 * The wall owns the scene list and each scene's actions and sends them to the
 * phone, so the two can't drift; the phone keeps a static copy only as a
 * fallback for before the first state arrives.
 *
 * Anything unrecognised, out of range or of the wrong type is ignored — the
 * phone is not the only thing that can open the socket.
 */
(function (root) {
  'use strict';

  function footronEnabled(search) {
    const q = search === undefined ? (typeof location === 'undefined' ? '' : location.search) : search;
    return /[?&]ftMsgUrl=/.test(q) || /[?&]ftmsg=1(&|$)/.test(q);
  }

  const isId = (v) => typeof v === 'string' && v.length > 0 && v.length < 40 && /^[a-z0-9-]+$/.test(v);

  /* Route one inbound message. Pure, so it can be exercised without a socket.
   * Returns whether it was acted on. */
  function dispatch(body, h) {
    if (!body || typeof body !== 'object') return false;
    switch (body.type) {
      case 'hello':
        h.onHello();
        return true;
      case 'scene':
        if (!isId(body.value)) return false;
        return h.onScene(body.value) !== false;
      case 'action':
        if (!isId(body.value)) return false;
        return h.onAction(body.value) !== false;
      case 'pause':
        if (typeof body.value !== 'boolean') return false;
        h.onPause(body.value);
        return true;
      case 'speed':
        if (typeof body.value !== 'number' || !isFinite(body.value)) return false;
        h.onSpeed(Math.min(3, Math.max(0.25, body.value)));
        return true;
      case 'release':
        h.onRelease();
        return true;
      default:
        return false;
    }
  }

  /* Connect and route. Returns { send, close }; both are no-ops off the wall or
   * if the vendored client failed to load — a missing script must not take the
   * visualisation down with it. */
  function connect(handlers, opts) {
    opts = opts || {};
    const off = { send() {}, close() {}, live: false };
    const enabled = opts.enabled !== undefined ? opts.enabled : footronEnabled();
    if (!enabled) return off;
    const lib = root.FootronMessaging;
    if (!lib || typeof lib.Messaging !== 'function') {
      console.warn('[footron] messaging client not loaded; phone controls are off');
      return off;
    }
    const client = new lib.Messaging();
    const onMessage = (b) => { try { dispatch(b, handlers); } catch (e) { console.error(e); } };
    client.addMessageListener(onMessage);
    client.mount();
    return {
      live: true,
      send(msg) {
        try {
          const p = client.sendMessage(msg);
          if (p && typeof p.catch === 'function') p.catch(() => {});
        } catch (e) { /* no phone connected yet */ }
      },
      close() {
        client.removeMessageListener(onMessage);
        client.unmount();
      },
    };
  }

  root.DSFootron = { footronEnabled, dispatch, connect };
})(typeof globalThis !== 'undefined' ? globalThis : window);
