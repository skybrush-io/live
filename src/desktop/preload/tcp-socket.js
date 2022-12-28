const net = require('net');

class TCPSocket {
  #buffer = '';
  #socket = new net.Socket();
  #timeoutId;

  constructor(
    { address, port },
    {
      connectTimeout,
      onClose,
      onConnecting,
      onConnectionError,
      onConnectionTimeout,
      onDisconnected,
      onMessage,
      url,
    }
  ) {
    this.#socket.on('connect', () => {
      // The `onConnected` callback is handled in the TCPSocketConnection class
      // instead of here to avoid showing "Connected" as soon as the TCP socket
      // opens, as that can be misleading, when proper communication cannot
      // actually be established with the server.
      if (this.#timeoutId) {
        clearTimeout(this.#timeoutId);
      }
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
      onConnectionError(url, error);
    });
    this.#socket.on('end', () => {
      onDisconnected(url, 'io server disconnect');
    });
    this.#socket.on('close', onClose);

    this.#socket.connect(port, address);
    onConnecting();
    this.#timeoutId = setTimeout(() => {
      onConnectionTimeout(url);
    }, connectTimeout);
  }

  emit(_type, message) {
    this.#socket.write(JSON.stringify(message) + '\n');
  }

  end() {
    this.#socket.end();
  }
}

module.exports = TCPSocket;
