import { Base64 } from 'js-base64';

import type { ShowSpecification } from '@skybrush/show-format';

import { errorToString } from '~/error-handling';
import { getClockById } from '~/features/clocks/selectors';
import { getCurrentTickCountOnClock } from '~/features/clocks/utils';
import { updateMapping } from '~/features/mission/actions';
import { getMissionMapping } from '~/features/mission/selectors';
import { SHOW_UPLOAD_JOB } from '~/features/show/constants';
import {
  getBase64ShowBlob,
  getMeanSeaLevelReferenceOfShowCoordinatesOrNull,
  getOutdoorShowOrientation,
  getOutdoorShowOrigin,
  getShowClockReference,
  getShowStartTime,
} from '~/features/show/selectors';
import { setHealedDroneSpec } from '~/features/show/slice';
import { showError, showSuccess } from '~/features/snackbar/actions';
import { getCurrentGPSPositionByUavId } from '~/features/uavs/selectors';
import { startUploadJobFromUploadDialog } from '~/features/upload/actions';
import {
  openUploadDialogForJob,
  putUavsInWaitingQueue,
} from '~/features/upload/slice';
import i18n from '~/i18n';
import messageHub from '~/message-hub';
import type { AppThunk, RootState } from '~/store/reducers';
import { toScaledJSONFromLonLat } from '~/utils/geography';
import workers from '~/workers';

import { SHOW_HEALING_START_TIME_OFFSET } from './constants';
import {
  canRequestShowHealing,
  getShowHealingResult,
  getShowHealingTargets,
  shouldAutoConfirmShowHealing,
} from './selectors';
import { _setShowHealingResult, closeShowHealingDialog } from './slice';

/**
 * Returns the current show time in seconds, or `null` if it is not known.
 *
 * TODO: temporary solution; the server will calculate the start time of the
 * healing drone later, without having to know the current show time here.
 */
const getCurrentShowTime = (state: RootState): number | null => {
  const startTime = getShowStartTime(state);
  if (startTime === null) {
    return null;
  }

  const clockId = getShowClockReference(state);
  if (clockId === null) {
    return Date.now() / 1000 - startTime;
  }

  const clock = getClockById(state, clockId);
  return clock
    ? getCurrentTickCountOnClock(clock) / clock.ticksPerSecond - startTime
    : null;
};

const isCalculationPending = (state: RootState): boolean =>
  getShowHealingResult(state).status === 'loading';

/**
 * Assigns the replacement drone of the calculated show healing result to the
 * healed show slot, and opens the upload dialog with the replacement drone in
 * the queue. The upload is also started if auto-confirmation is enabled.
 */
export const confirmShowHealing = (): AppThunk => (dispatch, getState) => {
  const state = getState();
  const result = getShowHealingResult(state);
  if (result.status !== 'ready') {
    return;
  }

  const { missionIndex, spec, uavId } = result;
  const mapping = getMissionMapping(state);
  if (mapping.includes(uavId)) {
    showError(i18n.t('showHealingDialog.problem.replacementInShow'));
    return;
  }

  const newMapping = [...mapping];
  newMapping[missionIndex] = uavId;

  dispatch(setHealedDroneSpec({ index: missionIndex, spec }));
  dispatch(updateMapping(newMapping));
  dispatch(openUploadDialogForJob({ job: SHOW_UPLOAD_JOB }));
  dispatch(putUavsInWaitingQueue([uavId]));
  if (shouldAutoConfirmShowHealing(state)) {
    dispatch(startUploadJobFromUploadDialog());
  }

  dispatch(closeShowHealingDialog());
  showSuccess(i18n.t('showHealingDialog.success'));
};

/**
 * Asks the server to calculate a trajectory for the replacement drone in the
 * dialog that takes over the show slot in the dialog, and extracts the
 * specification of the healing drone from the resulting single-drone show.
 */
export const requestShowHealing =
  (): AppThunk => async (dispatch, getState) => {
    const state = getState();
    if (!canRequestShowHealing(state)) {
      return;
    }

    const { missionIndex, uavId } = getShowHealingTargets(state);
    const show = getBase64ShowBlob(state);
    const origin = getOutdoorShowOrigin(state);
    const amslReference =
      getMeanSeaLevelReferenceOfShowCoordinatesOrNull(state);
    const position =
      uavId === null ? undefined : getCurrentGPSPositionByUavId(state, uavId);
    const showTime = getCurrentShowTime(state);

    if (
      missionIndex === null ||
      uavId === null ||
      show === undefined ||
      origin === undefined ||
      amslReference === null ||
      position?.amsl === undefined ||
      showTime === null
    ) {
      dispatch(
        _setShowHealingResult({
          status: 'error',
          error: i18n.t('showHealingDialog.problem.missingData'),
        })
      );
      return;
    }

    const requestedStartTime = Math.round(
      showTime + SHOW_HEALING_START_TIME_OFFSET
    );

    dispatch(_setShowHealingResult({ status: 'loading' }));

    try {
      const response = await messageHub.execute.healShow(
        show,
        {
          drone_index: missionIndex,
          start_time: requestedStartTime,
          start_position: [
            ...toScaledJSONFromLonLat([position.lon, position.lat]),
            Math.round(position.amsl * 1000),
          ],
        },
        {
          location: {
            origin: [
              ...toScaledJSONFromLonLat(origin),
              Math.round(amslReference * 1000),
            ],
            orientation: getOutdoorShowOrientation(state),
          },
        }
      );

      // The result is a show file containing only the healing drone; it is
      // parsed in a worker to keep the UI responsive
      const { spec }: { spec: ShowSpecification } = await workers.loadShow(
        Base64.toUint8Array(response.show),
        { returnBlob: false }
      );
      const drones = spec.swarm?.drones ?? [];
      const droneSpec = drones[0];
      if (drones.length !== 1 || !droneSpec) {
        throw new Error(
          i18n.t('showHealingDialog.problem.invalidDroneCountInResult')
        );
      }

      const { trajectory } = droneSpec.settings;
      const startTime = trajectory.takeoffTime ?? trajectory.points[0][0];

      // The result is obsolete if the dialog was closed or the drones were
      // changed in the meantime
      if (!isCalculationPending(getState())) {
        return;
      }

      dispatch(
        _setShowHealingResult({
          status: 'ready',
          missionIndex,
          uavId,
          startTime,
          spec: droneSpec,
        })
      );

      if (shouldAutoConfirmShowHealing(getState())) {
        dispatch(confirmShowHealing());
      }
    } catch (error) {
      if (!isCalculationPending(getState())) {
        return;
      }

      dispatch(
        _setShowHealingResult({ status: 'error', error: errorToString(error) })
      );
    }
  };
