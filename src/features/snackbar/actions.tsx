import toast, { type ToastOptions } from 'react-hot-toast';

import Toast from './Toast';
import { MessageSemantics, type Notification } from './types';

const toastStyles: ToastOptions = {
  style: {
    padding: '0px',
  },
  ariaProps: {
    // @ts-expect-error Hack to set Message.style to remove the margin.
    // There seems to be no other, simple way to do this. Using a custom
    // toast would mean we need to reimplement a bunch of things from the
    // lib. Using custom toasts with MUI Snackbar is also not great, we'd
    // need to keep notifications in sync with react-hot-toast...
    style: {
      margin: '0px',
    },
  },
};

export function showNotification(message: string | Notification): void {
  const notification: Notification =
    typeof message === 'string' ? { message } : message;

  const { permanent = false, timeout, topic } = notification;
  const options: ToastOptions = {
    duration: permanent ? Number.POSITIVE_INFINITY : timeout,
    ...(topic ? { id: topic } : undefined),
    ...toastStyles,
  };

  toast(
    ({ id }) => <Toast toastId={id} notification={notification} />,
    options
  );
}

export function showError(
  message: string,
  config?: Omit<Notification, 'message' | 'semantics'>
): void {
  showNotification({
    message,
    semantics: MessageSemantics.ERROR,
    ...config,
  });
}

export function showSuccess(
  message: string,
  config?: Omit<Notification, 'message' | 'semantics'>
): void {
  showNotification({
    message,
    semantics: MessageSemantics.SUCCESS,
    ...config,
  });
}

export function showWarning(
  message: string,
  config?: Omit<Notification, 'message' | 'semantics'>
): void {
  showNotification({
    message,
    semantics: MessageSemantics.WARNING,
    ...config,
  });
}
