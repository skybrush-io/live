import Signal from 'mini-signals';

const hotkeySignal = new Signal();

export const sendKeyboardNavigationSignal = (action) => (event) =>
  hotkeySignal.dispatch(action, event);

export default hotkeySignal;
