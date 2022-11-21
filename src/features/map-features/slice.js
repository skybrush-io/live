/**
 * @file Slice of the state object that handles the user-defined features on
 * the map.
 */

import { createSlice } from '@reduxjs/toolkit';

import { addItemToBack, deleteItemsByIds } from '~/utils/collections';

const { actions, reducer } = createSlice({
  name: 'features',

  initialState: {
    byId: {
      /*
        examplePolygon: {
          id: 'examplePolygon',
          type: FeatureType.POLYGON,
          points: [
            [19.061313, 47.47404],
            [19.063373, 47.473699],
            [19.063619, 47.471821],
            [19.061001, 47.471835]
          ],
          label: 'Test polygon',
          color: '#ffcc00',
          labelStyle: LabelStyle.THIN_OUTLINE,
          visible: true,
          filled: true,
          showPoints: false,
        },
        examplePoint: {
          id: 'examplePoint',
          type: FeatureType.POINTS,
          points: [
            [ lon, lat ]
          ],
          visible: true
        },
        examplePointSet: {
          id: 'examplePointSet',
          type: FeatureType.POINTS,
          points: [
            [ lon, lat ],
            [ lon, lat ],
            [ lon, lat ],
            ...
          ],
          visible: true
        },
        examplePath: {
          id: 'examplePath',
          type: FeatureType.LINE_STRING,
          points: [
            [ lon, lat ],
            [ lon, lat ],
            [ lon, lat ],
            ...
          ],
          showPoints: false,
        },
        exampleCircle: {
          id: 'exampleCircle',
          type: FeatureType.CIRCLE,
          // two points will define the circle exactly; the first one is the
          // center, the second one is an arbitrary point on the circumference
          // of the circle
          points: [
            [ lon, lat ],
            [ lon, lat ]
          ],
          color: '#ffcc00',
        },
        examplePolygon: {
          id: 'examplePolygon',
          type: FeatureType.POLYGON,
          points: [
            [ lon, lat ],
            [ lon, lat ],
            [ lon, lat ],
            ...
          ],
          color: '#ffcc00'
        }
        */
    },

    order: [],
  },

  reducers: {
    addFeatureById(state, action) {
      const { id, feature } = action.payload;
      const { points, type } = feature;

      if (!id) {
        throw new Error('Feature must have an ID');
      }

      if (!type) {
        throw new Error('Feature must have a type');
      }

      if (!points || points.length === 0) {
        throw new Error('Feature must have at least one point');
      }

      if (state.byId[id]) {
        throw new Error('Feature ID is already taken');
      }

      // Generate the new feature object by copying the argument and ensuring
      // that it has the chosen ID
      const newFeature = {
        visible: true,
        filled: true,
        showPoints: false,
        ...structuredClone(feature),
        id,
      };

      // Store the ID of the feature that is about to be inserted on the
      // action so the caller of this action can decide what to do with it
      action.featureId = id;

      // Update the state
      addItemToBack(state, newFeature);
    },

    removeFeaturesByIds(state, action) {
      return deleteItemsByIds(state, action.payload);
    },

    renameFeature(state, action) {
      const { id, name } = action.payload;
      state.byId[id].label = name;
    },

    setFeatureColor(state, action) {
      const { id, color } = action.payload;
      state.byId[id].color = color;
    },

    updateFeatureFillVisible(state, action) {
      const { id, filled } = action.payload;
      state.byId[id].filled = Boolean(filled);
    },

    updateFeaturePointsVisible(state, action) {
      const { id, visible } = action.payload;
      state.byId[id].showPoints = Boolean(visible);
    },

    updateFeaturePropertiesByIds(state, action) {
      for (const [id, properties] of Object.entries(action.payload)) {
        const feature = state.byId[id];
        if (feature) {
          Object.assign(feature, properties)
        }
      }
    },

    updateFeatureVisibility(state, action) {
      const { id, visible } = action.payload;
      state.byId[id].visible = Boolean(visible);
    },
  },
});

export const {
  addFeatureById,
  removeFeaturesByIds,
  renameFeature,
  setFeatureColor,
  updateFeatureFillVisible,
  updateFeaturePointsVisible,
  updateFeaturePropertiesByIds,
  updateFeatureVisibility,
} = actions;

export default reducer;
