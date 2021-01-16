import isNil from 'lodash-es/isNil';
import { createSelector } from '@reduxjs/toolkit';

import { selectOrdered } from '~/utils/collections';

/**
 * Selector that returns the groups currently defined in the preflight
 * checklist, in the order they should appear on the UI.
 */
export const getPreflightGroupsInOrder = createSelector(
  (state) => state.preflight.groups,
  selectOrdered
);

/**
 * Selector that returns the items currently defined in the preflight
 * checklist, in the order they should appear on the UI.
 */
export const getPreflightItemsInOrder = createSelector(
  (state) => state.preflight.items,
  selectOrdered
);

/**
 * Returns an array containing the order in which headers and items should
 * be presented in a flat preflight checklist. Headers are derived from the
 * groups that the items belong to such that items in the same group are
 * listed next to each other.
 *
 * Headers will be marked with `type: "header"` in the returned array.
 */
export const getHeadersAndItems = createSelector(
  getPreflightGroupsInOrder,
  getPreflightItemsInOrder,
  (groups, items) => {
    const result = items.filter((item) => isNil(item.groupId));

    for (const group of groups) {
      const itemsInGroup = items.filter((item) => item.groupId === group.id);
      if (itemsInGroup.length > 0) {
        result.push(
          {
            type: 'header',
            ...group,
          },
          ...itemsInGroup
        );
      }
    }

    return result;
  }
);

/**
 * Returns an array containing the IDs of all preflight checks that have been
 * ticked by the user.
 */
export const getTickedPreflightCheckItems = (state) => state.preflight.checked;

/**
 * Returns whether all preflight checks have been ticked by the user.
 */
export const areAllPreflightChecksTicked = createSelector(
  getPreflightItemsInOrder,
  (state) => state.preflight.checked,
  (allItems, checkedItems) => allItems.length === checkedItems.length
);

/**
 * Returns a formatted string containing all the preflight check headers and
 * items, suitable to be used in an editor form.
 */
export const getFormattedHeadersAndItems = createSelector(
  getHeadersAndItems,
  (items) =>
    items
      .map((item) => {
        const label = (item.label || '').trim();
        return item.type === 'header'
          ? `\n${label}:`
          : label
          ? `- ${label}`
          : label;
      })
      .join('\n')
      .trim()
);

/**
 * Returns whether there is at least one manual preflight check that has to
 * be ticked off by the user.
 */
export const hasManualPreflightChecks = (state) =>
  state.preflight.items.order.length > 0;
