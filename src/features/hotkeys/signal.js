import Signal from 'mini-signals';

const hotkeySignal = new Signal();

export const isKeyboardNavigationActive = () =>
  // TODO: Update to `mini-signals@2.0.0`, which explicitly has such a check:
  // https://github.com/Hypercubed/mini-signals/blob/v2.0.0/docs/classes/MiniSignal.md#haslisteners
  hotkeySignal.handlers().length > 0;

export const sendKeyboardNavigationSignal = (action) => (event) =>
  hotkeySignal.dispatch(action, event);

export default hotkeySignal;
