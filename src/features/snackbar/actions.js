import { showNotification } from './slice';
import { MessageSemantics } from './types';

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

export { showNotification } from './slice';
