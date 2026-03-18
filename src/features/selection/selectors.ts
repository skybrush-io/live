import { createSelector } from '@reduxjs/toolkit';

import type { AppSelector } from '~/store/reducers';
import { rejectNullish } from '~/utils/arrays';
import {
  selectOrdered,
  type Collection,
  type Identifier,
} from '~/utils/collections';

import type { SelectionGroup } from './types';

/**
 * Selector that retrieves the list of item IDs in the current selection
 * from the state object.
 *
 * @param state - The state of the application
 * @returns The list of selected item IDs
 */
export const getSelection: AppSelector<Identifier[]> = (state) =>
  state.selection.ids;

const getSelectionGroups: AppSelector<Collection<SelectionGroup>> = (state) =>
  state.selection.groups;

/**
 * Selector that returns all selection groups ordered by ID.
 */
export const getOrderedSelectionGroups: AppSelector<SelectionGroup[]> =
  createSelector(getSelectionGroups, selectOrdered);

/**
 * Selector factory that creates a selector that returns true if and only if a
 * feature with the given ID is selected.
 */
export const isSelected = (id: Identifier): AppSelector<boolean> =>
  createSelector(getSelection, (selection) => selection.includes(id));

/**
 * Helper function that creates a selector that maps the current selection
 * to a subset of the IDs based on a mapping function from global IDs.
 *
 * @param mapper - A function that takes a global ID as an input argument
 *                 and returns undefined if and only if the global ID is
 *                 not part of the subset being selected
 * @returns A selector function
 */
export const selectionForSubset = (
  mapper: (globalId: Identifier) => Identifier | undefined
): AppSelector<Identifier[]> =>
  createSelector(getSelection, (selection) =>
    rejectNullish(selection.map(mapper))
  );
