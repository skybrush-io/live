import turfDifference from '@turf/difference';

import { setSelection } from '~/features/map/selection';
import { getNearestFeatureIdForTooltip } from '~/features/session/selectors';
import { setFeatureIdForTooltip } from '~/features/session/slice';
import { openUAVDetailsDialog } from '~/features/uavs/details';
import {
  featureIdToGlobalId,
  globalIdToUavId,
  isDockId,
  isUavId,
} from '~/model/identifiers';

import { getProposedIdForNewFeature } from './selectors';
import { addFeatureById, updateFeaturePropertiesByIds } from './slice';

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

    const [points, ...holes] =
      result.geometry.type === 'MultiPolygon'
        ? result.geometry.coordinates[0]
        : result.geometry.coordinates;

    dispatch(
      updateFeaturePropertiesByIds({
        [minuendId]: { points, holes },
      })
    );

    dispatch(setSelection([featureIdToGlobalId(substrahendId)]));
  };

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
