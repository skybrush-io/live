import meanBy from 'lodash-es/meanBy';

import { showError } from '~/features/snackbar/actions';
import {
  getCurrentGPSPositionByUavId,
  getSelectedUAVIds,
} from '~/features/uavs/selectors';
import { getPreferredCoordinateFormatter } from '~/selectors/formatting';
import { parseCoordinate } from '~/utils/geography';
import { moveUAVs } from '~/utils/messaging';

import { closeFlyToTargetDialog, openFlyToTargetDialog } from './slice';

const hasAMSL = (pos) =>
  typeof pos.amsl === 'number' && Number.isFinite(pos.amsl);

/**
 * Thunk action factory that takes a geographical coordinate (without altitude)
 * and a list of selected UAV IDs, and opens the "Fly to target" dialog such
 * that the altitude in the dialog box is set to the mean AMSL of the selected
 * drones if more than one drone is selected, or to the AHL of the drone if a
 * single drone is selected.
 */
export const openFlyToTargetDialogWithCoordinate =
  ({ coords, uavIds }) =>
  (dispatch, getState) => {
    const state = getState();
    const getPosition = (uavId) => getCurrentGPSPositionByUavId(state, uavId);
    const uavIdsWithValidPositions = uavIds.filter(getPosition);
    const positions = uavIdsWithValidPositions.map(getPosition);
    const numberOfUAVsWithPositions = positions.length;

    if (numberOfUAVsWithPositions <= 0) {
      return;
    }

    // altitude = NaN may happen if numberOfUAVs > 1 and the drones have no AMSLs
    const altitude =
      numberOfUAVsWithPositions === 1
        ? positions[0].ahl
        : meanBy(positions.filter(hasAMSL), 'amsl');
    const finiteAltitude = Number.isFinite(altitude) ? altitude : 0;
    const mode =
      numberOfUAVsWithPositions === 1 && finiteAltitude ? 'ahl' : 'amsl';

    const formatter = getPreferredCoordinateFormatter(state);

    dispatch(
      openFlyToTargetDialog({
        coords: formatter(coords),
        mode,
        altitude: Number(finiteAltitude.toFixed(1)),
      })
    );
  };

/**
 * Thunk action factory that takes the fields of the completed form in the
 * "fly to target" dialog and dispatches the appropriate messages to the
 * appropriate UAVs.
 */
export const submitFlyToTargetDialog = (fields) => (dispatch, getState) => {
  const parsedCoordinate = parseCoordinate(fields.coords);
  const state = getState();
  const selectedUAVIds = getSelectedUAVIds(state);

  if (!parsedCoordinate) {
    dispatch(showError('Coordinate format invalid'));
  } else if (selectedUAVIds.length === 0) {
    dispatch(showError('Selection is empty'));
  } else {
    const altitude = Number(fields.altitude);
    let target = {
      lat: parsedCoordinate[1],
      lon: parsedCoordinate[0],
    };

    if (Number.isFinite(altitude)) {
      if (fields.mode === 'agl') {
        target.agl = altitude;
      } else if (fields.mode === 'ahl') {
        target.ahl = altitude;
      } else if (fields.mode === 'amsl') {
        target.amsl = altitude;
      } else if (fields.mode === 'relative' && Math.abs(altitude) > 0.01) {
        // Okay, we need to send messages individually to the UAVs
        const baseTarget = { ...target };
        target = (uavId) => {
          const currentPosition = getCurrentGPSPositionByUavId(state, uavId);

          if (currentPosition && currentPosition.amsl) {
            return {
              ...baseTarget,
              amsl: currentPosition.amsl + altitude,
            };
          }

          if (currentPosition && currentPosition.ahl) {
            return {
              ...baseTarget,
              ahl: currentPosition.ahl + altitude,
            };
          }

          if (currentPosition && currentPosition.agl) {
            return {
              ...baseTarget,
              agl: currentPosition.agl + altitude,
            };
          }
        };
      } else {
        // Each drone keeps its own altitude
      }
    }

    if (typeof target === 'function') {
      // Messages should be sent individually
      for (const uavId of selectedUAVIds) {
        const effectiveTarget = target(uavId);
        if (effectiveTarget) {
          moveUAVs([uavId], { target: effectiveTarget });
        }
      }
    } else {
      // One message for all UAVs
      moveUAVs(selectedUAVIds, { target });
    }
  }

  dispatch(closeFlyToTargetDialog());
};
