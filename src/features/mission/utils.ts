import isNil from 'lodash-es/isNil';

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
  | 'next'
  | 'prev'
  | 'nextEmpty'
  | 'prevEmpty';

/**
 * Returns the index of the mapping slot to edit next after the termination
 * of an editing session.
 *
 * @param state - The mission-related slice of the state object
 * @param continuation - String describing what to do next:
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
