import { Severity } from '~/model/enums';

import { MessageSemantics } from './types';

/**
 * Converts a message severity level in the Flockwave protocol to a message
 * semantics value.
 */
export function semanticsFromSeverity(severity: Severity): MessageSemantics {
  switch ((severity || '').toLowerCase()) {
    case Severity.ERROR:
    case Severity.CRITICAL:
      return MessageSemantics.ERROR;

    case Severity.WARNING:
      return MessageSemantics.WARNING;

    case Severity.INFO:
      return MessageSemantics.INFO;

    default:
      return MessageSemantics.DEFAULT;
  }
}

const emojisForSemantics = {
  [MessageSemantics.SUCCESS]: '✅',
  [MessageSemantics.ERROR]: '🛑',
  [MessageSemantics.WARNING]: '⚠',
  [MessageSemantics.INFO]: '💡',
  [MessageSemantics.DEFAULT]: '',
};

/**
 * Converts a message semantics value to an emoji that can be used to represent
 * that severity level in text.
 */
export function semanticsToEmoji(semantics: MessageSemantics): string {
  return emojisForSemantics[semantics] || '';
}
