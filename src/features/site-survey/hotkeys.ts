import { type KeyMap } from '~/features/hotkeys/keymap';
import { HotkeyScope } from '~/features/hotkeys/types';

import { clearSelection, selectAllModifiableItems } from './actions';
import { historyRedo, historyUndo } from './state';

export const keyMap: KeyMap = {
  SITE_SURVEY_SELECT_ALL: {
    name: 'Select all modifiable items',
    sequence: 'mod+a',
    scopes: [HotkeyScope.SITE_SURVEY],
  },

  SITE_SURVEY_SELECT_NONE: {
    name: 'Clear selection',
    sequence: 'Esc',
    scopes: [HotkeyScope.SITE_SURVEY],
  },

  SITE_SURVEY_UNDO: {
    name: 'Undo the last modification of the show arrangement',
    sequence: 'mod+z',
    scopes: [HotkeyScope.SITE_SURVEY],
  },

  SITE_SURVEY_REDO: {
    name: 'Redo the last undone modification of the show arrangement',
    sequence: 'mod+y',
    scopes: [HotkeyScope.SITE_SURVEY],
  },
};

export const handlers = {
  SITE_SURVEY_SELECT_ALL: selectAllModifiableItems,
  SITE_SURVEY_SELECT_NONE: clearSelection,
  SITE_SURVEY_UNDO: historyUndo,
  SITE_SURVEY_REDO: historyRedo,
};
