import { keyMap as siteSurveyKeyMap } from '~/features/site-survey/hotkeys';
import { isRunningOnMac } from '~/utils/platform';

import { HotkeyGroup, HotkeyScope } from './types';

export type KeyMap = Record<
  string,
  // TODO: Use `import { ExtendedKeyMapOptions } from 'react-hotkeys';`!
  { name: string; group?: HotkeyGroup; scopes: HotkeyScope[] } & (
    | { sequence: string }
    | { sequences: string[] }
  )
>;

// TODO: Assign scope to entire objects with a wrapper function instead of
//       individually specifying `GLOBAL` for every item...
const selectionKeyMap: KeyMap = {
  ACTIVATE_SELECTION: {
    name: 'Show properties dialog for selection',
    sequence: 'enter',
    scopes: [HotkeyScope.GLOBAL],
  },

  CLEAR_SELECTION: {
    name: 'Clear selection',
    sequence: 'esc',
    scopes: [HotkeyScope.GLOBAL],
  },

  REMOVE_SELECTION: {
    name: 'Remove selection',
    sequence: 'del',
    scopes: [HotkeyScope.GLOBAL],
  },

  SELECT_ALL_DRONES: {
    name: 'Select all drones',
    sequence: 'mod+a',
    scopes: [HotkeyScope.GLOBAL],
  },

  SELECT_DOWN: {
    name: 'Select next drone (vertically)',
    sequence: 'down',
    group: HotkeyGroup.HIDDEN,
    scopes: [HotkeyScope.GLOBAL],
  },

  SELECT_UP: {
    name: 'Select previous drone (vertically)',
    sequence: 'up',
    group: HotkeyGroup.HIDDEN,
    scopes: [HotkeyScope.GLOBAL],
  },

  SELECT_LEFT: {
    name: 'Select previous drone (horizontally)',
    sequence: 'left',
    group: HotkeyGroup.HIDDEN,
    scopes: [HotkeyScope.GLOBAL],
  },

  SELECT_RIGHT: {
    name: 'Select next drone (horizontally)',
    sequence: 'right',
    group: HotkeyGroup.HIDDEN,
    scopes: [HotkeyScope.GLOBAL],
  },

  SELECT_FIRST: {
    name: 'Select first drone',
    sequence: 'home',
    group: HotkeyGroup.HIDDEN,
    scopes: [HotkeyScope.GLOBAL],
  },

  SELECT_LAST: {
    name: 'Select last drone',
    sequence: 'end',
    group: HotkeyGroup.HIDDEN,
    scopes: [HotkeyScope.GLOBAL],
  },

  PAGE_UP: {
    name: 'Page up',
    sequence: 'pageup',
    group: HotkeyGroup.HIDDEN,
    scopes: [HotkeyScope.GLOBAL],
  },

  PAGE_DOWN: {
    name: 'Page down',
    sequence: 'pagedown',
    group: HotkeyGroup.HIDDEN,
    scopes: [HotkeyScope.GLOBAL],
  },
};

const toggleOptionKeyMap: KeyMap = {
  TOGGLE_BROADCAST_MODE_LEGACY: {
    name: 'Toggle the broadcast mode switch (legacy version)',
    sequence: 'mod+b',
    group: HotkeyGroup.HIDDEN,
    scopes: [HotkeyScope.GLOBAL],
  },

  TOGGLE_BROADCAST_MODE: {
    name: 'Toggle the broadcast mode switch',
    sequence: 'b',
    scopes: [HotkeyScope.GLOBAL],
  },

  TOGGLE_PREFERRED_CHANNEL: {
    name: 'Toggle the preferred channel switch',
    sequence: 'c',
    scopes: [HotkeyScope.GLOBAL],
  },

  TOGGLE_DEVELOPER_MODE: {
    name: 'Toggle the developer mode switch',
    sequence: 'mod+shift+d',
    group: HotkeyGroup.HIDDEN,
    scopes: [HotkeyScope.GLOBAL],
  },

  TOGGLE_SORT_BY_MISSION_ID: {
    name: 'Toggle sorting UAVs by mission IDs',
    sequence: 'mod+s',
    scopes: [HotkeyScope.GLOBAL],
  },
};

const sendCommandKeyMap: KeyMap = {
  SEND_FLASH_LIGHTS_COMMAND: {
    name: 'Flash lights on selected UAVs',
    sequence: 'w',
    scopes: [HotkeyScope.GLOBAL],
  },

  SEND_TAKEOFF_COMMAND: {
    name: 'Send takeoff command to selection',
    sequence: 'mod+alt+t',
    scopes: [HotkeyScope.GLOBAL],
  },

  SEND_LANDING_COMMAND: {
    name: 'Send landing command to selection',
    sequence: 'mod+alt+l',
    scopes: [HotkeyScope.GLOBAL],
  },

  SEND_POSITION_HOLD_COMMAND: {
    name: 'Send position hold command to selection',
    sequence: 'mod+alt+p',
    scopes: [HotkeyScope.GLOBAL],
  },

  SEND_RTH_COMMAND: {
    name: 'Send return to home command to selection',
    sequence: 'mod+alt+r',
    scopes: [HotkeyScope.GLOBAL],
  },
};

const uavIdOverlayKeyMap: KeyMap = {
  TYPE_S: {
    name: 'Prepend S to the pending UAV ID',
    sequence: 's',
    group: HotkeyGroup.HIDDEN,
    scopes: [HotkeyScope.GLOBAL],
  },

  TYPE_MINUS: {
    name: 'Define a range of pending UAV IDs',
    sequence: '-',
    group: HotkeyGroup.HIDDEN,
    scopes: [HotkeyScope.GLOBAL],
  },

  DELETE_LAST_CHARACTER: {
    name: 'Delete last character of pending UAV ID',
    sequence: 'backspace',
    group: HotkeyGroup.HIDDEN,
    scopes: [HotkeyScope.GLOBAL],
  },

  ...Object.fromEntries(
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => [
      `TYPE_${number}`,
      {
        name: `Append ${number} to the pending UAV ID`,
        sequence: String(number),
        group: HotkeyGroup.HIDDEN,
        scopes: [HotkeyScope.GLOBAL],
      },
    ])
  ),
};

const keyMap: KeyMap = {
  ...selectionKeyMap,
  ...toggleOptionKeyMap,
  ...sendCommandKeyMap,
  ...uavIdOverlayKeyMap,
  ...siteSurveyKeyMap,

  CLEAR_STORED_SETTINGS: {
    name: 'Clear stored settings and reload',
    sequence: 'mod+alt+c',
    scopes: [HotkeyScope.GLOBAL],
  },

  COPY_COORDINATES: {
    name: 'Copy coordinates to clipboard',
    sequence: 'mod+shift+c',
    scopes: [HotkeyScope.GLOBAL],
  },

  SHOW_HOTKEY_DIALOG: {
    name: 'Show hotkeys',
    sequence: '?',
    group: HotkeyGroup.HIDDEN,
    scopes: [HotkeyScope.GLOBAL, HotkeyScope.SITE_SURVEY],
  },
};

// We need to replace "mod" with "meta" on macOS and "ctrl" everywhere else
// until react-hotkeys starts supporting the "mod" modifier from Mousetrap
const platModKey = isRunningOnMac ? 'meta+' : 'ctrl+';
const platformize = (key: string): string => key.replace('mod+', platModKey);

const fixModifiersInKeyMap = (keyMap: KeyMap): void => {
  for (const definition of Object.values(keyMap)) {
    if ('sequence' in definition) {
      definition.sequence = platformize(definition.sequence);
    } else if (Array.isArray(definition.sequences)) {
      definition.sequences = definition.sequences.map(platformize);
    }
  }
};

fixModifiersInKeyMap(keyMap);

export default keyMap;
