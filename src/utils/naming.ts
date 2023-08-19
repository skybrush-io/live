/**
 * @file Naming things is hard. These functions may help.
 */

import camelCase from 'lodash-es/camelCase';

/**
 * Given an ID proposal and an array of existing IDs, returns a new
 * ID that is guaranteed not to be in the given array.
 *
 * When the ID proposal is not in the array of existing IDs, this
 * function simply returns the ID proposal. Otherwise, it tries appending
 * <code>"_1"</code>, <code>"_2"</code> and so on to the ID proposal
 * until we obtain an ID that is not in the array of existing IDs.
 *
 * The difference between this function and <code>chooseUniqueName()</code>
 * is that the latter is meant for human-readable labels so it uses
 * whitespace between the original proposal and the appended number.
 * Furthermore, <code>chooseUniqueName()</code> considers the case when
 * the name proposal already ends in a number, and may replace the number
 * with another number.
 *
 * @param idProposal - The original ID proposal
 * @param existingIds - The array of existing IDs that should not be returned,
 *                      or an object whose keys contain the existing IDs that
 *                      should not be returned
 * @returns An ID that is based on the ID proposal and
 *          that is not in the list of existing IDs
 */
export function chooseUniqueId(
  idProposal: string,
  existingIds: string[] | Record<string, unknown>
): string {
  const hasIdArray = Array.isArray(existingIds);

  if (hasIdArray) {
    if (!existingIds.includes(idProposal)) {
      return idProposal;
    }
  } else if (!(idProposal in existingIds)) {
    return idProposal;
  }

  let index = 0;
  let candidate: string;

  /* eslint-disable no-constant-condition */
  while (true) {
    index++;
    candidate = `${idProposal}_${index}`;

    if (hasIdArray) {
      if (!existingIds.includes(candidate)) {
        return candidate;
      }
    } else if (!(candidate in existingIds)) {
      return candidate;
    }
  }
  /* eslint-enable no-constant-condition */
}

/**
 * Given a name proposal and an array of existing names, returns a new
 * name that is guaranteed not to be in the given array.
 *
 * When the name proposal is not in the array of existing names, this
 * function simply returns the name proposal. Otherwise, it tries appending
 * <code>" 1"</code>, <code>" 2"</code> and so on to the name proposal
 * until we obtain a name that is not in the array of existing names.
 *
 * When the name proposal ends in an integer, the new proposals will modify
 * the number instead of appending a new number.
 *
 * The difference between this function and <code>chooseUniqueId()</code>
 * is that this function is meant for human-readable labels so it uses
 * whitespace between the original proposal and the appended number, while
 * <code>chooseUniqueId()</code> uses an underscore. Furthermore, this
 * function considers the case when the name proposal already ends in a
 * number.
 *
 * @param nameProposal - The original name proposal (typically from user input)
 * @param existingNames - The array of existing names
 *                        that should not be returned
 * @returns A name that is based on the name proposal and
 *          that is not in the list of existing names
 */
export function chooseUniqueName(
  nameProposal: string,
  existingNames: string[]
): string {
  if (!existingNames.includes(nameProposal)) {
    return nameProposal;
  }

  const match = nameProposal.match(/^(.*)\s+(\d+)$/);
  // NOTE: Bang justified by the `(.*)` group being present if `match` exists
  const nameBase = match ? match[1]! : nameProposal.trimEnd();
  // NOTE: Bang justified by the `(\d+)` group being present if `match` exists
  let index = match ? Number.parseInt(match[2]!, 10) : 0;
  let candidate: string;

  /* eslint-disable no-constant-condition */
  while (true) {
    index++;
    candidate = `${nameBase} ${index}`;
    if (!existingNames.includes(candidate)) {
      return candidate;
    }
  }
  /* eslint-enable no-constant-condition */
}

/**
 * Given an existing name and a list or object of IDs that are already
 * taken, proposes an ID for the object that has the given name.
 *
 * @param name - The name of the object for which
 *               we need to invent an identifier
 * @param existingIds - The array of existing IDs that should not be returned,
 *                      or an object whose keys contain the existing IDs that
 *                      should not be returned
 * @returns The proposed ID of the object
 */
export function chooseUniqueIdFromName(
  name: string,
  existingIds: string[] | Record<string, unknown>
): string {
  return chooseUniqueId(camelCase(name), existingIds);
}
