/**
 * @file Redux slice for the show configurator dialog.
 */

import {
  type CaseReducer,
  createSlice,
  type PayloadAction,
} from '@reduxjs/toolkit';
import type { SwarmSpecification } from '@skybrush/show-format';
import xor from 'lodash-es/xor';
import { Point } from 'ol/geom';

import { type FeatureSelectionMode } from '~/components/map/interactions/types';
import { updateSelection as updateSelectedIds } from '~/features/map/utils';
import type { OutdoorCoordinateSystemWithOrigin } from '~/features/show/types';
import type { Identifier } from '~/utils/collections';
import {
  type EasNor,
  FlatEarthCoordinateSystem,
  type LonLat,
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
  homePositions: Array<Coordinate3D | undefined>;
  coordinateSystem: OutdoorCoordinateSystemWithOrigin;
};

export type AdaptResult = {
  show: string;
  takeoffLengthChange: number;
  rthLengthChange: number;
};

type AdaptResultOrStatus = AdaptResult | { error: string } | { loading: true };

export type ShowConfiguratorState = {
  open: boolean;
  selection: Identifier[];
  settings: {
    dronesVisible: boolean;
  };
  showData?: ShowData;
  adaptResult?: AdaptResultOrStatus;
};

const initialState: ShowConfiguratorState = {
  open: false,
  selection: EMPTY_ARRAY,
  settings: {
    dronesVisible: true,
  },
  showData: undefined,
  adaptResult: undefined,
};

// prettier-ignore
const historyReducers: {
  historyInit: CaseReducer;
  historyJump: CaseReducer<ShowConfiguratorState, PayloadAction<number>>;
  historyRedo: CaseReducer;
  historySnap: CaseReducer;
  historyUndo: CaseReducer;
} = {
  historyInit() { /* do nothing, to be handled by `redux-undo` */ },
  historyJump() { /* do nothing, to be handled by `redux-undo` */ },
  historyRedo() { /* do nothing, to be handled by `redux-undo` */ },
  historySnap() { /* do nothing, to be handled by `redux-undo` */ },
  historyUndo() { /* do nothing, to be handled by `redux-undo` */ },
};

const { reducer, actions } = createSlice({
  name: 'show-configurator',
  initialState,
  reducers: {
    // -- History

    ...historyReducers,

    // -- Dialog

    /**
     * Opens the dialog.
     */
    showDialog(state, action: PayloadAction<ShowData | undefined>) {
      state.open = true;
      if (action.payload !== undefined) {
        state.showData = action.payload;
      }
    },

    /**
     * Closes the dialog and completely resets its state.
     *
     * The dialog must always be explicitly initialized with the desired
     * data by the user after it is opened.
     */
    closeDialog(state) {
      // Not only close the dialog, but also reset all the stored data.
      // The dialog should always be explicitly initialized by the user
      // after it is opened.
      // Keep the settings, though.
      return { ...initialState, settings: { ...state.settings } };
    },

    // -- Selection

    /**
     * Updates the selection.
     */
    updateSelection: {
      prepare: (mode: FeatureSelectionMode, ids: Identifier[]) => ({
        payload: { mode, ids },
      }),
      reducer(
        state,
        action: PayloadAction<{ mode: FeatureSelectionMode; ids: Identifier[] }>
      ) {
        const { mode, ids } = action.payload;
        // eslint-disable-next-line unicorn/prefer-switch
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
    },

    // -- Settings

    /**
     * Sets whether the drones are visible.
     */
    setDronesVisible(state, action: PayloadAction<boolean>) {
      state.settings.dronesVisible = action.payload;
    },

    // -- Intitialization

    /**
     * Initializes the dialog with the given data.
     */
    initializeWithData(state, action: PayloadAction<ShowData>) {
      state.showData = action.payload;
      state.adaptResult = undefined;
    },

    // -- Show adapt

    /**
     * Stores the given show adapt result.
     *
     * If `undefined`, the result is cleared.
     */
    setAdaptResult(
      state,
      action: PayloadAction<AdaptResultOrStatus | undefined>
    ) {
      state.adaptResult = action.payload;
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
     * @param action.drones The set of drones whose home positions should be moved.
     *        Technically a record where the drone indexes are the keys. Values are
     *        ignored. If `undefined`, all drones are moved.
     */
    moveHomePositionsByMapCoordinateDelta(
      state,
      action: PayloadAction<{
        delta: EasNor;
        drones?: Record<number, unknown>;
      }>
    ) {
      if (state.showData === undefined) {
        console.warn('Cannot move home positions: no show data.');
        return;
      }

      const { delta, drones } = action.payload;
      const shouldMoveDrone = // Function that returns if a drone should be moved.
        drones === undefined ? () => true : (index: number) => index in drones;

      const newOriginLonLat = translateLonLatWithMapViewDelta(
        state.showData.coordinateSystem.origin,
        delta
      );
      const earthCS = new FlatEarthCoordinateSystem(
        state.showData.coordinateSystem
      );
      const newOrigin = earthCS.fromLonLat(newOriginLonLat);

      state.showData.homePositions = state.showData.homePositions.map(
        (homePosition, index) => {
          if (homePosition === undefined || !shouldMoveDrone(index)) {
            return homePosition;
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
     * Expects an array of home position index - desired position pairs and moves
     * the specified home positions to the given positions.
     *
     * Home positions whose index is not in the array are not moved. The same
     * applies to home positions whose target poristion is `undefined`.
     */
    moveHomePositionsToLonLat(
      state,
      action: PayloadAction<Array<[number, LonLat | undefined]>>
    ) {
      if (state.showData === undefined) {
        console.warn('Cannot move home positions: no show data.');
        return;
      }

      const earthCS = new FlatEarthCoordinateSystem(
        state.showData.coordinateSystem
      );

      for (const [homePositionIndex, newLonLat] of action.payload) {
        if (newLonLat === undefined) {
          continue;
        }

        const newOrigin = earthCS.fromLonLat(newLonLat);
        const current = state.showData.homePositions[homePositionIndex];
        state.showData.homePositions[homePositionIndex] = [
          newOrigin[0],
          newOrigin[1],
          current ? current[2] : 0,
        ];
      }
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
     *
     * @param state The slice's current state.
     * @param action.angle The rotation angle in degrees.
     * @param action.drones The set of drones whose home positions should be rotated.
     *        Technically a record where the drone indexes are the keys. Values are
     *        ignored. If `undefined`, all drones are rotated.
     */
    rotateHomePositions(
      state,
      action: PayloadAction<{
        rotationOriginInMapCoordinates: EasNor;
        angle: number;
        drones?: Record<number, unknown>;
      }>
    ) {
      if (state.showData === undefined) {
        console.warn('Cannot rotate home positions: no show data.');
        return;
      }

      const { rotationOriginInMapCoordinates, angle, drones } = action.payload;
      const shouldRotateDrone = // Function that returns if a drone should be rotated.
        drones === undefined ? () => true : (index: number) => index in drones;

      const earthCS = new FlatEarthCoordinateSystem(
        state.showData.coordinateSystem
      );

      // Convert rotation origin from map to lon-lat and then to show coordinates
      const rotationOriginShow = earthCS.fromLonLat(
        lonLatFromMapViewCoordinate(rotationOriginInMapCoordinates)
      );

      state.showData.homePositions = state.showData.homePositions.map(
        (homePosition, index): Coordinate3D | undefined => {
          if (homePosition === undefined || !shouldRotateDrone(index)) {
            return homePosition;
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
  historyInit,
  historyJump,
  historyRedo,
  historySnap,
  historyUndo,
  initializeWithData,
  moveHomePositionsByMapCoordinateDelta,
  moveHomePositionsToLonLat,
  moveOutdoorShowOriginByMapCoordinateDelta,
  rotateHomePositions,
  rotateShow,
  setAdaptResult,
  setDronesVisible,
  showDialog,
  updateSelection,
} = actions;

export default reducer;
