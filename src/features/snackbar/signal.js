import Signal from 'mini-signals';

const snackbarSignal = new Signal();

export const sendSnackbarSignal = (notification) =>
  snackbarSignal.dispatch(notification);

export default snackbarSignal;
