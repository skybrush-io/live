import { sendSnackbarSignal } from './signal';
import { MessageSemantics, type Notification } from './types';

import type { AppThunk } from '~/store/reducers';

export function showNotification(
  notification: string | Notification
): AppThunk {
  return () => {
    sendSnackbarSignal(
      typeof notification === 'string'
        ? { message: notification }
        : notification
    );
  };
}

export function showError(message: string): AppThunk {
  return showNotification({
    message,
    semantics: MessageSemantics.ERROR,
  });
}

export function showSuccess(message: string): AppThunk {
  return showNotification({
    message,
    semantics: MessageSemantics.SUCCESS,
  });
}
