import { isRunningOnMac } from '~/utils/platform';

/** Special marker for hotkeys that are supposed to be hidden from the user */
export const HIDDEN = '_hidden';

const globalKeyMap = {
  CLEAR_SELECTION: {
    name: 'Clear selection',
    sequence: 'esc',
  },

  CLEAR_STORED_SETTINGS: {
    name: 'Clear stored settings and reload',
    sequence: 'mod+alt+c',
  },

  COPY_COORDINATES: {
    name: 'Copy coordinates to clipboard',
    sequence: 'mod+shift+c',
  },

  SELECT_ALL_DRONES: {
    name: 'Select all drones',
    sequence: 'mod+a',
  },

  SELECT_FIRST: {
    name: 'Select first drone',
    sequence: 'home',
    group: HIDDEN,
  },

  SELECT_LAST: {
    name: 'Select last drone',
    sequence: 'end',
    group: HIDDEN,
  },

  SELECT_NEXT: {
    name: 'Select next drone',
    sequence: 'down',
    group: HIDDEN,
  },

  SELECT_PREVIOUS: {
    name: 'Select previous drone',
    sequence: 'up',
    group: HIDDEN,
  },

  SEND_FLASH_LIGHTS_COMMAND: {
    name: 'Flash lights on selected UAVs',
    sequence: 'w',
  },

  SEND_TAKEOFF_COMMAND: {
    name: 'Send takeoff command to selection',
    sequence: 'mod+alt+t',
  },

  SEND_LANDING_COMMAND: {
    name: 'Send landing command to selection',
    sequence: 'mod+alt+l',
  },

  SEND_RTH_COMMAND: {
    name: 'Send return to home command to selection',
    sequence: 'mod+alt+r',
  },

  SHOW_HOTKEY_DIALOG: {
    name: 'Show hotkeys',
    sequence: '?',
    group: HIDDEN,
  },
};

// We need to replace "mod" with "meta" on macOS and "ctrl" everywhere else
// until react-hotkeys starts supporting the "mod" modifier from Mousetrap
const platModKey = isRunningOnMac ? 'meta+' : 'ctrl+';
const platformize = (key) => key.replace('mod+', platModKey);

function fixModifiersInKeyMap(keyMap) {
  for (const definition of Object.values(keyMap)) {
    if (definition.sequence) {
      definition.sequence = platformize(definition.sequence);
    } else if (Array.isArray(definition.sequences)) {
      definition.sequences = definition.sequences.map(platformize);
    }
  }

  return keyMap;
}

fixModifiersInKeyMap(globalKeyMap);

export default globalKeyMap;
