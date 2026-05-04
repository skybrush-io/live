import isNil from 'lodash-es/isNil';
import { UAVFilter } from '~/model/filtering';

import { getUAVListSortPreference } from './selectors';
import { updateAppSettings } from './slice';

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
