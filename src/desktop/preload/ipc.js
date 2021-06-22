const { ipcRenderer: ipc } = require('electron-better-ipc');
const { receiveSubscriptionsFromRenderer } = require('./subscriptions');

const actionsFromRenderer = {};

const receiveActionsFromRenderer = (actions) => {
  Object.assign(actionsFromRenderer, actions);
};

const exposeActionFromRenderer = (name) => {
  ipc.answerMain(name, (...args) => {
    const func = actionsFromRenderer[name];
    if (func) {
      return func(...args);
    } else {
      console.warn(`${name}() action was not exposed from the renderer`);
    }
  });
};

const setupIpc = () => {
  exposeActionFromRenderer('showAppSettingsDialog');
};

module.exports = {
  receiveActionsFromRenderer,
  receiveSubscriptionsFromRenderer,
  setupIpc,
};
