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
  lonLatFromMapViewCoordinate,
  mapViewCoordinateFromLonLat,
  translateLonLatWithMapViewDelta,
} from '~/utils/geography';
import { Coordinate2D, toRadians } from '~/utils/math';
import { EMPTY_ARRAY } from '~/utils/redux';

export type ShowData = {
  swarm: SwarmSpecification;
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
     * Moves the show origin relative to its current position such that the delta
     * is expressed in map view coordinates.
     */
    moveOutdoorShowOriginByMapCoordinateDelta(
      state,
      action: PayloadAction<Coordinate2D>
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
     * Rotates the show origin by the given angle in degrees around a given point,
     * snapping the angle to one decimal digit.
     */
    rotateShow(
      state,
      action: PayloadAction<{
        rotationOriginInMapCoordinates: Coordinate2D;
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
        showOriginPoint.getFlatCoordinates()
      );

      const newOrientation =
        Number.parseFloat(state.showData.coordinateSystem.orientation) + angle;

      if (!Number.isFinite(newOrientation)) {
        console.warn('Cannot rotate show: invalid orientation.');
        return;
      }

      state.showData.coordinateSystem.origin = [newOrigin[0]!, newOrigin[1]!];
      state.showData.coordinateSystem.orientation = newOrientation.toFixed(1);
    },
  },
});

export const {
  closeDialog,
  initializeWithData,
  moveOutdoorShowOriginByMapCoordinateDelta,
  rotateShow,
  showDialog,
  updateSelection,
} = actions;

export default reducer;
