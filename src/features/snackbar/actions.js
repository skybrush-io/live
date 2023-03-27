import { sendSnackbarSignal } from './signal';
import { MessageSemantics } from './types';

export const showNotification = (notification) => (_dispatch, _getState) => {
  sendSnackbarSignal(
    typeof notification === 'string' ? { message: notification } : notification
  );
};

export function showError(message) {
  return showNotification({
    message,
    semantics: MessageSemantics.ERROR,
  });
}

export function showSuccess(message) {
  return showNotification({
    message,
    semantics: MessageSemantics.SUCCESS,
  });
}
