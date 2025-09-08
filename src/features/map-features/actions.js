import isEqualWith from 'lodash-es/isEqualWith';
import isNil from 'lodash-es/isNil';
import reject from 'lodash-es/reject';
import turfDifference from '@turf/difference';

import { setSelection } from '~/features/map/selection';
import { getNearestFeatureIdForTooltip } from '~/features/session/selectors';
import { setFeatureIdForTooltip } from '~/features/session/slice';
import { openUAVDetailsDialog } from '~/features/uavs/details';
import {
  featureIdToGlobalId,
  globalIdToFeatureId,
  globalIdToUavId,
  isDockId,
  isFeatureId,
  isUavId,
} from '~/model/identifiers';
import { getSelection } from '~/selectors/selection';

import {
  getFeatureById,
  getFeaturesInOrder,
  getProposedIdForNewFeature,
  getSelectedFeatureIds,
} from './selectors';
import {
  addFeatureById,
  removeFeaturesByIds,
  updateFeaturePropertiesByIds,
  updateFeatureVisibility,
} from './slice';

import { actions as editorActions } from './editor';

export const {
  closeFeatureEditorDialog,
  setFeatureEditorDialogTab,
  showFeatureEditorDialog,
} = editorActions;

export const addFeature = (feature) => addFeatureWithName(feature, null);

/**
 * Action that checks if a feature with matching comparison properties can be
 * found on the map, and adds a new one in case it is missing.
 *
 * PERF: Make this comparison hash based if it ever becomes a bottleneck
 */
export const addFeatureIfMissing =
  (feature, comparisonProperties) => (dispatch, getState) => {
    const state = getState();
    const match = getFeaturesInOrder(state).find((f) =>
      comparisonProperties.every((cp) =>
        isEqualWith(f[cp], feature[cp], (a, b) => {
          // Compare numbers up to only 7 decimal digits to avoid mismatches
          // caused by scaling coordinates to JSON safe integer representations.
          if (typeof a === 'number' && typeof b === 'number') {
            return Math.round(a * 1e7) === Math.round(b * 1e7);
          }
        })
      )
    );
    if (!match) {
      dispatch(addFeature(feature));
    }
  };

export const addFeatureWithName = (feature, name) => (dispatch, getState) => {
  const id = getProposedIdForNewFeature(getState(), feature, name);
  dispatch(addFeatureById({ id, feature }));
};

export const cloneFeatureById = (id, overrides) => (dispatch, getState) => {
  const sourceFeature = getState().features.byId[id];
  dispatch(addFeatureWithName({ ...sourceFeature, ...overrides }, id));
};

export const cutFeature = (minuendId, subtrahendId) => (dispatch, getState) => {
  const state = getState();
  const minuend = state.features.byId[minuendId];
  const subtrahend = state.features.byId[subtrahendId];

  const makeTurfPolygonFromFeature = (feature) => ({
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [feature.points, ...(feature.holes ?? [])],
    },
  });

  const result = turfDifference(
    makeTurfPolygonFromFeature(minuend),
    makeTurfPolygonFromFeature(subtrahend)
  );

  switch (result.geometry.type) {
    case 'Polygon': {
      const [points, ...holes] = result.geometry.coordinates;
      dispatch(
        updateFeaturePropertiesByIds({
          [minuendId]: { points, holes },
        })
      );

      break;
    }

    case 'MultiPolygon': {
      dispatch(removeFeaturesByIds([minuendId]));
      for (const [points, ...holes] of result.geometry.coordinates) {
        dispatch(cloneFeatureById(minuendId, { points, holes }));
      }

      break;
    }

    default:
      throw new Error(`Unexpected geometry type: ${result.geometry.type}`);
  }

  dispatch(setSelection([featureIdToGlobalId(subtrahendId)]));
};

/**
 * Action factory that returns a thunk that removes the selected features from
 * the map.
 */
export const removeSelectedFeatures = () => (dispatch, getState) =>
  dispatch(removeFeaturesByIds(getSelectedFeatureIds(getState())));

/**
 * Action that shows the details dialog of a given feature if it has one.
 * Note that if a tooltip is being shown in the map view, the feature belonging
 * to the tooltip has precedence over the provided feature for UX reasons.
 */
export const showDetailsForFeatureById = (featureId) => (dispatch) => {
  let action;

  if (isUavId(featureId)) {
    action = openUAVDetailsDialog(globalIdToUavId(featureId));
  } else if (isFeatureId(featureId)) {
    action = showFeatureEditorDialog(globalIdToFeatureId(featureId));
  } else if (isDockId(featureId)) {
    /* TODO(ntamas) */
  }

  if (action) {
    dispatch(setFeatureIdForTooltip(null));
    dispatch(action);
  }
};

/**
 * Action that shows the details dialog of a given feature if it has one.
 * Note that if a tooltip is being shown in the map view, the feature belonging
 * to the tooltip has precedence over the provided feature for UX reasons.
 */
export const showDetailsForFeatureInTooltipOrGivenFeature =
  (feature) => (dispatch, getState) => {
    const tooltipFeatureId = getNearestFeatureIdForTooltip(getState());
    const effectiveFeatureId = tooltipFeatureId || feature?.getId();
    if (effectiveFeatureId) {
      dispatch(showDetailsForFeatureById(effectiveFeatureId));
    }
  };

/**
 * Thunk that selects a feature of the given type on the map if there is only a
 * single such feature that is owned by the user.
 */
export const selectSingleFeatureOfTypeUnlessAmbiguous =
  (featureType) => (dispatch, getState) => {
    const state = getState();
    const candidates = getFeaturesInOrder(state).filter(
      (f) => f.type === featureType && f.owner === 'user'
    );

    if (candidates.length === 1) {
      const otherSelection = reject(
        getSelection(state),
        (id) =>
          isFeatureId(id) &&
          getFeatureById(state, globalIdToFeatureId(id)).type === featureType
      );
      dispatch(
        setSelection([...otherSelection, featureIdToGlobalId(candidates[0].id)])
      );
    }
  };

/**
 * Action factory that creates an action that sets the set of selected
 * feature IDs on the map.
 *
 * @param {Array.<string>} ids - The IDs of the selected features.
 *        Any feature whose ID is not in this set will be deselected,
 *        and so will be anything else that is not a map feature.
 * @return {Object} An appropriately constructed action
 */
export const setSelectedFeatureIds = (ids) =>
  setSelection(
    (Array.isArray(ids) ? ids : [])
      .filter((id) => !isNil(id))
      .map((id) => featureIdToGlobalId(id))
  );

/**
 * Thunk factory for toggling the visibility of a map feature with the given ID.
 */
export const toggleFeatureVisibility = (id) => (dispatch, getState) => {
  const state = getState();
  const feature = getFeatureById(state, id);
  if (feature) {
    dispatch(
      // TODO: Add `prepare` functions to `updateFeature...` action creators!
      updateFeatureVisibility({ id: feature.id, visible: !feature.visible })
    );
  }
};
