import { createSelector } from '@reduxjs/toolkit';

import {
  getMissionMapping,
  getReverseMissionMapping,
} from '~/features/mission/selectors';
import { getMeanSeaLevelReferenceOfShowCoordinatesOrNull } from '~/features/show/selectors';
import {
  getCurrentGPSPositionByUavId,
  getUAVIdList,
  getUAVIdToStateMapping,
} from '~/features/uavs/selectors';
import type { DroneRef } from '~/features/uavs/swapping/types';
import { parseDroneRef, resolveDroneRef } from '~/features/uavs/swapping/utils';
import { isGPSPositionValid, type GPSPosition } from '~/model/geography';
import type { MissionIndex } from '~/model/missions';
import type { AppSelector } from '~/store/reducers';
import type { Identifier } from '~/utils/collections';
import { createDeepResultSelector } from '~/utils/selectors';

import type { ShowHealingResult } from './slice';
import type { ShowHealingField } from './types';

type ShowHealingTargets = Readonly<{
  /** Index of the drone in the show to be replaced */
  missionIndex: MissionIndex | null;
  /** ID of the replacement drone that is not part of the show yet */
  uavId: Identifier | null;
}>;

export const isShowHealingDialogOpen: AppSelector<boolean> = (state) =>
  state.dialogs.showHealing.open;

export const shouldAutoConfirmShowHealing: AppSelector<boolean> = (state) =>
  state.dialogs.showHealing.autoConfirm;

export const getShowHealingFieldTexts: AppSelector<
  Record<ShowHealingField, string>
> = (state) => state.dialogs.showHealing.fields;

export const getShowHealingResult: AppSelector<ShowHealingResult> = (state) =>
  state.dialogs.showHealing.result;

/**
 * Returns the drone references that the texts in the drone fields parse into.
 */
const getShowHealingFieldRefs: AppSelector<
  Record<ShowHealingField, DroneRef | null>
> = createSelector(
  getShowHealingFieldTexts,
  getUAVIdList,
  (fields, uavIds) => ({
    slot: parseDroneRef(fields.slot, uavIds),
    replacement: parseDroneRef(fields.replacement, uavIds),
  })
);

/**
 * Returns the show slot to be healed and the replacement drone, resolved in
 * the current mapping.
 */
export const getShowHealingTargets: AppSelector<ShowHealingTargets> =
  createSelector(
    getShowHealingFieldRefs,
    getMissionMapping,
    (refs, mapping) => {
      const slot = refs.slot && resolveDroneRef(refs.slot, mapping);
      const replacement =
        refs.replacement && resolveDroneRef(refs.replacement, mapping);
      return {
        missionIndex: slot?.missionIndex ?? null,
        uavId: replacement?.missionIndex === null ? replacement.uavId : null,
      };
    }
  );

/**
 * Returns whether the given position is valid and has an AMSL altitude.
 */
const hasPositionWithAMSL = (position: GPSPosition | undefined): boolean =>
  isGPSPositionValid(position) && typeof position.amsl === 'number';

/**
 * Returns the IDs of the drones that can be selected as replacement: the ones
 * that are not part of the show and have a valid position. A missing AMSL
 * altitude is reported as a problem instead, to make the reason visible.
 */
export const getShowHealingReplacementCandidates: AppSelector<Identifier[]> =
  createDeepResultSelector(
    getUAVIdList,
    getReverseMissionMapping,
    getUAVIdToStateMapping,
    (uavIds, reverseMapping, uavsById) =>
      uavIds.filter(
        (uavId) =>
          reverseMapping[uavId] === undefined &&
          isGPSPositionValid(uavsById[uavId]?.position)
      )
  );

/**
 * Returns the i18n key of the reason why the show cannot be healed with the
 * drones in the fields, or `null` if there is no problem (yet).
 */
export const getShowHealingProblemKey: AppSelector<string | null> = (state) => {
  if (getMeanSeaLevelReferenceOfShowCoordinatesOrNull(state) === null) {
    return 'showHealingDialog.problem.noAMSLReference';
  }

  const refs = getShowHealingFieldRefs(state);
  const { missionIndex, uavId } = getShowHealingTargets(state);

  if (refs.slot && missionIndex === null) {
    return 'showHealingDialog.problem.slotNotInShow';
  }

  if (refs.replacement && uavId === null) {
    return 'showHealingDialog.problem.replacementInShow';
  }

  if (
    uavId !== null &&
    !hasPositionWithAMSL(getCurrentGPSPositionByUavId(state, uavId))
  ) {
    return 'showHealingDialog.problem.replacementHasNoPosition';
  }

  return null;
};

/**
 * Returns whether a show healing calculation can be requested for the drones
 * in the fields.
 */
export const canRequestShowHealing: AppSelector<boolean> = (state) => {
  const { missionIndex, uavId } = getShowHealingTargets(state);
  return (
    missionIndex !== null &&
    uavId !== null &&
    getShowHealingProblemKey(state) === null &&
    getShowHealingResult(state).status !== 'loading'
  );
};
