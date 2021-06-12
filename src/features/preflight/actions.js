import { createCollectionFromArray } from '~/utils/collections';

import { setPreflightCheckListItems } from './slice';

/**
 * Thunk action that takes a string representation of manual preflight checklist
 * items and converts them into the format we need in the store.
 */
export const updateManualPreflightCheckItemsFromString =
  (string) => (dispatch) => {
    let groups = [];
    let items = [];
    let currentGroup = 'General';
    let currentGroupId = 'group0';
    let currentGroupIsEmpty = true;

    function storeCurrentGroup() {
      if (currentGroupIsEmpty) {
        return;
      }

      groups.push({
        label: currentGroup,
        id: currentGroupId,
      });

      currentGroupIsEmpty = true;
      currentGroupId = `group${groups.length}`;
    }

    for (let line of (string || '').split('\n')) {
      line = line.trim();
      if (line.length === 0) {
        continue;
      }

      if (line.charAt(line.length - 1) === ':') {
        /* This line starts a new group */
        storeCurrentGroup();
        currentGroup = line.slice(0, -1).trim();
      } else {
        /* This line is an item */
        while (line.charAt(0) === '-' || line.charAt(0) === ' ') {
          line = line.slice(1);
        }

        if (line.length > 0) {
          items.push({
            label: line,
            id: `item${items.length}`,
            groupId: currentGroupId,
          });
          currentGroupIsEmpty = false;
        }
      }
    }

    storeCurrentGroup();

    groups = createCollectionFromArray(groups);
    items = createCollectionFromArray(items);

    dispatch(setPreflightCheckListItems({ groups, items }));
  };
