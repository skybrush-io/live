import isNil from 'lodash-es/isNil';
import memoize from 'memoizee';

import { type StoredUAV } from '~/features/uavs/types';
import { type PreparedI18nKey, tt } from '~/i18n';

import { GPSFixType } from './enums';

export type Comparable = number | string;

/**
 * Enum that describes the possible sorting keys for a list that shows
 * UAVs.
 */
export enum UAVSortKey {
  DEFAULT = 'default',
  STATUS = 'status',
  FLIGHT_MODE = 'flightMode',
  BATTERY = 'battery',
  GPS_FIX = 'gpsFix',
  ALTITUDE_MSL = 'amsl',
  ALTITUDE_HOME = 'ahl',
  ALTITUDE_GROUND = 'agl',
  HEADING = 'heading',
  RSSI = 'rssi',
}

/**
 * Order in which the UAV sort keys should appear on the UI.
 */
export const UAVSortKeys = [
  UAVSortKey.DEFAULT,
  UAVSortKey.STATUS,
  UAVSortKey.FLIGHT_MODE,
  UAVSortKey.BATTERY,
  UAVSortKey.RSSI,
  UAVSortKey.GPS_FIX,
  UAVSortKey.ALTITUDE_MSL,
  UAVSortKey.ALTITUDE_HOME,
  UAVSortKey.ALTITUDE_GROUND,
  UAVSortKey.HEADING,
];

/**
 * Human-readable labels that should be used
 * on the UI to represent a UAV sort option.
 */
export const labelsForUAVSortKey: Record<UAVSortKey, PreparedI18nKey> = {
  [UAVSortKey.DEFAULT]: tt('sorting.label.default'),
  [UAVSortKey.STATUS]: tt('sorting.label.status'),
  [UAVSortKey.FLIGHT_MODE]: tt('sorting.label.flightMode'),
  [UAVSortKey.BATTERY]: tt('sorting.label.battery'),
  [UAVSortKey.RSSI]: tt('sorting.label.rssi'),
  [UAVSortKey.GPS_FIX]: tt('sorting.label.gpsFix'),
  [UAVSortKey.ALTITUDE_MSL]: tt('sorting.label.amsl'),
  [UAVSortKey.ALTITUDE_HOME]: tt('sorting.label.ahl'),
  [UAVSortKey.ALTITUDE_GROUND]: tt('sorting.label.agl'),
  [UAVSortKey.HEADING]: tt('sorting.label.heading'),
};

/**
 * Human-readable short labels that should be used
 * on the UI to represent a UAV filter preset.
 */
export const shortLabelsForUAVSortKey: Record<UAVSortKey, PreparedI18nKey> = {
  [UAVSortKey.DEFAULT]: tt('sorting.shortLabel.default'),
  [UAVSortKey.STATUS]: tt('sorting.shortLabel.status'),
  [UAVSortKey.FLIGHT_MODE]: tt('sorting.shortLabel.flightMode'),
  [UAVSortKey.BATTERY]: tt('sorting.shortLabel.battery'),
  [UAVSortKey.RSSI]: tt('sorting.shortLabel.rssi'),
  [UAVSortKey.GPS_FIX]: tt('sorting.shortLabel.gpsFix'),
  [UAVSortKey.ALTITUDE_MSL]: tt('sorting.shortLabel.amsl'),
  [UAVSortKey.ALTITUDE_HOME]: tt('sorting.shortLabel.ahl'),
  [UAVSortKey.ALTITUDE_GROUND]: tt('sorting.shortLabel.agl'),
  [UAVSortKey.HEADING]: tt('sorting.shortLabel.heading'),
};

/**
 * Given a UAV sort key from the UAVSortKey enum, returns a function that
 * can be invoked with a single UAV object from the Redux state store and that
 * returns a key that can be used for sorting UAVs according to the criteria
 * described by the UAVSortKey enum instance. Returns undefined for the default
 * sort key as it indicates that the UAVs should be left in whatever order they
 * are passed in to a sorting function.
 *
 * The functions returned by this function must be prepared to handle the case
 * of uav === undefined; this happens when the UAV list to sort has some
 * "empty" slots that correspond to unfilled mission slots.
 */
export const getKeyFunctionForUAVSortKey = memoize(
  (
    key: UAVSortKey
  ): ((uav: StoredUAV | undefined) => Comparable) | undefined => {
    switch (key) {
      case UAVSortKey.STATUS:
        // Sort UAVs based on their most severe error code
        return (uav) =>
          uav && Array.isArray(uav.errors) && uav.errors.length > 0
            ? Math.max(...uav.errors)
            : 0;

      case UAVSortKey.FLIGHT_MODE:
        // Sort UAVs based on their flight mode
        return (uav) => uav?.mode ?? '';

      case UAVSortKey.BATTERY:
        return (uav) => {
          if (isNil(uav)) {
            return -10000;
          }

          const { battery } = uav;
          if (isNil(battery.percentage)) {
            // Return voltage
            return isNil(battery.voltage) ? -10000 : battery.voltage;
          } else {
            // Return percentage. Add a large number to it so all percentages
            // are sorted below UAVs with voltages only.
            return battery.percentage >= 0
              ? battery.percentage + 10000
              : -10000;
          }
        };

      case UAVSortKey.GPS_FIX:
        return (uav) => {
          if (isNil(uav)) {
            return -10000;
          }

          // Sort by type first, then by number of satellites. We multiply a
          // numeric index derived from the type by 100, and add the number of
          // satellites to it.
          const { type = GPSFixType.NO_FIX, numSatellites = 0 } =
            uav?.gpsFix || {};

          // GPSFixType is numeric so this is easy
          return Math.max(type, 0) * 100 + Math.max(numSatellites, 0);
        };

      case UAVSortKey.ALTITUDE_MSL:
        // Sort UAVs based on altitude above mean sea level
        return (uav) => uav?.position?.amsl ?? -10000;

      case UAVSortKey.ALTITUDE_HOME:
        // Sort UAVs based on altitude above home
        // TODO(ntamas): fall back to Z coordinate if no AHL is given
        return (uav) => uav?.position?.ahl ?? -10000;

      case UAVSortKey.ALTITUDE_GROUND:
        // Sort UAVs based on altitude above ground
        // TODO(ntamas): fall back to Z coordinate if no AGL is given
        return (uav) => uav?.position?.agl ?? -10000;

      case UAVSortKey.HEADING:
        return (uav) => uav?.heading ?? 720;

      case UAVSortKey.RSSI:
        // Sort on the RSSI of the first channel only. We can make this more
        // sophisticated if needed; 99% of the case the first channel should be
        // enough. We make use of the fact that -1 means unknown RSSI.
        return (uav) => uav?.rssi?.[0] ?? -1;

      case UAVSortKey.DEFAULT:
        return undefined;

      // No default
    }
  }
);
