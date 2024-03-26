import { ipcRenderer as ipc } from 'electron-better-ipc';

export { receiveSubscriptionsFromRenderer } from './subscriptions.mjs';

const actionsFromRenderer = {};

export const receiveActionsFromRenderer = (actions) => {
  Object.assign(actionsFromRenderer, actions);
};

export const exposeActionFromRenderer = (name) => {
  ipc.answerMain(name, (...args) => {
    const func = actionsFromRenderer[name];
    if (func) {
      return func(...args);
    } else {
      console.warn(`${name}() action was not exposed from the renderer`);
    }
  });
};

export const setupIpc = () => {
  exposeActionFromRenderer('showAppSettingsDialog');
};
