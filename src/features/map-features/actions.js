import { getProposedIdForNewFeature } from './selectors';
import { addFeatureById } from './slice';

export const addFeature = (feature) => addFeatureWithName(feature, null);

export const addFeatureWithName = (feature, name) => (dispatch, getState) => {
  const id = getProposedIdForNewFeature(getState(), feature, name);
  dispatch(addFeatureById({ id, feature }));
};
