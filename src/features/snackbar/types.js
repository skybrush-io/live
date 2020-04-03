/**
 * Enum describing the possible semantics that may be associated to a
 * snackbar message.
 */
export const MessageSemantics = {
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  INFO: 'info',
  DEFAULT: 'default'
};

/**
 * Converts a message severity level in the Flockwave protocol to a message
 * semantics value.
 */
export function semanticsFromSeverity(severity) {
  switch ((severity || '').toLowerCase()) {
    case 'error':
    case 'critical':
      return MessageSemantics.ERROR;

    case 'warning':
    case 'warn':
      return MessageSemantics.WARNING;

    case 'info':
      return MessageSemantics.INFO;

    default:
      return MessageSemantics.DEFAULT;
  }
}
