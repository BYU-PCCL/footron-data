(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.FootronMessaging = {}));
}(this, (function (exports) { 'use strict';

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _extends() {
    _extends = Object.assign || function (target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];

        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }

      return target;
    };

    return _extends.apply(this, arguments);
  }

  function _inheritsLoose(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;

    _setPrototypeOf(subClass, superClass);
  }

  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };

    return _setPrototypeOf(o, p);
  }

  function _isNativeReflectConstruct() {
    if (typeof Reflect === "undefined" || !Reflect.construct) return false;
    if (Reflect.construct.sham) return false;
    if (typeof Proxy === "function") return true;

    try {
      Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
      return true;
    } catch (e) {
      return false;
    }
  }

  function _construct(Parent, args, Class) {
    if (_isNativeReflectConstruct()) {
      _construct = Reflect.construct;
    } else {
      _construct = function _construct(Parent, args, Class) {
        var a = [null];
        a.push.apply(a, args);
        var Constructor = Function.bind.apply(Parent, a);
        var instance = new Constructor();
        if (Class) _setPrototypeOf(instance, Class.prototype);
        return instance;
      };
    }

    return _construct.apply(null, arguments);
  }

  function _isNativeFunction(fn) {
    return Function.toString.call(fn).indexOf("[native code]") !== -1;
  }

  function _wrapNativeSuper(Class) {
    var _cache = typeof Map === "function" ? new Map() : undefined;

    _wrapNativeSuper = function _wrapNativeSuper(Class) {
      if (Class === null || !_isNativeFunction(Class)) return Class;

      if (typeof Class !== "function") {
        throw new TypeError("Super expression must either be null or a function");
      }

      if (typeof _cache !== "undefined") {
        if (_cache.has(Class)) return _cache.get(Class);

        _cache.set(Class, Wrapper);
      }

      function Wrapper() {
        return _construct(Class, arguments, _getPrototypeOf(this).constructor);
      }

      Wrapper.prototype = Object.create(Class.prototype, {
        constructor: {
          value: Wrapper,
          enumerable: false,
          writable: true,
          configurable: true
        }
      });
      return _setPrototypeOf(Wrapper, Class);
    };

    return _wrapNativeSuper(Class);
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  var PROTOCOL_VERSION = 1; // TODO Make Protocol project for JS library similar to the python messaging library

  var MessageType;

  (function (MessageType) {
    MessageType["HeartbeatApp"] = "ahb";
    MessageType["HeartbeatClient"] = "chb";
    MessageType["Connect"] = "con";
    MessageType["Access"] = "acc";
    MessageType["ApplicationClient"] = "cap";
    MessageType["ApplicationApp"] = "app";
    MessageType["Error"] = "err";
    MessageType["DisplaySettings"] = "dse";
    MessageType["Lifecycle"] = "lcy";
  })(MessageType || (MessageType = {}));

  var LockStateError = /*#__PURE__*/function (_Error) {
    _inheritsLoose(LockStateError, _Error);

    function LockStateError(msg) {
      var _this;

      _this = _Error.call(this, msg) || this;
      Object.setPrototypeOf(_assertThisInitialized(_this), LockStateError.prototype);
      return _this;
    }

    return LockStateError;
  }( /*#__PURE__*/_wrapNativeSuper(Error));

  function _empty$1() {}

  function _awaitIgnored$1(value, direct) {
    if (!direct) {
      return value && value.then ? value.then(_empty$1) : Promise.resolve();
    }
  }

  function _invokeIgnored(body) {
    var result = body();

    if (result && result.then) {
      return result.then(_empty$1);
    }
  }

  function _await$1(value, then, direct) {
    if (direct) {
      return then ? then(value) : value;
    }

    if (!value || !value.then) {
      value = Promise.resolve(value);
    }

    return then ? value.then(then) : value;
  }

  var Connection = /*#__PURE__*/function () {
    /*
      Public Connection interface
       */
    function Connection(connectionImpl) {
      this.impl = connectionImpl;
    }

    var _proto = Connection.prototype;

    _proto.getId = function getId() {
      return this.impl.id;
    };

    _proto.isPaused = function isPaused() {
      return this.impl.paused;
    };

    _proto.accept = function accept() {
      try {
        var _this2 = this;

        return _this2.impl.accept();
      } catch (e) {
        return Promise.reject(e);
      }
    };

    _proto.sendMessage = function sendMessage(body, requestId) {
      try {
        var _this4 = this;

        return _this4.impl.sendMessage(body, requestId);
      } catch (e) {
        return Promise.reject(e);
      }
    };

    _proto.addMessageListener = function addMessageListener(callback) {
      this.impl.addMessageListener(callback);
    };

    _proto.removeMessageListener = function removeMessageListener(callback) {
      this.impl.removeMessageListener(callback);
    };

    _proto.addCloseListener = function addCloseListener(callback) {
      this.impl.addCloseListener(callback);
    };

    _proto.removeCloseListener = function removeCloseListener(callback) {
      this.impl.removeCloseListener(callback);
    };

    return Connection;
  }();
  var ConnectionImpl = /*#__PURE__*/function () {
    function ConnectionImpl(id, accepted, messagingClient, sendProtocolMessage, paused) {
      if (paused === void 0) {
        paused = false;
      }

      this.id = id;
      this.sendProtocolMessage = sendProtocolMessage;
      this.accepted = accepted;
      this.messagingClient = messagingClient;
      this.paused = paused;
      this.messageListeners = new Set();
      this.closeListeners = new Set();
    } //
    // Access methods
    //


    var _proto2 = ConnectionImpl.prototype;

    _proto2.accept = function accept() {
      try {
        var _this6 = this;

        return _await$1(_this6.updateAccess(true), function () {
          return _invokeIgnored(function () {
            if (!_this6.messagingClient.hasInitialState) {
              return _awaitIgnored$1(_this6.sendEmptyInitialMessage());
            }
          });
        });
      } catch (e) {
        return Promise.reject(e);
      }
    };

    _proto2.deny = function deny(reason) {
      try {
        var _this8 = this;

        return _awaitIgnored$1(_this8.updateAccess(false, reason));
      } catch (e) {
        return Promise.reject(e);
      }
    };

    _proto2.updateAccess = function updateAccess(accepted, reason) {
      try {
        var _this10 = this;

        if (!_this10.messagingClient.lock) {
          throw new LockStateError("locked");
        }

        return _await$1(_this10.sendProtocolMessage({
          type: MessageType.Access,
          accepted: accepted,
          reason: reason
        }), function () {
          _this10.accepted = true;
        });
      } catch (e) {
        return Promise.reject(e);
      }
    } //
    // Message methods
    //
    ;

    _proto2.sendMessage = function sendMessage(body, requestId) {
      try {
        var _this12 = this;

        if (!_this12.accepted) {
          throw new Error("client not accepted");
        }

        if (_this12.paused) {
          return;
        }

        return _awaitIgnored$1(_this12.sendProtocolMessage({
          type: MessageType.ApplicationApp,
          body: body,
          req: requestId,
          client: _this12.id
        }));
      } catch (e) {
        return Promise.reject(e);
      }
    };

    _proto2.sendEmptyInitialMessage = function sendEmptyInitialMessage() {
      try {
        var _this14 = this;

        return _awaitIgnored$1(_this14.sendMessage({
          __start: ""
        }));
      } catch (e) {
        return Promise.reject(e);
      }
    } //
    // Message listener handling
    //
    ;

    _proto2.addMessageListener = function addMessageListener(callback) {
      this.messageListeners.add(callback);
    };

    _proto2.removeMessageListener = function removeMessageListener(callback) {
      this.messageListeners["delete"](callback);
    };

    _proto2.clearMessageListener = function clearMessageListener() {
      this.messageListeners.clear();
    };

    _proto2.notifyMessageListeners = function notifyMessageListeners(message) {
      this.messageListeners.forEach(function (callback) {
        return callback(message);
      });
    } //
    // Connection close listener handling
    //
    ;

    _proto2.addCloseListener = function addCloseListener(callback) {
      this.closeListeners.add(callback);
    };

    _proto2.removeCloseListener = function removeCloseListener(callback) {
      this.closeListeners["delete"](callback);
    };

    _proto2.clearCloseListeners = function clearCloseListeners() {
      this.closeListeners.clear();
    };

    _proto2.notifyCloseListeners = function notifyCloseListeners() {
      this.closeListeners.forEach(function (callback) {
        return callback();
      });
    };

    return ConnectionImpl;
  }();

  var Request = function Request(body, id) {
    this.body = body;
    this.id = id;
  };

  function _await(value, then, direct) {
    if (direct) {
      return then ? then(value) : value;
    }

    if (!value || !value.then) {
      value = Promise.resolve(value);
    }

    return then ? value.then(then) : value;
  }

  function _invoke(body, then) {
    var result = body();

    if (result && result.then) {
      return result.then(then);
    }

    return then(result);
  }

  function _empty() {}

  function _awaitIgnored(value, direct) {
    if (!direct) {
      return value && value.then ? value.then(_empty) : Promise.resolve();
    }
  }

  var MessagingClient = /*#__PURE__*/function () {
    function MessagingClient(url, hasInitialState) {
      if (hasInitialState === void 0) {
        hasInitialState = false;
      }

      this.url = url;
      this.connections = new Map();
      this.connectionListeners = new Set();
      this.messageListeners = new Set();
      this._lock = false;
      this.hasInitialState = hasInitialState;
      this._status = "idle";
      this.bindMethods();
    }

    var _proto = MessagingClient.prototype;

    _proto.bindMethods = function bindMethods() {
      this.sendMessage = this.sendMessage.bind(this);
      this.addMessageListener = this.addMessageListener.bind(this);
      this.removeMessageListener = this.removeMessageListener.bind(this);
      this.sendProtocolMessage = this.sendProtocolMessage.bind(this);
    };

    _proto.setLock = function setLock(lock) {
      try {
        var _this2 = this;

        return _await(_this2.sendProtocolMessage({
          type: MessageType.DisplaySettings,
          settings: {
            lock: lock
          }
        }), function () {
          _this2._lock = lock;
        });
      } catch (e) {
        return Promise.reject(e);
      }
    };

    //
    // Client lifecycle methods (not to be confused with protocol lifecycle
    // messages)
    //
    _proto.mount = function mount() {
      this._status = "loading";
      this.openSocket();
    };

    _proto.unmount = function unmount() {
      this.close();
    };

    _proto.close = function close() {
      if (this._status == "closed") {
        // @vinhowe: This return statement just makes close() idempotent because
        // I can't think of a reason why we'd care whether this method is called
        // multiple times. It could be bad practice not to throw an error here.
        // If we decided that we cared that this method is only called once, we
        // could throw an error here instead.
        return;
      }

      this.closeSocket();
      this.clearMessageListeners();
      this.clearConnectionListeners();
    } //
    // Socket-level logic
    //
    ;

    _proto.openSocket = function openSocket() {
      var _this3 = this;

      // TODO: Handle retries here
      this.socket = new WebSocket(this.url);
      this.socket.addEventListener("message", function (_ref) {
        var data = _ref.data;
        return _this3.onMessage(data);
      });
      this.socket.addEventListener("open", function () {
        return _this3._status = "open";
      });
      this.socket.addEventListener("close", this.onSocketClose);
    };

    _proto.closeSocket = function closeSocket() {
      if (this.socket === undefined) {
        return;
      } // We're closing the socket manually here, so we don't want onSocketClose to
      // try reopening it


      this.socket.removeEventListener("close", this.onSocketClose);
      this.socket.close();
    };

    _proto.onSocketClose = function onSocketClose() {
      // Status is idle, loading, or open, so we'll retry opening the socket
      // after a delay to avoid spamming the server
      setTimeout(this.openSocket, 1000);
    };

    _proto.socketReady = function socketReady() {
      try {
        var _exit2 = false;

        var _this5 = this;

        if (_this5.socket === undefined) {
          return false;
        }

        if (_this5.socket.readyState == WebSocket.OPEN) {
          return true;
        }

        return _invoke(function () {
          if (_this5.socket.readyState == WebSocket.CONNECTING) {
            // Await until either socket connects or closes
            // @vinhowe: Technically we could just return a boolean promise, but
            // there's no non-error state where it would potentially return anything
            // other than true, so that didn't make sense to me.
            return _await(new Promise(function (resolve, reject) {
              if (_this5.socket === undefined) {
                reject(new Error("Socket was set to undefined during CONNECTING state; " + "this is probably a bug"));
                return;
              }

              var openCallback = function openCallback() {
                removeListeners();
                resolve();
              };

              var closeCallback = function closeCallback() {
                removeListeners();
                reject(new Error("Socket closed during CONNECTING state; it may have timed out"));
              };

              var removeListeners = function removeListeners() {
                var _this5$socket, _this5$socket2;

                (_this5$socket = _this5.socket) == null ? void 0 : _this5$socket.removeEventListener("open", openCallback);
                (_this5$socket2 = _this5.socket) == null ? void 0 : _this5$socket2.removeEventListener("close", closeCallback);
              };

              _this5.socket.addEventListener("open", openCallback);

              _this5.socket.addEventListener("close", closeCallback);
            }), function () {
              _exit2 = true;
              return true;
            });
          }
        }, function (_result) {
          return _exit2 ? _result : false;
        });
      } catch (e) {
        return Promise.reject(e);
      }
    };

    MessagingClient.parseMessage = function parseMessage(data) {
      var message;

      try {
        message = JSON.parse(data);
      } catch (error) {
        console.error("An error occurred while attempting to parse a Controls message");
        throw error;
      }

      if (!("type" in message) || typeof message["type"] !== "string") {
        throw Error("Message received from router didn't specify valid type");
      }

      return message;
    };

    _proto.onMessage = function onMessage(data) {
      try {
        var _exit5 = false;

        var _this7 = this;

        var message = MessagingClient.parseMessage(data);
        return _invoke(function () {
          if (message.type == MessageType.HeartbeatClient) {
            if (!message.up) {
              message.clients.forEach(function (id) {
                return _this7.removeConnection(id);
              });
              _exit5 = true;
              return;
            } // TODO: This test might be expensive and unnecessary, consider simplifying
            //  or removing it


            return _await(_this7.compareHeartbeatUpConnections(message.clients), function () {
              _exit5 = true;
            });
          }
        }, function (_result2) {
          var _exit4 = false;
          if (_exit5) return _result2;

          if (!("client" in message) || typeof message.client !== "string") {
            throw Error("Incoming message of type '" + message.type + "' doesn't contain valid 'client' field required by all remaining message handlers");
          }

          return _invoke(function () {
            if (message.type == MessageType.Connect) {
              var connection = _this7.connections.get(message.client);

              if (!connection) {
                connection = _this7.addConnection(message.client);
              }

              return _invoke(function () {
                if (!_this7.hasInitialState && connection.accepted) {
                  return _awaitIgnored(connection.sendEmptyInitialMessage());
                }
              }, function () {
                _exit4 = true;
              });
            }
          }, function (_result3) {
            if (_exit4) return _result3;

            if (!_this7.connections.has(message.client)) {
              throw Error("Unauthorized client '" + message.client + "' attempted to send an authenticated message");
            }

            if (message.type == MessageType.ApplicationClient) {
              var _this7$connections$ge;

              var listenerMessage = message.req == null ? message.body : new Request(message.body, message.req);

              _this7.notifyMessageListeners(listenerMessage);

              (_this7$connections$ge = _this7.connections.get(message.client)) == null ? void 0 : _this7$connections$ge.notifyMessageListeners(listenerMessage);
              return;
            }

            if (message.type == MessageType.Lifecycle) {
              var connection = _this7.connections.get(message.client);

              if (!connection) {
                return;
              }

              connection.paused = message.paused;
              return;
            }

            throw Error("Couldn't handle message type '" + message.type + "'");
          });
        });
      } catch (e) {
        return Promise.reject(e);
      }
    } // Based on implementation at
    // https://github.com/BYU-PCCL/footron-messaging-python/blob/9206e273e5c620e984b67c377fcc319996492e27/foomsg/client.py#L171-L193
    ;

    _proto.compareHeartbeatUpConnections = function compareHeartbeatUpConnections(connections) {
      var _this8 = this;

      var localConnections = new Set(this.connections.keys());
      var heartbeatConnections = new Set(connections);
      Array.from(heartbeatConnections.keys()).forEach(function (client) {
        if (localConnections.has(client)) {
          heartbeatConnections["delete"](client);
          localConnections["delete"](client);
          return;
        }

        _this8.addConnection(client);
      });
      Array.from(localConnections.keys()).forEach(function (client) {
        if (heartbeatConnections.has(client)) {
          heartbeatConnections["delete"](client);
          localConnections["delete"](client);
          return;
        }

        _this8.removeConnection(client);
      });
    };

    _proto.sendMessage = function sendMessage(body, requestId) {
      this.connections.forEach(function (connection) {
        return connection.sendMessage(body, requestId);
      });
    } //
    // Client connection handling
    // (these methods just handle updating internal state and notifying listeners
    // _after_ connections are added/removed)
    //
    ;

    _proto.addConnection = function addConnection(id) {
      var connection = new ConnectionImpl(id, !this._lock, this, this.sendProtocolMessage // Is this correct?
      );
      this.connections.set(id, connection);
      this.notifyConnectionListeners(connection);
      return connection;
    };

    _proto.removeConnection = function removeConnection(id) {
      var _this$connections, _this$connections$get;

      if (!this.connections.has(id)) {
        return;
      }

      (_this$connections = this.connections) == null ? void 0 : (_this$connections$get = _this$connections.get(id)) == null ? void 0 : _this$connections$get.notifyCloseListeners();
      this.connections["delete"](id);
    } //
    // Message handling
    //
    ;

    _proto.sendProtocolMessage = function sendProtocolMessage(message) {
      try {
        var _exit7 = false;

        var _this10 = this;

        return _await(_this10.socketReady(), function (_this9$socketReady) {
          var _this10$socket;

          if (!_this9$socketReady) {
            // TODO: Do we want to queue up messages and wait for the socket to be
            //  available again? Or does our little CONNECTING await in socketReady
            //  basically provide that behavior for all of the states we care about?
            throw Error("Couldn't send protocol message because socket isn't available");
          }

          (_this10$socket = _this10.socket) == null ? void 0 : _this10$socket.send(JSON.stringify(_extends({}, message, {
            version: PROTOCOL_VERSION
          })));
        });
      } catch (e) {
        return Promise.reject(e);
      }
    } //
    // Message listener handling
    //
    ;

    _proto.addMessageListener = function addMessageListener(callback) {
      this.messageListeners.add(callback);
    };

    _proto.removeMessageListener = function removeMessageListener(callback) {
      this.messageListeners["delete"](callback);
    };

    _proto.clearMessageListeners = function clearMessageListeners() {
      this.messageListeners.clear();
    };

    _proto.notifyMessageListeners = function notifyMessageListeners(body) {
      this.messageListeners.forEach(function (callback) {
        return callback(body);
      });
    } //
    // Connection listener handling
    //
    ;

    _proto.addConnectionListener = function addConnectionListener(callback) {
      this.connectionListeners.add(callback);
    };

    _proto.removeConnectionListener = function removeConnectionListener(callback) {
      this.connectionListeners["delete"](callback);
    };

    _proto.clearConnectionListeners = function clearConnectionListeners() {
      this.connectionListeners.clear();
    };

    _proto.notifyConnectionListeners = function notifyConnectionListeners(connection) {
      this.connectionListeners.forEach(function (callback) {
        callback(new Connection(connection));
      });
    };

    _createClass(MessagingClient, [{
      key: "lock",
      get: function get() {
        return this._lock;
      }
    }, {
      key: "status",
      get: function get() {
        return this._status;
      }
    }]);

    return MessagingClient;
  }();

  var Messaging = /*#__PURE__*/function (_MessagingClient) {
    _inheritsLoose(Messaging, _MessagingClient);

    function Messaging(url) {
      if (url == null) {
        var _URLSearchParams$get;

        url = (_URLSearchParams$get = new URLSearchParams(location.search).get("ftMsgUrl")) != null ? _URLSearchParams$get : "ws://localhost:8089/out";
      }

      return _MessagingClient.call(this, url) || this;
    }

    return Messaging;
  }(MessagingClient);

  exports.Connection = Connection;
  exports.Messaging = Messaging;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
// //# sourceMappingURL=footron-messaging.development.js.map
