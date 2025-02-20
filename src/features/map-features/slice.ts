/**
 * @file Slice of the state object that handles the user-defined features on
 * the map.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { type Feature } from '~/model/features';
import {
  addItemToBack,
  type Collection,
  deleteItemsByIds,
} from '~/utils/collections';

import { type FeatureWithProperties, type FeatureProperties } from './types';

type OptionalBoolean = undefined | boolean;
const optionalBooleanStates: OptionalBoolean[] = [undefined, true, false];
const toggleOptionalBoolean = (state: OptionalBoolean): OptionalBoolean =>
  optionalBooleanStates[
    (optionalBooleanStates.indexOf(state) + 1) % optionalBooleanStates.length
  ];

type MapFeaturesSliceState = Collection<FeatureWithProperties>;

const initialState: MapFeaturesSliceState = {
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
};

// TODO: Generalize property updates with something like:
// const updateFeaturePropertyById = <
//   Property extends keyof FeatureProperties
// >(
//   state: MapFeaturesState,
//   id: FeatureWithProperties['id'],
//   property: Property,
//   value: FeatureProperties[Property]
// ): void => {
//   const feature = state.byId[id];
//   if (feature === undefined) {
//     console.warn(`Cannot update non-existent feature ${id}`);
//   } else {
//     feature[property] = value;
//   }
// };

type FeaturePropertyUpdates = {
  [Property in keyof FeatureProperties]: FeatureProperties[Property];
};

const { actions, reducer } = createSlice({
  name: 'features',
  initialState,
  reducers: {
    addFeatureById(
      state,
      action: PayloadAction<{
        id: FeatureProperties['id'];
        feature: Feature;
        properties?: Partial<Omit<FeatureProperties, 'id'>>;
      }>
    ) {
      const { id, feature, properties } = action.payload;
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
      const newFeature: FeatureProperties = {
        id,
        visible: true,
        ...structuredClone(feature),
        ...properties,
      };

      // Store the ID of the feature that is about to be inserted on the
      // action so the caller of this action can decide what to do with it
      // TODO: Make passing the `id` cleaner!
      (action as Record<string, unknown>)['featureId'] = id;

      // Update the state
      addItemToBack(state, newFeature);
    },

    removeFeaturesByIds(
      state,
      action: PayloadAction<Array<FeatureProperties['id']>>
    ) {
      deleteItemsByIds(state, action.payload);
    },

    renameFeature(
      state,
      action: PayloadAction<{
        id: FeatureProperties['id'];
        name: FeatureProperties['label'];
      }>
    ) {
      const { id, name } = action.payload;
      const feature = state.byId[id];

      if (feature === undefined) {
        console.warn(`Cannot rename non-existent feature ${id}`);
      } else {
        feature.label = name === '' ? undefined : name;
      }
    },

    setFeatureColor(
      state,
      action: PayloadAction<{
        id: FeatureProperties['id'];
        color: FeatureProperties['color'];
      }>
    ) {
      const { id, color } = action.payload;
      const feature = state.byId[id];

      if (feature === undefined) {
        console.warn(`Cannot set color of non-existent feature ${id}`);
      } else {
        feature.color = color;
      }
    },

    updateFeatureAttributes(
      state,
      action: PayloadAction<{
        id: FeatureProperties['id'];
        attributes: Record<string, unknown>;
      }>
    ) {
      const { id, attributes } = action.payload;
      const feature = state.byId[id];

      if (feature === undefined) {
        console.warn(`Cannot set attributes of non-existent feature ${id}`);
      } else {
        feature.attributes = { ...feature.attributes, ...attributes };
      }
    },

    toggleFeatureFillVisible(
      state,
      action: PayloadAction<{
        id: FeatureProperties['id'];
      }>
    ) {
      const { id } = action.payload;
      const feature = state.byId[id];

      if (feature === undefined) {
        console.warn(
          `Cannot toggle fill visibility of non-existent feature ${id}`
        );
      } else {
        feature.filled = toggleOptionalBoolean(feature.filled);
      }
    },

    toggleFeatureMeasurementVisible(
      state,
      action: PayloadAction<{
        id: FeatureProperties['id'];
      }>
    ) {
      const { id } = action.payload;
      const feature = state.byId[id];

      if (feature === undefined) {
        console.warn(
          `Cannot toggle measurement visibility of non-existent feature ${id}`
        );
      } else {
        feature.measure = toggleOptionalBoolean(feature.measure);
      }
    },

    toggleFeaturePointsVisible(
      state,
      action: PayloadAction<{
        id: FeatureProperties['id'];
      }>
    ) {
      const { id } = action.payload;
      const feature = state.byId[id];

      if (feature === undefined) {
        console.warn(
          `Cannot toggle point visibility of non-existent feature ${id}`
        );
      } else {
        feature.showPoints = toggleOptionalBoolean(feature.showPoints);
      }
    },

    updateFeaturePropertiesByIds(
      state,
      action: PayloadAction<
        Record<FeatureProperties['id'], FeaturePropertyUpdates>
      >
    ) {
      for (const [id, properties] of Object.entries(action.payload)) {
        const feature = state.byId[id];
        if (feature) {
          Object.assign(feature, properties);
        }
      }
    },

    updateFeatureVisibility(
      state,
      action: PayloadAction<{
        id: FeatureProperties['id'];
        visible: FeatureProperties['visible'];
      }>
    ) {
      const { id, visible } = action.payload;
      const feature = state.byId[id];

      if (feature === undefined) {
        console.warn(`Cannot set visibility of non-existent feature ${id}`);
      } else {
        feature.visible = Boolean(visible);
      }
    },
  },
});

export const {
  addFeatureById,
  removeFeaturesByIds,
  renameFeature,
  setFeatureColor,
  toggleFeatureFillVisible,
  toggleFeatureMeasurementVisible,
  toggleFeaturePointsVisible,
  updateFeatureAttributes,
  updateFeaturePropertiesByIds,
  updateFeatureVisibility,
} = actions;

export default reducer;
