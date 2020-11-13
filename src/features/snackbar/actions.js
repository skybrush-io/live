import { showNotification } from './slice';
import { MessageSemantics } from './types';

export { showNotification };

export function showError(message) {
  return showNotification({
    message,
    semantics: MessageSemantics.ERROR,
  });
}
