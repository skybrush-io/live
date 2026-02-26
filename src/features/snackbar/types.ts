import { type Action } from '@reduxjs/toolkit';

/**
 * Enum describing the possible semantics that may be associated to a
 * snackbar message.
 */
export enum MessageSemantics {
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  INFO = 'info',
  DEFAULT = 'default',
}

type ToastButton = {
  label: string;
  action: Action;
};

/**
 * Object shape for describing the appearance, contents and behavior of a
 * snackbar notification.
 */
export type Notification = {
  buttons?: ToastButton[];
  header?: string;
  message: string;
  permanent?: boolean;
  semantics?: MessageSemantics;
  timeout?: number;
  topic?: string;
};
