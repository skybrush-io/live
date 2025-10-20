import sortBy from 'lodash-es/sortBy';

import { createSelector } from '@reduxjs/toolkit';

import { getPreferredCoordinateFormatter } from '~/selectors/formatting';
import type { RootState } from '~/store/reducers';
import { RTKAntennaPositionFormat, type RTKSavedCoordinate } from './types';

/**
 * Returns whether the antenna position should be shown in ECEF coordinates.
 */
export const isShowingAntennaPositionInECEF = (state: RootState): boolean =>
  state.rtk.dialog.antennaPositionFormat === RTKAntennaPositionFormat.ECEF;

/**
 * Returns the formatted antenna position, or undefined if we do not know the
 * antenna position yet.
 */
export const getFormattedAntennaPosition = createSelector(
  (state: RootState) => state.rtk.stats.antenna,
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
  (state: RootState) => state.rtk.stats.antenna,
  getFormattedAntennaPosition,
  (antennaInfo, formattedPosition) => {
    if (!antennaInfo) {
      return { position: undefined, description: undefined };
    }

    const result = {
      position: formattedPosition,
      description: '',
    };

    // AMSL is not included because it is not in the same reference coordinate
    // system as the altitudes from the drones so it could cause confusion
    /*
    if (typeof antennaInfo.height === 'number') {
      result.position = `${result.position}, ${antennaInfo.height.toFixed(1)}m`;
    }
    */

    const serialNumber = String(antennaInfo.serialNumber ?? '');
    if (serialNumber && serialNumber.length > 0) {
      result.description = `${
        antennaInfo.descriptor ?? ''
      } / SN: ${serialNumber}`;
    } else {
      result.description = String(antennaInfo.descriptor ?? '');
    }

    return result;
  }
);

/**
 * Returns the list of observed RTCM messages, in the order they should appear
 * on the UI.
 */
export const getDisplayedListOfMessages = createSelector(
  (state: RootState) => state.rtk.stats.messages,
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
  (state: RootState) => state.rtk.stats.satellites,
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
export const getNumberOfSatellites = (state: RootState): number =>
  getSatelliteIds(state).length;

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
  (state: RootState) => state.rtk.stats.survey,
  ({ accuracy, flags = 0 }) => ({
    accuracy,
    supported: Boolean(flags & 1),
    active: Boolean(flags & 2),
    valid: Boolean(flags & 4),
  })
);

/**
 * Returns whether the survey settings panel should be visible.
 */
export const shouldShowSurveySettings = (state: RootState): boolean =>
  state.rtk.dialog.surveySettingsEditorVisible;

/**
 * Returns whether there is a saved coordinate for the given RTK preset ID.
 */
export const hasSavedCoordinateForPreset = (
  state: RootState,
  presetId: string
): boolean => Boolean(state.rtk.savedCoordinates[presetId]);

/**
 * Returns the saved coordinate for the given RTK preset ID, or undefined if none exists.
 */
export const getSavedCoordinateForPreset = (
  state: RootState,
  presetId: string
): RTKSavedCoordinate | undefined => state.rtk.savedCoordinates[presetId];

/**
 * Returns all saved coordinates as an array of { presetId, coordinate } objects.
 */
export const getAllSavedCoordinates = createSelector(
  (state: RootState) => state.rtk.savedCoordinates,
  (savedCoordinates) =>
    Object.entries(savedCoordinates).map(([presetId, coordinate]) => ({
      presetId,
      coordinate,
    }))
);

/**
 * Returns the formatted saved coordinate position for a given preset ID.
 */
export const getFormattedSavedCoordinatePosition = createSelector(
  (state: RootState, presetId: string) =>
    getSavedCoordinateForPreset(state, presetId),
  getPreferredCoordinateFormatter,
  isShowingAntennaPositionInECEF,
  (savedCoordinate, formatter, isECEF) => {
    if (!savedCoordinate) {
      return undefined;
    }

    if (isECEF) {
      const { positionECEF } = savedCoordinate;
      return positionECEF && Array.isArray(positionECEF)
        ? `[${(positionECEF[0] / 1e3).toFixed(3)}, ${(
            positionECEF[1] / 1e3
          ).toFixed(3)}, ${(positionECEF[2] / 1e3).toFixed(3)}]`
        : undefined;
    } else {
      const { position } = savedCoordinate;
      return position ? formatter(position) : undefined;
    }
  }
);

/**
 * Returns the coordinate restoration dialog state.
 */
export const getCoordinateRestorationDialog = (
  state: RootState
): RootState['rtk']['dialog']['coordinateRestorationDialog'] =>
  state.rtk.dialog.coordinateRestorationDialog;
