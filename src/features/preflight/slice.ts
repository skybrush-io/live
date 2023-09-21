/**
 * @file Slice of the state object that stores the list of manual preflight checks
 * defined by the user and whether they have been ticked off or not.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import {
  clearOrderedCollection,
  type Collection,
  createCollectionFromArray,
  type Identifier,
} from '~/utils/collections';

import { type PreflightCheckGroup, type PreflightCheckItem } from './types';

type PreflightSliceState = ReadonlyDeep<{
  groups: Collection<PreflightCheckGroup>;
  items: Collection<PreflightCheckItem>;
  checked: Identifier[];
}>;

const defaultGroups: PreflightCheckGroup[] = [
  {
    id: 'weather',
    label: 'Weather',
  },
  {
    id: 'permissions',
    label: 'Permissions',
  },
  {
    id: 'equipment',
    label: 'Equipment',
  },
  {
    id: 'environment',
    label: 'Environment',
  },
];

const defaultItems: PreflightCheckItem[] = [
  {
    id: 'weather-wind-speed',
    label: 'Wind speed is within an acceptable range',
    groupId: 'weather',
  },
  {
    id: 'weather-visibility',
    label: 'Visibility sufficient for flight',
    groupId: 'weather',
  },
  {
    id: 'weather-precipitation',
    label: 'Precipitation within acceptable range',
    groupId: 'weather',
  },
  {
    id: 'planetary-k-index',
    label: 'No geomagnetic storms indicated by Kp-index',
    groupId: 'weather',
  },
  {
    id: 'permissions-drone-pilot-license',
    label: 'Drone pilot license is valid',
    groupId: 'permissions',
  },
  {
    id: 'permissions-airspace-authorization',
    label: 'Airspace authorization has been obtained',
    groupId: 'permissions',
  },
  {
    id: 'equipment-rc-charged',
    label: 'Remote controller batteries are charged',
    groupId: 'equipment',
  },
  {
    id: 'equipment-propellers-mounted',
    label: 'Drone propellers are securely mounted',
    groupId: 'equipment',
  },
  {
    id: 'equipment-no-visible-damage',
    label: 'No visible damage on drone components',
    groupId: 'equipment',
  },
  {
    id: 'environment-no-obstructions',
    label: 'No obstructions in takeoff area',
    groupId: 'environment',
  },
  {
    id: 'environment-cordoned-off',
    label: 'Takeoff and landing area cordoned off',
    groupId: 'environment',
  },
  {
    id: 'environment-flight-path-clear',
    label: 'No people below flight paths',
    groupId: 'environment',
  },
];

const initialState: PreflightSliceState = {
  // Here's how an example group should look like:
  // {
  //   id: 'weather',
  //   label: 'Weather'
  // }
  groups: createCollectionFromArray(defaultGroups),

  // Here's how an example item should look like:
  // {
  //   id: 'some-id-to-refer-to-the-preflight-check',
  //   label: 'Check whether the propellers are mounted',
  //   groupId: 'some-group'
  // }
  items: createCollectionFromArray(defaultItems),

  checked: [],
};

const { actions, reducer } = createSlice({
  name: 'preflight',
  initialState,
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
    setPreflightCheckListItems(
      state,
      action: PayloadAction<{
        groups: Collection<PreflightCheckGroup>;
        items: Collection<PreflightCheckItem>;
      }>
    ) {
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
    setPreflightCheckStatus(
      state,
      action: PayloadAction<{ id: Identifier; checked: boolean }>
    ) {
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
    togglePreflightCheckStatus(state, action: PayloadAction<Identifier>) {
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
