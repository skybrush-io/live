import { MiniSignal } from 'mini-signals';

type HotkeyAction = { type: string };

const hotkeySignal = new MiniSignal<[HotkeyAction, KeyboardEvent]>();

export const isKeyboardNavigationActive = () => hotkeySignal.hasListeners();

export const sendKeyboardNavigationSignal = (action: HotkeyAction) =>
  (event: KeyboardEvent) =>
    hotkeySignal.dispatch(action, event);

export default hotkeySignal;
