import net from 'node:net';

class TCPSocket {
  #buffer = [];
  #connected = false;
  #connectedHandler;
  #disconnectionReason;
  #pendingError;
  #pingReceived = false;
  #socket = new net.Socket();
  #timeoutId;

  constructor(
    { address, port },
    { connectTimeout = 5000, url } = {},
    {
      onConnected,
      onConnecting,
      onConnectionError,
      onConnectionTimeout,
      onDisconnected,
      onMessage,
    } = {}
  ) {
    this._clearTimeout = this._clearTimeout.bind(this);
    this.#connectedHandler = () => onConnected({ url });
    this.#socket.on('connect', () => {
      // The `onConnected` callback is handled after the first successful ping
      // instead of here to avoid showing "Connected" as soon as the TCP socket
      // opens, as that can be misleading, when proper communication cannot
      // actually be established with the server.
      this._clearTimeout();
      this.#connected = true;
    });
    this.#socket.setEncoding('utf8');
    this.#socket.on('data', (data) => {
      this.#buffer.push(data);
      if (data.includes('\n')) {
        // If the data contains a newline, we can parse the messages
        const messages = this.#buffer.join('').split('\n');
        this.#buffer.length = 0;
        this.#buffer.push(messages.pop());
        for (const message of messages) {
          onMessage(JSON.parse(message));
        }
      }
    });
    this.#socket.on('error', (error) => {
      this._clearTimeout();
      this.#pendingError = error;
    });
    this.#socket.on('end', () => {
      this._clearTimeout();
      this.#socket.end();
    });
    this.#socket.on('close', () => {
      const error = this.#pendingError;
      const wasConnected = this.#connected;
      const disconnectionReason =
        this.#disconnectionReason || 'io server disconnect';
      this.#pendingError = undefined;
      this.#connected = false;
      this.#disconnectionReason = undefined;
      this._clearTimeout();
      if (error) {
        // Copy the semantics of Socket.IO sockets where different handlers are
        // called depending on whether the connection was already established
        // or not
        if (wasConnected) {
          onDisconnected({ url, reason: 'transport error' });
        } else {
          onConnectionError({ url, error });
        }
      } else {
        onDisconnected({
          url,
          reason: disconnectionReason,
        });
      }
    });
    this.#socket.connect(port, address);
    onConnecting({ url });
    this.#timeoutId = setTimeout(() => {
      onConnectionTimeout({ url });
    }, connectTimeout);
  }

  detach() {
    this._clearTimeout();
    this.#socket.removeAllListeners();
    this.#socket = undefined;
  }

  emit(_type, message) {
    this.#socket.write(JSON.stringify(message) + '\n');
  }

  end(reason = 'io client disconnect') {
    this.#disconnectionReason = reason;
    this.#socket.end();
  }

  notifyPing(success = true) {
    if (success) {
      if (!this.#pingReceived) {
        if (this.#connectedHandler) {
          this.#connectedHandler();
          this.#connectedHandler = undefined;
        }
        this.#pingReceived = true;
      }
    } else {
      if (this.#pingReceived) {
        this.end('ping timeout');
        this.#pingReceived = false;
      }
    }
  }

  _clearTimeout() {
    if (this.#timeoutId) {
      clearTimeout(this.#timeoutId);
      this.#timeoutId = undefined;
    }
  }
}

class ReconnectingTCPSocket {
  #address;
  #options;
  #handlers;
  #socket;
  #connectingHandlerCalled = false;
  #reconnectionActive = true;
  #reconnectionTimerId;

  constructor(address, options = {}, handlers = {}) {
    this.#address = address;
    this.#handlers = handlers;
    this.#options = options;
    this._startNewConnectionAttempt =
      this._startNewConnectionAttempt.bind(this);
    this._startNewConnectionAttempt();
  }

  detach() {
    this.#reconnectionActive = false;
    this._setSocket(undefined);
  }

  emit(...args) {
    return this.#socket.emit(...args);
  }

  end() {
    this.#reconnectionActive = false;
    this._cancelReconnectionAttempt();
    return this.#socket.end();
  }

  notifyPing(success = true) {
    return this.#socket.notifyPing(success);
  }

  _getRandomReconnectionDelayMsec() {
    return Math.random() * 1000 + 500;
  }

  _setSocket(factory) {
    this._cancelReconnectionAttempt();
    if (this.#socket) {
      this.#socket.detach();
    }
    this.#socket = factory ? factory() : undefined;
  }

  _cancelReconnectionAttempt() {
    if (this.#reconnectionTimerId) {
      clearTimeout(this.#reconnectionTimerId);
      this.#reconnectionTimerId = undefined;
    }
  }

  _scheduleNewReconnectionAttempt() {
    this._cancelReconnectionAttempt();
    this.#reconnectionTimerId = setTimeout(
      this._startNewConnectionAttempt,
      this._getRandomReconnectionDelayMsec()
    );
  }

  _startNewConnectionAttempt() {
    // eslint-disable-next-line unicorn/no-this-assignment
    const self = this;
    this._cancelReconnectionAttempt();
    this._setSocket(
      () =>
        new TCPSocket(this.#address, this.#options, {
          onConnected(...args) {
            if (self.#handlers.onConnected) {
              self.#handlers.onConnected(...args);
            }
          },
          onConnecting() {
            if (!self.#connectingHandlerCalled) {
              if (self.#handlers.onConnecting) {
                self.#handlers.onConnecting();
              }

              self.#connectingHandlerCalled = true;
            }
          },
          onConnectionError(context) {
            self.#connectingHandlerCalled = false;

            context.willReconnect = self.#reconnectionActive;

            if (self.#handlers.onConnectionError) {
              self.#handlers.onConnectionError(context);
            }

            if (context.willReconnect) {
              self._scheduleNewReconnectionAttempt();
            }
          },
          onConnectionTimeout(context) {
            self.#connectingHandlerCalled = false;

            if (self.#handlers.onConnectionTimeout) {
              self.#handlers.onConnectionTimeout(context);
            }

            context.willReconnect = self.#reconnectionActive;
            if (context.willReconnect) {
              self._scheduleNewReconnectionAttempt();
            }
          },
          onDisconnected(context) {
            const { reason } = context;
            const willReconnect = reason !== 'io client disconnect';
            context.willReconnect = willReconnect && self.#reconnectionActive;

            self.#connectingHandlerCalled = false;

            if (self.#handlers.onDisconnected) {
              self.#handlers.onDisconnected(context);
            }

            if (willReconnect) {
              self._scheduleNewReconnectionAttempt();
            }
          },
          onMessage: self.#handlers.onMessage,
        })
    );
  }
}

export default ReconnectingTCPSocket;
