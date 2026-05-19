import { createSelector } from '@reduxjs/toolkit';

import { GPSFixType } from '~/model/enums';
import type { RootState } from '~/store/reducers';

import { getUAVIdList, getUAVIdToStateMapping } from './selectors';

export type GpsFleetSummary = {
  minSatellites?: number;
  rtkFixed: number;
  rtkFloat: number;
};

/**
 * Live fleet-wide GPS stats for the UAV list header.
 */
export const getGpsFleetSummary = createSelector(
  getUAVIdToStateMapping,
  getUAVIdList,
  (byId, order): GpsFleetSummary => {
    let rtkFixed = 0;
    let rtkFloat = 0;
    let minSatellites: number | undefined;

    for (const uavId of order) {
      const uav = byId[uavId];
      const gpsFix = uav?.gpsFix;
      if (!gpsFix) {
        continue;
      }

      if (gpsFix.type === GPSFixType.RTK_FIXED) {
        rtkFixed += 1;
      } else if (gpsFix.type === GPSFixType.RTK_FLOAT) {
        rtkFloat += 1;
      }

      const { numSatellites } = gpsFix;
      if (typeof numSatellites === 'number' && Number.isFinite(numSatellites)) {
        minSatellites =
          minSatellites === undefined
            ? numSatellites
            : Math.min(minSatellites, numSatellites);
      }
    }

    return minSatellites === undefined
      ? { rtkFixed, rtkFloat }
      : { rtkFixed, rtkFloat, minSatellites };
  }
);

export const selectGpsFleetSummary = (state: RootState): GpsFleetSummary =>
  getGpsFleetSummary(state);
