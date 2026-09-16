import { type Action } from '@reduxjs/toolkit';
import type React from 'react';

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
  endIcon?: React.ReactNode;
  label: string;
  action: Action | (() => void);
};

/**
 * Object shape for describing the appearance, contents and behavior of a
 * snackbar notification.
 */
export type Notification = {
  message: string;
  buttons?: ToastButton[];
  countdown?: boolean;
  permanent?: boolean;
  semantics?: MessageSemantics;
  timeout?: number;
  topic?: string;
};
