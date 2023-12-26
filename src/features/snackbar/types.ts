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

/**
 * Object shape for describing the appearance, contents and behavior of a
 * snackbar notification.
 */
export type Notification = {
  buttons?: Array<{
    label: string;
    action: Action;
  }>;
  header: string;
  message: string;
  permanent: boolean;
  semantics: MessageSemantics;
};
