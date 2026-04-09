import sortBy from 'lodash-es/sortBy';

import { createSelector } from '@reduxjs/toolkit';

import { isConnected } from '~/features/servers/selectors';
import { getPreferredCoordinateFormatter } from '~/selectors/formatting';
import type { RootState } from '~/store/reducers';
import {
  RTKAntennaPositionFormat,
  RTKCorrectionStatus,
  type RTKSavedCoordinate,
} from './types';

const formatPositionECEF = (
  positionECEF?: RTKSavedCoordinate['positionECEF']
): string | undefined =>
  positionECEF && Array.isArray(positionECEF)
    ? `[${positionECEF.map((c) => (c / 1e3).toFixed(3)).join(', ')}]`
    : undefined;

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
      return formatPositionECEF(positionECEF);
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
  (state: RootState) => state.rtk.stats.satellites,
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
  (state: RootState) => state.rtk.stats.satellites,
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
  presetId: string | undefined
): boolean => {
  if (!presetId) {
    return false;
  }

  const coords = state.rtk.savedCoordinates[presetId];
  return Boolean(coords) && coords.length > 0;
};

/**
 * Returns the saved coordinates for the given RTK preset ID, or empty array if none exists.
 */
export const getSavedCoordinatesForPreset = (
  state: RootState,
  presetId: string
): RTKSavedCoordinate[] => state.rtk.savedCoordinates[presetId] ?? [];

/**
 * Returns the full saved coordinates map keyed by preset ID.
 */
export const getSavedCoordinates = (
  state: RootState
): RootState['rtk']['savedCoordinates'] => state.rtk.savedCoordinates;

/**
 * Returns a formatter function that formats a saved coordinate position
 * according to the current RTK display settings.
 */
export const getPreferredSavedRTKPositionFormatter = createSelector(
  getPreferredCoordinateFormatter,
  isShowingAntennaPositionInECEF,
  (formatter, isECEF) =>
    (savedCoordinate?: RTKSavedCoordinate): string | undefined => {
      if (!savedCoordinate) {
        return undefined;
      }

      if (isECEF) {
        const { positionECEF } = savedCoordinate;
        return formatPositionECEF(positionECEF);
      } else {
        const { position } = savedCoordinate;
        return position ? formatter(position) : undefined;
      }
    }
);

/**
 * Returns the current RTK preset ID.
 */
export const getCurrentRTKPresetId = (state: RootState): string | undefined =>
  state.rtk.currentPresetId;

/**
 * Returns the coordinate restoration dialog state.
 */
export const getCoordinateRestorationDialogState = (
  state: RootState
): { open: boolean; presetId?: string | undefined } =>
  state.rtk.dialog.coordinateRestorationDialog;

/**
 * Returns an overall semantic status enum value that is intended to summarize the
 * health of the RTK corrections in general. This is used by the RTK status header
 * widget but may also be used in other parts of the application where no specific
 * details are needed.
 */
export const getOverallRTKStatus = createSelector(
  isConnected,
  getCurrentRTKPresetId,
  getNumberOfGoodSatellites,
  getSurveyStatus,
  (
    isConnected,
    presetId,
    numGoodSatellites,
    surveyStatus
  ): RTKCorrectionStatus => {
    let result: RTKCorrectionStatus;

    if (!isConnected) {
      // Not connected to the server at all
      return RTKCorrectionStatus.NOT_CONNECTED;
    }

    if (presetId === undefined) {
      // No RTK base station selected
      return RTKCorrectionStatus.INACTIVE;
    }

    if (surveyStatus.supported) {
      // If the RTK device supports surveying, show the survey status.
      //
      // Note that we don't check surveyStatus.valid because if the survey is not
      // active and not valid either it could also mean that we have a fixed position.
      //
      // We will check the recency of RTK correction messages later below anyway.
      result = surveyStatus.active
        ? RTKCorrectionStatus.SURVEY_IN_PROGRESS
        : RTKCorrectionStatus.OK;
    } else {
      // If the RTK device does not support surveying, simply show success
      result = RTKCorrectionStatus.OK;
    }

    // If the result would be successful but we do not have enough good satellites,
    // show a warning instead
    if (result === RTKCorrectionStatus.OK && numGoodSatellites < 7) {
      result = RTKCorrectionStatus.NOT_ENOUGH_SATELLITES;
    }

    // TODO(ntamas): check age of satellite CNR information
    // TODO(ntamas): check recency of antenna position information as well
    // TODO(ntamas): replace errors and warnings with RTKCorrectionStatus.CONNECTED_RECENTLY if
    // we have just connected to the server and we don't have enough information yet to
    // determine the status conclusively

    return result;
  }
);
