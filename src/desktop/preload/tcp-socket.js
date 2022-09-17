const net = require('net');

class TCPSocket {
  constructor(
    { address, port },
    { connectionTimeoutLength },
    {
      onConnected,
      onConnecting,
      onConnectionError,
      onConnectionTimeout,
      onDisconnected,
      onMessage,
      url,
    }
  ) {
    this._socket = new net.Socket();
    this._buffer = '';

    this._socket.on('connect', () => {
      onConnected(url);
      if (this._timeout) {
        clearTimeout(this._timeout);
      }
    });
    this._socket.on('data', (data) => {
      this._buffer += data.toString();
      const messages = this._buffer.split('\n');
      this._buffer = messages.pop();
      for (const message of messages) {
        onMessage(JSON.parse(message));
      }
    });

    this._socket.on('error', (error) => {
      onConnectionError(url, error);
    });
    this._socket.on('end', () => {
      onDisconnected(url);
    });
    this._socket.on('close', () => {
      onDisconnected(url);
    });

    this._socket.connect(port, address);
    onConnecting(url);
    this._timeout = setTimeout(() => {
      onConnectionTimeout(url);
    }, connectionTimeoutLength);
  }

  emit(_type, message) {
    this._socket.write(JSON.stringify(message) + '\n');
  }

  end() {
    this._socket.end();
  }
}

module.exports = TCPSocket;
