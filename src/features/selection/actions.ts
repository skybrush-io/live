import i18n from '~/i18n';
import type { AppThunk } from '~/store/reducers';
import {
  firstUnusedNumericId,
  getItemById,
  type Identifier,
} from '~/utils/collections';
import { getSelection, getSelectionGroups } from './selectors';
import { _addGroup, updateGroup } from './slice';

export const saveCurrentSelectionAsGroupIfNotEmpty =
  (id: Identifier | undefined = undefined): AppThunk =>
  (dispatch, getState) => {
    const state = getState();
    const selectedIds = getSelection(state);
    if (selectedIds.length === 0) {
      return;
    }

    const groups = getSelectionGroups(state);
    id ??= firstUnusedNumericId(groups);
    const group = getItemById(groups, id);
    if (group === undefined) {
      const name = i18n.t('selectionGroups.newGroupNameTemplate', { id });
      dispatch(_addGroup({ id, data: { name, ids: selectedIds } }));
    } else {
      dispatch(updateGroup({ id, data: { ids: selectedIds } }));
    }
  };
