/**
 * @file Slice of the state object that stores the list of manual preflight checks
 * defined by the user and whether they have been ticked off or not.
 */

import { createSlice } from '@reduxjs/toolkit';

import { clearOrderedCollection } from '~/utils/collections';

const { actions, reducer } = createSlice({
  name: 'docks',

  initialState: {
    groups: {
      byId: {
        // Here's how an example item should look like:
        // {
        //   id: 'weather',
        //   label: 'Weather'
        // }
        weather: {
          id: 'weather',
          label: 'Weather',
        },
        permissions: {
          id: 'permissions',
          label: 'Permissions',
        },
        equipment: {
          id: 'equipment',
          label: 'Equipment',
        },
        environment: {
          id: 'environment',
          label: 'Environment',
        },
      },
      order: ['weather', 'permissions', 'equipment', 'environment'],
    },

    items: {
      byId: {
        // Here's how an example item should look like:
        // {
        //   id: 'some-id-to-refer-to-the-preflight-check',
        //   label: 'Check whether the propellers are mounted',
        //   groupId: 'some-group'
        // }
        'weather-wind-speed': {
          id: 'weather-wind-speed',
          label: 'Wind speed is within an acceptable range',
          groupId: 'weather',
        },
        'weather-visibility': {
          id: 'weather-visibility',
          label: 'Visibility sufficient for flight',
          groupId: 'weather',
        },
        'weather-precipitation': {
          id: 'weather-precipitation',
          label: 'Precipitation within acceptable range',
          groupId: 'weather',
        },
        'planetary-k-index': {
          id: 'planetary-k-index',
          label: 'No geomagnetic storms indicated by Kp-index',
          groupId: 'weather',
        },
        'permissions-drone-pilot-license': {
          id: 'permissions-drone-pilot-license',
          label: 'Drone pilot license is valid',
          groupId: 'permissions',
        },
        'permissions-airspace-authorization': {
          id: 'permissions-airspace-authorization',
          label: 'Airspace authorization has been obtained',
          groupId: 'permissions',
        },
        'equipment-rc-charged': {
          id: 'equipment-rc-charged',
          label: 'Remote controller batteries are charged',
          groupId: 'equipment',
        },
        'equipment-propellers-mounted': {
          id: 'equipment-propellers-mounted',
          label: 'Drone propellers are securely mounted',
          groupId: 'equipment',
        },
        'equipment-no-visible-damage': {
          id: 'equipment-no-visible-damage',
          label: 'No visible damage on drone components',
          groupId: 'equipment',
        },
        'environment-no-obstructions': {
          id: 'environment-no-obstructions',
          label: 'No obstructions in takeoff area',
          groupId: 'environment',
        },
        'environment-cordoned-off': {
          id: 'environment-cordoned-off',
          label: 'Takeoff and landing area cordoned off',
          groupId: 'environment',
        },
        'environment-flight-path-clear': {
          id: 'environment-flight-path-clear',
          label: 'No people below flight paths',
          groupId: 'environment',
        },
      },
      order: [
        'weather-wind-speed',
        'weather-visibility',
        'weather-precipitation',
        'permissions-drone-pilot-license',
        'permissions-airspace-authorization',
        'equipment-rc-charged',
        'equipment-propellers-mounted',
        'equipment-no-visible-damage',
        'environment-no-obstructions',
        'environment-cordoned-off',
        'environment-flight-path-clear',
      ],
    },

    checked: [],
  },

  reducers: {
    /**
     * Clears all preflight check groups.
     */
    clearPreflightCheckGroups(state) {
      clearOrderedCollection(state.items);
      clearOrderedCollection(state.groups);
      state.checked = [];
    },

    /**
     * Clears the list of preflight checks.
     */
    clearPreflightCheckListItems(state) {
      clearOrderedCollection(state.items);
      state.checked = [];
    },

    /**
     * Sets the list of preflight checks and groups.
     */
    setPreflightCheckListItems(state, action) {
      const { groups, items } = action.payload;

      if (!groups.byId || !groups.order || !items.byId || !items.order) {
        return;
      }

      state.items = {
        byId: items.byId,
        order: items.order,
      };

      state.groups = {
        byId: groups.byId,
        order: groups.order,
      };

      state.checked = [];
    },

    /**
     * Sets the checked status of a preflight check.
     */
    setPreflightCheckStatus(state, action) {
      const { id, checked } = action.payload;
      const item = state.items.byId[id];
      const index = state.checked.indexOf(id);

      if (item) {
        if (checked && index < 0) {
          state.checked.push(id);
        } else if (!checked && index >= 0) {
          state.checked.splice(index, 1);
        }
      }
    },

    /**
     * Toggles the checked status of a preflight check.
     */
    togglePreflightCheckStatus(state, action) {
      const id = action.payload;
      const item = state.items.byId[id];
      const index = state.checked.indexOf(id);

      if (item) {
        if (index < 0) {
          state.checked.push(id);
        } else if (index >= 0) {
          state.checked.splice(index, 1);
        }
      }
    },
  },
});

export const {
  clearPreflightCheckGroups,
  clearPreflightCheckListItems,
  setPreflightCheckListItems,
  setPreflightCheckStatus,
  togglePreflightCheckStatus,
} = actions;

export default reducer;
