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
} from './slice';

import { actions as editorActions } from './editor';

export const {
  closeFeatureEditorDialog,
  setFeatureEditorDialogTab,
  showFeatureEditorDialog,
} = editorActions;

export const addFeature = (feature) => addFeatureWithName(feature, null);

export const addFeatureWithName = (feature, name) => (dispatch, getState) => {
  const id = getProposedIdForNewFeature(getState(), feature, name);
  dispatch(addFeatureById({ id, feature }));
};

export const cloneFeatureById = (id, overrides) => (dispatch, getState) => {
  const sourceFeature = getState().features.byId[id];
  dispatch(addFeatureWithName({ ...sourceFeature, ...overrides }, id));
};

export const cutFeature =
  (minuendId, substrahendId) => (dispatch, getState) => {
    const state = getState();
    const minuend = state.features.byId[minuendId];
    const substrahend = state.features.byId[substrahendId];

    const makeTurfPolygonFromFeature = (feature) => ({
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [feature.points, ...(feature.holes ?? [])],
      },
    });

    const result = turfDifference(
      makeTurfPolygonFromFeature(minuend),
      makeTurfPolygonFromFeature(substrahend)
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

    dispatch(setSelection([featureIdToGlobalId(substrahendId)]));
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
    const uavId = globalIdToUavId(featureId);
    if (uavId) {
      action = openUAVDetailsDialog(uavId);
    }
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
