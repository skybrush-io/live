import { MiniSignal } from 'mini-signals';

const snackbarSignal = new MiniSignal<[string | Notification]>();

export const sendSnackbarSignal = (
  notification: string | Notification
): void => {
  snackbarSignal.dispatch(notification);
};

export default snackbarSignal;
