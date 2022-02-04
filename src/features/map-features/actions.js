import { getNearestFeatureIdForTooltip } from '~/features/session/selectors';
import { setFeatureIdForTooltip } from '~/features/session/slice';
import { openUAVDetailsDialog } from '~/features/uavs/details';
import { globalIdToUavId, isDockId, isUavId } from '~/model/identifiers';

import { getProposedIdForNewFeature } from './selectors';
import { addFeatureById } from './slice';

export const addFeature = (feature) => addFeatureWithName(feature, null);

export const addFeatureWithName = (feature, name) => (dispatch, getState) => {
  const id = getProposedIdForNewFeature(getState(), feature, name);
  dispatch(addFeatureById({ id, feature }));
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
