/**
 * @file Event proxies forward events generated from the main process
 * to all renderer processes.
 */

const EventEmitter = require('events');
const betterIpc = require('electron-better-ipc');
const { is } = require('electron-util');

const makeEventProxyChannelName = channel => `__eventProxy[${channel}]`;

const ipc = is.main ? betterIpc.ipcMain : betterIpc.ipcRenderer;

const makeEventProxy = is.main
  ? channel => {
      const emitter = new EventEmitter();
      const realChannel = makeEventProxyChannelName(channel);
      emitter.on('emit', (_, ...args) =>
        ipc.sendToRenderers(realChannel, args)
      );
      return {
        emit: (...args) => emitter.emit('emit', ...args)
      };
    }
  : channel => {
      const emitter = new EventEmitter();
      const realChannel = makeEventProxyChannelName(channel);
      ipc.on(realChannel, (_, args) => {
        emitter.emit(...args);
      });
      return emitter;
    };

module.exports = makeEventProxy;
