import { createSelector } from '@reduxjs/toolkit';

import { getMapViewRotationAngle } from '~/selectors/map';
import { selectOrdered } from '~/utils/collections';

/**
 * Selector that calculates and caches the list of all the saved locations
 * in the state object, in exactly the same order as they should appear on
 * the UI.
 */
export const getSavedLocationsInOrder = createSelector(
  (state) => state.savedLocations,
  selectOrdered
);

/**
 * Selector that returns a fake location that can be used in the
 * saved location editor dialog when the user wants to save the current
 * state of the map view as a new location.
 */
export const getCurrentMapViewAsSavedLocation = createSelector(
  (state) => state.map.view,
  (state) => getMapViewRotationAngle(state),
  (view, rotation) => ({
    center: {
      lon: view.position[0].toFixed(6),
      lat: view.position[1].toFixed(6),
    },
    rotation,
    zoom: Math.round(view.zoom),
  })
);

/**
 * Selector that returns the id of the saved location currently being edited.
 */
export const getEditedLocationId = (state) =>
  state.dialogs.savedLocationEditor.editedLocationId;

/**
 * Selector that determines whether the saved location editor dialog is open.
 */
export const getEditorDialogVisibility = (state) =>
  state.dialogs.savedLocationEditor.dialogVisible;
