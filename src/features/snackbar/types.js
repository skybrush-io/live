/**
 * Enum describing the possible semantics that may be associated to a
 * snackbar message.
 */
export const MessageSemantics = {
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  INFO: 'info',
  DEFAULT: 'default',
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

const _semanticsToEmoji = {
  [MessageSemantics.SUCCESS]: '\u2705',
  [MessageSemantics.ERROR]: '\uD83D\uDED1',
  [MessageSemantics.WARNING]: '\u26A0',
  [MessageSemantics.INFO]: '\uD83D\uDCA1',
  [MessageSemantics.DEFAULT]: '',
};

/**
 * Converts a message semantics value to an emoji that can be used to represent
 * that severity level in text.
 */
export function semanticsToEmoji(semantics) {
  return _semanticsToEmoji[semantics] || '';
}
