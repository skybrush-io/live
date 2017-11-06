/**
 * @file Naming things is hard. These functions may help.
 */

import { camelCase, includes, isArray, trimEnd } from 'lodash'

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
 * @param  {string} idProposal  the original ID proposal
 * @param  {string[]|Object} existingIds the array of existing IDs that should
 *         not be returned, or an object whose keys contain the existing IDs
 *         that should not be returned
 * @return {string} an ID that is based on the ID proposal and that is
 *         not in the list of existing IDs
 */
export function chooseUniqueId (idProposal, existingIds) {
  const hasIdArray = isArray(existingIds)

  if (hasIdArray) {
    if (!includes(existingIds, idProposal)) {
      return idProposal
    }
  } else {
    if (!(idProposal in existingIds)) {
      return idProposal
    }
  }

  let index = 0
  let candidate

  while (true) {
    index++
    candidate = `${idProposal}_${index}`

    if (hasIdArray) {
      if (!includes(existingIds, candidate)) {
        return candidate
      }
    } else {
      if (!(candidate in existingIds)) {
        return candidate
      }
    }
  }
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
 * @param  {string} nameProposal  the original name proposal (typically
 *         from user input)
 * @param  {string[]} existingNames the array of existing names that should
 *         not be returned
 * @return {string} a name that is based on the name proposal and that is
 *         not in the list of existing names
 */
export function chooseUniqueName (nameProposal, existingNames) {
  if (!includes(existingNames, nameProposal)) {
    return nameProposal
  }

  const match = nameProposal.match(/^(.*)\s+([0-9]+)$/)
  const nameBase = match ? match[0] : trimEnd(nameProposal)
  let index = match ? parseInt(match[1]) : 0
  let candidate

  while (true) {
    index++
    candidate = `${nameBase} ${index}`
    if (!includes(existingNames, candidate)) {
      return candidate
    }
  }
}

/**
 * Given an existing name and a list or object of IDs that are already
 * taken, proposes an ID for the object that has the given name.
 *
 * @param  {string} name  the name of the object for which we need to invent
 *         an identifier
 * @param  {string[]|Object} existingIds the array of existing IDs that should
 *         not be returned, or an object whose keys contain the existing IDs
 *         that should not be returned
 * @return {string} the proposed ID of the object
 */
export function chooseUniqueIdFromName (name, existingIds) {
  return chooseUniqueId(camelCase(name), existingIds)
}
