import sortBy from 'lodash-es/sortBy';

import { createSelector } from '@reduxjs/toolkit';

import { getPreferredCoordinateFormatter } from '~/selectors/formatting';

/**
 * Returns whether the antenna position should be shown in ECEF coordinates.
 */
export const isShowingAntennaPositionInECEF = (state) =>
  state.rtk.dialog.antennaPositionFormat === 'ecef';

/**
 * Returns the formatted antenna position, or undefined if we do not know the
 * antenna position yet.
 */
export const getFormattedAntennaPosition = createSelector(
  (state) => state.rtk.stats.antenna,
  getPreferredCoordinateFormatter,
  isShowingAntennaPositionInECEF,
  (antennaInfo, formatter, isECEF) => {
    if (isECEF) {
      const { positionECEF } = antennaInfo || {};
      return positionECEF && Array.isArray(positionECEF)
        ? `[${(positionECEF[0] / 1e3).toFixed(3)}, ${(
            positionECEF[1] / 1e3
          ).toFixed(3)}, ${(positionECEF[2] / 1e3).toFixed(3)}]`
        : undefined;
    } else {
      const { position } = antennaInfo || {};
      return position ? formatter(position) : undefined;
    }
  }
);

/**
 * Returhs a short summary of the antenna description and position, in the
 * format they should appear on the UI.
 */
export const getAntennaInfoSummary = createSelector(
  (state) => state.rtk.stats.antenna,
  getFormattedAntennaPosition,
  (antennaInfo, formattedPosition) => {
    if (!antennaInfo) {
      return { position: undefined, description: undefined };
    }

    const result = {
      position: formattedPosition,
    };

    // AMSL is not included because it is not in the same reference coordinate
    // system as the altitudes from the drones so it could cause confusion
    /*
    if (typeof antennaInfo.height === 'number') {
      result.position = `${result.position}, ${antennaInfo.height.toFixed(1)}m`;
    }
    */

    const serialNumber = String(antennaInfo.serialNumber || '');
    if (serialNumber && serialNumber.length > 0) {
      result.description = `${
        antennaInfo.descriptor || ''
      } / SN: ${serialNumber}`;
    } else {
      result.description = String(antennaInfo.descriptor || '');
    }

    return result;
  }
);

/**
 * Returns the list of observed RTCM messages, in the order they should appear
 * on the UI.
 */
export const getDisplayedListOfMessages = createSelector(
  (state) => state.rtk.stats.messages,
  (messages) =>
    sortBy(
      Object.entries(messages || {}).map(([messageId, message]) => ({
        id: messageId,
        ...message,
      })),
      'id'
    )
);

/**
 * Returns the list of satellite CNR values to display, in the order they
 * should appear on the UI.
 */
export const getDisplayedSatelliteCNRValues = createSelector(
  (state) => state.rtk.stats.satellites,
  (satelliteInfos) =>
    sortBy(
      Object.entries(satelliteInfos || {}).map(
        ([satelliteId, satelliteInfo]) => ({
          id: satelliteId,
          ...satelliteInfo,
        })
      ),
      'id'
    )
);

/**
 * Returns the IDs of the satellites for which we currently have a CNR value.
 */
export const getSatelliteIds = createSelector(
  (state) => state.rtk.stats.satellites,
  (satelliteInfos) => Object.keys(satelliteInfos || {})
);

/**
 * Returns the number of satellites for which we currently have a CNR
 * (carrier-to-noise ratio) information.
 */
export const getNumberOfSatellites = (state) => getSatelliteIds(state).length;

/**
 * Returns the number of satellites for which the carrier-to-noise ratio is
 * above 40.
 */
export const getNumberOfGoodSatellites = createSelector(
  (state) => state.rtk.stats.satellites,
  (satelliteInfos) => {
    let result = 0;

    for (const { cnr } of Object.values(satelliteInfos || {})) {
      if (cnr >= 40) {
        result++;
      }
    }

    return result;
  }
);

/**
 * Returns an object summarizing the status of the survey procedure.
 */
export const getSurveyStatus = createSelector(
  (state) => state.rtk.stats.survey,
  ({ accuracy, flags } = {}) => ({
    accuracy,
    supported: Boolean(flags & 1),
    active: Boolean(flags & 2),
    valid: Boolean(flags & 4),
  })
);

/**
 * Returns whether the survey settings panel should be visible.
 */
export const shouldShowSurveySettings = (state) =>
  state.rtk.dialog.surveySettingsEditorVisible;
