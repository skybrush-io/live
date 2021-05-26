import { isRunningOnMac } from '~/utils/platform';

const keyMap = {
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
  },
};

// We need to replace "mod" with "meta" on macOS and "ctrl" everywhere else
// until react-hotkeys starts supporting the "mod" modifier from Mousetrap
const platModKey = isRunningOnMac ? 'meta+' : 'ctrl+';
const platformize = (key) => key.replace('mod+', platModKey);
for (const definition of Object.values(keyMap)) {
  if (definition.sequence) {
    definition.sequence = platformize(definition.sequence);
  } else if (Array.isArray(definition.sequences)) {
    definition.sequences = definition.sequences.map(platformize);
  }
}

export default keyMap;
