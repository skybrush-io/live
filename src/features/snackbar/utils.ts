import { Severity } from '~/model/enums';

import { MessageSemantics } from './types';

/**
 * Converts a message severity level in the Flockwave protocol to a message
 * semantics value.
 */
export function semanticsFromSeverity(severity: Severity): MessageSemantics {
  switch (severity) {
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
