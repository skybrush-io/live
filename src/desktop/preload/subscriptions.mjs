import { ipcRenderer as ipc } from 'electron-better-ipc';

let subscriptionsReceived = false;

export const receiveSubscriptionsFromRenderer = (subscriptions) => {
  if (subscriptionsReceived) {
    throw new Error('Subscriptions were already received from the renderer');
  }

  subscriptionsReceived = true;
  setupSubscriptions(subscriptions);
};

const setupSubscriptions = ({ shouldPreventSleepMode }) => {
  shouldPreventSleepMode(async (newValue) => {
    await ipc.callMain('powerSaving.setSleepModePrevented', newValue);
  });
};
