/**
 * @file Event proxies forward events generated from the main process
 * to all renderer processes.
 */

const EventEmitter = require('events');
const betterIpc = require('electron-better-ipc');
const process = require('process');

const makeEventProxyChannelName = (channel) => `__eventProxy[${channel}]`;

const isMain = process.type === 'browser';
const ipc = isMain ? betterIpc.ipcMain : betterIpc.ipcRenderer;

const makeEventProxy = isMain
  ? (channel) => {
      const emitter = new EventEmitter();
      const realChannel = makeEventProxyChannelName(channel);
      emitter.on('emit', (_, ...args) =>
        ipc.sendToRenderers(realChannel, args)
      );
      return {
        emit: (...args) => emitter.emit('emit', ...args),
      };
    }
  : (channel) => {
      const emitter = new EventEmitter();
      const realChannel = makeEventProxyChannelName(channel);
      ipc.on(realChannel, (_, args) => {
        emitter.emit(...args);
      });
      return emitter;
    };

module.exports = makeEventProxy;
