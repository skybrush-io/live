import isNil from 'lodash-es/isNil';

import { type MissionIndex, type MissionItem } from '~/model/missions';
import { type Identifier } from '~/utils/collections';
import { type Nullable } from '~/utils/types';

import { type MissionSliceState } from './slice';

/**
 * Helper function that takes an array and returns an array that is a shallow
 * copy of the input array, but its length is constrained to a given value.
 *
 * When the input array is shorter than the desired length, it will be padded
 * with null values.
 *
 * When the input array is longer than the desired length, it will be
 * truncated.
 */
export function copyAndEnsureLengthEquals<T>(
  length: number,
  input: T[]
): Array<Nullable<T>> {
  const inputLength = input.length;

  if (inputLength < length) {
    const result: Array<Nullable<T>> = input.concat();
    result.length = length;
    result.fill(null, inputLength);
    return result;
  }

  return input.slice(0, length);
}

export type MissionMappingEditorContinuation =
  'next' | 'prev' | 'nextEmpty' | 'prevEmpty' | 'stay';

/**
 * Returns the index of the mapping slot to edit next after the termination
 * of an editing session.
 *
 * @param state - The mission-related slice of the state object
 * @param continuation - String describing what to do next:
 *                       = 'stay' to stay at the current slot
 *                       + 'next' to move to the next slot
 *                       + 'prev' to move to the previous slot
 *                       + 'nextEmpty' to move to the next empty slot
 *                       + 'prevEmpty' to move to the previous empty slot
 *                       (wrapping around at the edges)
 * @returns The index of the next mission slot to edit
 */
export function getNewEditIndex(
  state: MissionSliceState,
  continuation: MissionMappingEditorContinuation
): number {
  const { mapping } = state;
  const currentIndex = state.mappingEditor.indexBeingEdited;
  const numberItems = mapping.length;
  const step =
    continuation === 'prev' || continuation === 'prevEmpty'
      ? -1
      : continuation === 'next' || continuation === 'nextEmpty'
        ? 1
        : 0;
  const needsEmpty =
    continuation === 'prevEmpty' || continuation === 'nextEmpty';
  let newIndex;

  if (step === 0) {
    newIndex = -1;
  } else {
    newIndex = (currentIndex + step) % numberItems;
    for (
      ;
      newIndex !== currentIndex;
      newIndex = (newIndex + step) % numberItems
    ) {
      if (!needsEmpty || isNil(mapping[newIndex])) {
        break;
      }
    }
  }

  // If there are no more slots to consider, stop the editing
  if (newIndex === currentIndex) {
    newIndex = -1;
  }

  return newIndex;
}

/**
 * Predicate factory that receives a mission index and returns a predicate function that
 * checks whether a given mission item has that index in its participants list.
 *
 * @param missionIndex - The index of the mission to check for participation
 * @returns A predicate function that takes a mission item and returns a boolean
 */
export const doesMissionIndexParticipateInMissionItem =
  (missionIndex: number) =>
  ({ participants }: MissionItem): boolean =>
    participants === undefined || participants.includes(missionIndex);

/**
 * Returns the reverse of the given mission mapping, i.e. a mapping from UAV IDs
 * to the mission indices they are assigned to.
 */
export const getReverseMapping = (
  mapping: ReadonlyArray<Nullable<Identifier>>
): Record<Identifier, MissionIndex> =>
  Object.fromEntries(
    mapping.flatMap((uavId, missionIndex) =>
      isNil(uavId) ? [] : [[uavId, missionIndex]]
    )
  );

/**
 * Returns a copy of the given mission mapping where the given UAV is moved to the
 * given mission index. The UAV previously at the target index, if any, takes the
 * original place of the moved UAV, or leaves the mapping if the moved UAV was not
 * in the mapping. A target index of `null` removes the UAV from the mapping.
 */
export const moveUAVInMapping = (
  mapping: ReadonlyArray<Nullable<Identifier>>,
  uavId: Identifier,
  to: Nullable<MissionIndex>
): Array<Nullable<Identifier>> => {
  const result = [...mapping];
  const from = result.indexOf(uavId);
  const uavIdToReplace = isNil(to) ? null : result[to];

  if (from >= 0) {
    result[from] = uavIdToReplace ?? null;
  }

  if (!isNil(to)) {
    result[to] = uavId;
  }

  return result;
};

/**
 * Returns the IDs of the UAVs whose mission index differs between the two given
 * mission mappings, including UAVs that were added to or removed from the mapping.
 */
export const getUAVsWithChangedMissionIndex = (
  oldMapping: ReadonlyArray<Nullable<Identifier>>,
  newMapping: ReadonlyArray<Nullable<Identifier>>
): Identifier[] => {
  const oldReverseMapping = getReverseMapping(oldMapping);
  const newReverseMapping = getReverseMapping(newMapping);
  const uavIds = new Set([
    ...Object.keys(oldReverseMapping),
    ...Object.keys(newReverseMapping),
  ]);

  return [...uavIds].filter(
    (uavId) => oldReverseMapping[uavId] !== newReverseMapping[uavId]
  );
};
