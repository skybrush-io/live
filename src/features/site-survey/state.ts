/**
 * @file Redux slice for the site survey dialog.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { SwarmSpecification } from '@skybrush/show-format';
import xor from 'lodash-es/xor';
import { Point } from 'ol/geom';

import { updateSelection as updateSelectedIds } from '~/features/map/utils';
import type { OutdoorCoordinateSystemWithOrigin } from '~/features/show/types';
import type { Identifier } from '~/utils/collections';
import {
  type EasNor,
  FlatEarthCoordinateSystem,
  lonLatFromMapViewCoordinate,
  mapViewCoordinateFromLonLat,
  translateLonLatWithMapViewDelta,
} from '~/utils/geography';
import { type Coordinate3D, toRadians } from '~/utils/math';
import { EMPTY_ARRAY } from '~/utils/redux';

export type ShowData = {
  swarm: SwarmSpecification;
  /**
   * The current home positions of the drones in the swarm.
   *
   * Each drone has another home position in its `settings` property.
   * That is considered a default home position that we can use for
   * example to reset changes made to this property.
   */
  homePositions: (Coordinate3D | undefined)[];
  coordinateSystem: OutdoorCoordinateSystemWithOrigin;
};

export type SiteSurveyState = {
  open: boolean;
  selection: Identifier[];
  showData?: ShowData;
};

const initialState: SiteSurveyState = {
  open: false,
  selection: EMPTY_ARRAY,
  showData: undefined,
};

const { reducer, actions } = createSlice({
  name: 'site-survey',
  initialState,
  reducers: {
    // -- Dialog

    /**
     * Opens the dialog.
     *
     * The dialog must always be explicitly initialized with the desired
     * data by the user after it is opened.
     */
    showDialog(state) {
      state.open = true;
    },

    /**
     * Closes the dialog and completely resets its state.
     *
     * The dialog must always be explicitly initialized with the desired
     * data by the user after it is opened.
     */
    closeDialog() {
      // Not only close the dialog, but also reset all the stored data.
      // The dialog should always be explicitly initialized by the user
      // after it is opened.
      return initialState;
    },

    // -- Selection

    updateSelection(
      state,
      action: PayloadAction<{
        mode: 'add' | 'clear' | 'remove' | 'set' | 'toggle';
        ids: Identifier[];
      }>
    ) {
      const { mode, ids } = action.payload;
      if (mode === 'add') {
        state.selection = updateSelectedIds(state.selection, ids);
      } else if (mode === 'clear') {
        state.selection = [];
      } else if (mode === 'remove') {
        state.selection = updateSelectedIds(state.selection, [], ids);
      } else if (mode === 'set') {
        state.selection = updateSelectedIds([], ids);
      } else if (mode === 'toggle') {
        state.selection = updateSelectedIds([], xor(state.selection, ids));
      }
    },
    // -- Intitialization

    /**
     * Initializes the dialog with the given data.
     */
    initializeWithData(state, action: PayloadAction<ShowData>) {
      state.showData = action.payload;
    },

    // -- Transformations

    /**
     * Moves the home positions of the show by the given delta.
     *
     * The given delta is in map coordinates, and assumed to be from the coordinate
     * corresponding to the show origin on the map.
     *
     * @param state The slice's current state.
     * @param action.delta The delta to move the home positions by.
     * @param action.negative Whether to move the home positions in the negative direction.
     */
    moveHomePositionsByMapCoordinateDelta(
      state,
      action: PayloadAction<EasNor>
    ) {
      if (state.showData === undefined) {
        console.warn('Cannot move show: no show data.');
        return;
      }

      const newOriginLonLat = translateLonLatWithMapViewDelta(
        state.showData.coordinateSystem.origin,
        action.payload
      );
      const earthCS = new FlatEarthCoordinateSystem(
        state.showData.coordinateSystem
      );
      const newOrigin = earthCS.fromLonLat(newOriginLonLat);

      state.showData.homePositions = state.showData.homePositions.map(
        (homePosition) => {
          if (homePosition === undefined) {
            return undefined;
          }
          return [
            homePosition[0] + newOrigin[0],
            homePosition[1] + newOrigin[1],
            homePosition[2],
          ];
        }
      );
    },

    /**
     * Moves the show origin relative to its current position such that the delta
     * is expressed in map view coordinates.
     */
    moveOutdoorShowOriginByMapCoordinateDelta(
      state,
      action: PayloadAction<EasNor>
    ) {
      if (state.showData === undefined) {
        console.warn('Cannot move show: no show data.');
        return;
      }

      state.showData.coordinateSystem.origin = translateLonLatWithMapViewDelta(
        state.showData.coordinateSystem.origin,
        action.payload
      );
    },

    /**
     * Rotates the home positions around a given point in map coordinates.
     */
    rotateHomePositions(
      state,
      action: PayloadAction<{
        rotationOriginInMapCoordinates: EasNor;
        angle: number;
      }>
    ) {
      if (state.showData === undefined) {
        console.warn('Cannot rotate home positions: no show data.');
        return;
      }
      const { rotationOriginInMapCoordinates, angle } = action.payload;

      const earthCS = new FlatEarthCoordinateSystem(
        state.showData.coordinateSystem
      );

      // Convert rotation origin from map to lon-lat and then to show coordinates
      const rotationOriginShow = earthCS.fromLonLat(
        lonLatFromMapViewCoordinate(rotationOriginInMapCoordinates)
      );

      state.showData.homePositions = state.showData.homePositions.map(
        (homePosition): Coordinate3D | undefined => {
          if (homePosition === undefined) {
            return undefined;
          }

          const point = new Point(homePosition);
          point.rotate(toRadians(-angle), rotationOriginShow);
          // TODO(vp): rotate heading

          // NOTE: Type assertion justified by the OpenLayers definition of `Coordinate`.
          // https://openlayers.org/en/v9.1.0/apidoc/module-ol_coordinate.html#~Coordinate
          const rotatedPoint = point.getFlatCoordinates() as EasNor;
          if (rotatedPoint.length < 2) {
            console.warn('Invalid rotated point:', rotatedPoint);
            return undefined;
          }

          return [rotatedPoint[0], rotatedPoint[1], homePosition[2]];
        }
      );
    },

    /**
     * Rotates the show origin by the given angle in degrees around a given point,
     * snapping the angle to one decimal digit.
     */
    rotateShow(
      state,
      action: PayloadAction<{
        rotationOriginInMapCoordinates: EasNor;
        angle: number;
      }>
    ) {
      if (state.showData === undefined) {
        console.warn('Cannot rotate show: no show data.');
        return;
      }

      const { rotationOriginInMapCoordinates, angle } = action.payload;
      const showOriginInMapCoordinates = mapViewCoordinateFromLonLat(
        state.showData.coordinateSystem.origin
      );
      const showOriginPoint = new Point(showOriginInMapCoordinates);
      showOriginPoint.rotate(toRadians(-angle), rotationOriginInMapCoordinates);
      const newOrigin = lonLatFromMapViewCoordinate(
        // NOTE: Type assertion justified by the OpenLayers definition of `Coordinate`.
        // https://openlayers.org/en/v9.1.0/apidoc/module-ol_coordinate.html#~Coordinate
        showOriginPoint.getFlatCoordinates() as EasNor
      );

      const newOrientation =
        Number.parseFloat(state.showData.coordinateSystem.orientation) + angle;

      if (!Number.isFinite(newOrientation)) {
        console.warn('Cannot rotate show: invalid orientation.');
        return;
      }

      state.showData.coordinateSystem.origin = newOrigin;
      state.showData.coordinateSystem.orientation = newOrientation.toFixed(1);
    },
  },
});

export const {
  closeDialog,
  initializeWithData,
  moveHomePositionsByMapCoordinateDelta,
  moveOutdoorShowOriginByMapCoordinateDelta,
  rotateHomePositions,
  rotateShow,
  showDialog,
  updateSelection,
} = actions;

export default reducer;
