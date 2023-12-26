import { MiniSignal } from 'mini-signals';

const hotkeySignal = new MiniSignal();

export const isKeyboardNavigationActive = () => hotkeySignal.hasListeners();

export const sendKeyboardNavigationSignal = (action) => (event) =>
  hotkeySignal.dispatch(action, event);

export default hotkeySignal;
