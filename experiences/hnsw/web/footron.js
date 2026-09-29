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
 *     { type: "input", name: <id>, value }     a value for the current scene:
 *                                              a number, a short string, or
 *                                              {x, y} with both in [0, 1]
 *
 *   wall -> phone
 *     { type: "state", scene, mode, paused, speed,
 *       scenes: [{id, title}], actions: [{id, label}],
 *       panel: <scene-specific live state for the phone, or null> }
 *
 * Off the wall, `?phone=local` swaps the socket for a BroadcastChannel so a
 * phone panel open in another tab (or an iframe) of the same origin can drive
 * this page — how the panels are tested without a Footron server.
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

  const isId = (v) => typeof v === 'string' && v.length > 0 && v.length < 40 && /^[A-Za-z0-9-]+$/.test(v);

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
      case 'input': {
        if (!isId(body.name) || !h.onInput) return false;
        const v = body.value;
        const ok01 = (n) => typeof n === 'number' && isFinite(n) && n >= 0 && n <= 1;
        let clean;
        if (typeof v === 'number' && isFinite(v)) clean = v;
        else if (typeof v === 'string' && v.length <= 40 && /^[\w .,'!?-]*$/.test(v)) clean = v;
        else if (v && typeof v === 'object' && ok01(v.x) && ok01(v.y)) clean = { x: v.x, y: v.y };
        else return false;
        return h.onInput(body.name, clean) !== false;
      }
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
    const onMessage0 = (b) => { try { dispatch(b, handlers); } catch (e) { console.error(e); } };
    if (typeof location !== 'undefined' && /[?&]phone=local(&|$)/.test(location.search) && typeof BroadcastChannel === 'function') {
      const ch = new BroadcastChannel('ds-phone');
      ch.onmessage = (e) => { if (e.data && e.data.to === 'wall') onMessage0(e.data.body); };
      return { live: true, send(msg) { ch.postMessage({ to: 'phone', body: msg }); }, close() { ch.close(); } };
    }
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
