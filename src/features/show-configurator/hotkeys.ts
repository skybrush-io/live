import { type KeyMap } from '~/features/hotkeys/keymap';
import { HotkeyScope } from '~/features/hotkeys/types';

import { clearSelection, selectAllModifiableItems } from './actions';
import { historyRedo, historyUndo } from './slice';

export const keyMap: KeyMap = {
  SHOW_CONFIGURATOR_SELECT_ALL: {
    name: 'Select all modifiable items',
    sequence: 'mod+a',
    scopes: [HotkeyScope.SHOW_CONFIGURATOR],
  },

  SHOW_CONFIGURATOR_SELECT_NONE: {
    name: 'Clear selection',
    sequence: 'Esc',
    scopes: [HotkeyScope.SHOW_CONFIGURATOR],
  },

  SHOW_CONFIGURATOR_UNDO: {
    name: 'Undo the last modification of the show arrangement',
    sequence: 'mod+z',
    scopes: [HotkeyScope.SHOW_CONFIGURATOR],
  },

  SHOW_CONFIGURATOR_REDO: {
    name: 'Redo the last undone modification of the show arrangement',
    sequence: 'mod+y',
    scopes: [HotkeyScope.SHOW_CONFIGURATOR],
  },
};

export const handlers = {
  SHOW_CONFIGURATOR_SELECT_ALL: selectAllModifiableItems,
  SHOW_CONFIGURATOR_SELECT_NONE: clearSelection,
  SHOW_CONFIGURATOR_UNDO: historyUndo,
  SHOW_CONFIGURATOR_REDO: historyRedo,
};
