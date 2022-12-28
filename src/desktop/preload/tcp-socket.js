const net = require('net');

class TCPSocket {
  #buffer = '';
  #connected = false;
  #endedByUs = false;
  #pendingError;
  #socket = new net.Socket();
  #timeoutId;

  constructor(
    { address, port },
    {
      connectTimeout,
      onConnecting,
      onConnectionError,
      onConnectionTimeout,
      onDisconnected,
      onMessage,
      url,
    }
  ) {
    this._clearTimeout = this._clearTimeout.bind(this);

    this.#socket.on('connect', () => {
      this._clearTimeout();
      this.#connected = true;
    });
    this.#socket.on('data', (data) => {
      this.#buffer += data.toString();
      const messages = this.#buffer.split('\n');
      this.#buffer = messages.pop();
      for (const message of messages) {
        onMessage(JSON.parse(message));
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
      const wasEndedByUs = this.#endedByUs;

      this.#pendingError = undefined;
      this.#connected = false;
      this.#endedByUs = false;

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
        if (!wasEndedByUs) {
          onDisconnected({ url, reason: 'io server disconnect' });
        }
      }
    });

    this.#socket.connect(port, address);
    onConnecting({ url });

    this.#timeoutId = setTimeout(() => {
      onConnectionTimeout({ url });
    }, connectTimeout);
  }

  emit(_type, message) {
    this.#socket.write(JSON.stringify(message) + '\n');
  }

  end() {
    this.#endedByUs = true;
    this.#socket.end();
  }

  _clearTimeout() {
    // The `onConnected` callback is handled in the TCPSocketConnection class
    // instead of here to avoid showing "Connected" as soon as the TCP socket
    // opens, as that can be misleading, when proper communication cannot
    // actually be established with the server.
    if (this.#timeoutId) {
      clearTimeout(this.#timeoutId);
      this.#timeoutId = undefined;
    }
  }
}

module.exports = TCPSocket;
