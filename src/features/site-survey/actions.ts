import type { Feature as OLFeature } from 'ol';
import type OLEvent from 'ol/events/Event';
import { batch } from 'react-redux';

import type { AppDispatch } from '~/store/reducers';

export type FeatureUpdateType = 'modify' | 'transform';
export type FeatureUpdateOptions = {
  event: OLEvent;
  type: FeatureUpdateType;
};

function _updateModifiedFeatures(
  dispatch: AppDispatch,
  features: OLFeature[],
  options: FeatureUpdateOptions
) {
  // Partial, modified version of_handleFeatureUpdatesInOpenLayers() in model/openlayers.js
  // TODO(vp): refactor to avoid code duplication.
  console.log('TODO: _updateModifiedFeatures', features, options);
}

// Using batch will not be necessary after upgrading to React 18.
// See https://react-redux.js.org/api/batch
export const updateModifiedFeatures = (
  dispatch: AppDispatch,
  features: OLFeature[],
  options: FeatureUpdateOptions
) => batch(() => _updateModifiedFeatures(dispatch, features, options));
