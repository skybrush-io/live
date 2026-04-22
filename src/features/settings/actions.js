import isNil from 'lodash-es/isNil';
import { UAVFilter } from '~/model/filtering';
import { UAVSortKey } from '~/model/sorting';

import {
  getUAVListSortPreference,
  isShowingMissionIds,
} from './selectors';
import { toggleMissionIds, updateAppSettings } from './slice';

import { actions as dialogActions } from './dialog';

export const {
  closeAppSettingsDialog,
  setAppSettingsDialogTab,
  showAppSettingsDialog,
  toggleAppSettingsDialog,
} = dialogActions;

export function setSingleUAVListFilter(filter) {
  return (dispatch) => {
    dispatch(
      updateAppSettings('display', {
        uavListFilters:
          isNil(filter) || filter === UAVFilter.DEFAULT ? [] : [filter],
      })
    );
  };
}

export function setUAVListSortPreference({ key, reverse } = {}) {
  return (dispatch, getState) => {
    const currentSort = getUAVListSortPreference(getState());
    const updates = {};
    let changed = false;

    if (key && typeof key === 'string' && key.length > 0) {
      updates.key = key;
      changed = true;
    }

    if (reverse !== undefined && reverse !== null) {
      updates.reverse = Boolean(reverse);
      changed = true;
    }

    if (changed) {
      dispatch(
        updateAppSettings('display', {
          uavListSortPreference: { ...currentSort, ...updates },
        })
      );
    }
  };
}

export function toggleUAVListSortDirection() {
  return (dispatch, getState) => {
    const currentSort = getUAVListSortPreference(getState());
    dispatch(
      updateAppSettings('display', {
        uavListSortPreference: {
          ...currentSort,
          reverse: !currentSort.reverse,
        },
      })
    );
  };
}

/**
 * Toggles the UAV list between "Normal view" (primary UAV IDs) and
 * "Mission view" (primary mission IDs). When the current UAV list sort key
 * is the other view's natural key (UAV ID <-> mission ID, or the legacy
 * DEFAULT value), it is swapped to match the new view's natural key so that
 * the first column in the list header always reflects the active sort.
 * Any other sort key (battery, RSSI, etc.) is preserved.
 */
export function toggleMissionIdsAndSyncSort() {
  return (dispatch, getState) => {
    const willShowMissionIds = !isShowingMissionIds(getState());
    dispatch(toggleMissionIds());

    const currentSort = getUAVListSortPreference(getState());
    const { key } = currentSort;
    const naturalKey = willShowMissionIds
      ? UAVSortKey.MISSION_ID
      : UAVSortKey.UAV_ID;
    const isNaturalOrderKey =
      key === UAVSortKey.UAV_ID ||
      key === UAVSortKey.MISSION_ID ||
      key === UAVSortKey.DEFAULT;

    if (isNaturalOrderKey && key !== naturalKey) {
      dispatch(
        updateAppSettings('display', {
          uavListSortPreference: { ...currentSort, key: naturalKey },
        })
      );
    }
  };
}

export function updateUAVVoltageThreshold(name, value) {
  return (dispatch, getState) => {
    const state = getState();
    let { fullChargeVoltage, lowVoltageThreshold, criticalVoltageThreshold } =
      state.settings.uavs;

    switch (name) {
      case 'criticalVoltageThreshold': {
        criticalVoltageThreshold = value;
        lowVoltageThreshold = Math.max(
          criticalVoltageThreshold,
          lowVoltageThreshold
        );
        fullChargeVoltage = Math.max(lowVoltageThreshold, fullChargeVoltage);

        break;
      }

      case 'lowVoltageThreshold': {
        lowVoltageThreshold = value;
        fullChargeVoltage = Math.max(lowVoltageThreshold, fullChargeVoltage);
        criticalVoltageThreshold = Math.min(
          lowVoltageThreshold,
          criticalVoltageThreshold
        );

        break;
      }

      case 'fullChargeVoltage': {
        fullChargeVoltage = value;
        lowVoltageThreshold = Math.min(fullChargeVoltage, lowVoltageThreshold);
        criticalVoltageThreshold = Math.min(
          lowVoltageThreshold,
          criticalVoltageThreshold
        );

        break;
      }
      // No default
    }

    dispatch(
      updateAppSettings('uavs', {
        fullChargeVoltage,
        lowVoltageThreshold,
        criticalVoltageThreshold,
      })
    );
  };
}
