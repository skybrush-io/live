import isNil from 'lodash-es/isNil';

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
export function copyAndEnsureLengthEquals(length, input) {
  const inputLength = input.length;

  if (inputLength < length) {
    const result = input.concat();
    result.length = length;
    result.fill(null, inputLength);
    return result;
  }

  return input.slice(0, length);
}

/**
 * Returns the index of the mapping slot to edit next after the termination
 * of an editing session.
 *
 * @param  {object} state        the mission-related slice of the state object
 * @param  {string} continuation string describing what to do next:
 *         'next' to move to the next slot, 'prev' to move to the previous
 *         slot, 'nextEmpty' to move to the next empty slot, 'prevEmpty' to
 *         move to the previous empty slot, wrapping around at the edges.
 * @return {number}              [description]
 */
export function getNewEditIndex(state, continuation) {
  const { mapping } = state;
  const currentIndex = state.mappingEditor.indexBeingEdited;
  const numItems = mapping.length;
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
    newIndex = (currentIndex + step) % numItems;
    for (; newIndex !== currentIndex; newIndex = (newIndex + step) % numItems) {
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
