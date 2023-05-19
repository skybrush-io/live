import { createSelector } from '@reduxjs/toolkit';

import { Status } from '~/components/semantics';
import {
  errorSeverityToSemantics,
  getSeverityOfMostSevereErrorCode,
} from '~/flockwave/errors';
import { selectOrdered } from '~/utils/collections';

/**
 * Selector that calculates and caches the list of all the local positioning
 * systems that we store in the state object, in exactly the same order as they
 * should appear on the UI.
 */
export const getLocalPositioningSystemsInOrder = createSelector(
  (state) => state.lps,
  selectOrdered
);

/**
 * Function that returns the name of the given LPS that should be shown to
 * the user on the UI.
 */
export const getLocalPositioningSystemDisplayName = (lps) =>
  (lps ? lps.name || lps.id : null) || 'Unnamed positioning system';

/**
 * Function that returns a status code for the given LPS. This can be used on
 * the UI for status lights.
 */
export function getLocalPositioningSystemStatus(lps) {
  let severity = -1;

  if (lps.errors && Array.isArray(lps.errors) && lps.errors.length > 0) {
    severity = getSeverityOfMostSevereErrorCode(lps.errors);
    return errorSeverityToSemantics(severity);
  }

  return Status.SUCCESS;
}
