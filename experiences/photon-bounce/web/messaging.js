(function () {
  var PROTOCOL_VERSION = 1;
  var socket = null;
  var _onMessage = null;
  var _onConnect = null;
  var _onDisconnect = null;
  var _routerUrl = null;

  function sendRaw(obj) {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(Object.assign({}, obj, { version: PROTOCOL_VERSION })));
    }
  }

  function connect(routerUrl, onMessage, onConnect, onDisconnect) {
    _routerUrl = routerUrl;
    _onMessage = onMessage;
    _onConnect = onConnect;
    _onDisconnect = onDisconnect;
    openSocket();
  }

  function openSocket() {
    socket = new WebSocket(_routerUrl);
    var wasOpen = false;

    socket.addEventListener('open', function () {
      wasOpen = true;
      // Lock to at most 1 simultaneous controller
      sendRaw({ type: 'dse', settings: { lock: 1 } });
    });

    socket.addEventListener('message', function (event) {
      var msg;
      try { msg = JSON.parse(event.data); } catch (e) { return; }

      if (msg.type === 'con' && msg.client) {
        if (_onConnect) _onConnect(msg.client);
        return;
      }

      if (msg.type === 'chb') {
        // Heartbeat — if up:false, clients in msg.clients disconnected
        if (!msg.up && _onDisconnect) {
          (msg.clients || []).forEach(function (id) { _onDisconnect(id); });
        }
        return;
      }

      if (msg.type === 'cap' && msg.body) {
        if (_onMessage) _onMessage(msg.body, msg.client);
        return;
      }
    });

    socket.addEventListener('close', function () {
      // If the router link itself drops mid-session, no 'chb' disconnect will
      // ever arrive for the connected controller — tell the app directly so it
      // can fall back to attract after the grace period. Only sockets that
      // actually opened count: failed reconnect attempts also fire 'close',
      // and those must not keep renewing the disconnect grace window.
      if (wasOpen && _onDisconnect) _onDisconnect();
      setTimeout(openSocket, 1500);
    });
  }

  function send(body) {
    sendRaw({ type: 'app', body: body });
  }

  if (typeof window !== 'undefined') {
    window.Messaging = { connect: connect, send: send };
  }
  if (typeof module !== 'undefined') {
    module.exports = { connect: connect, send: send };
  }
})();
