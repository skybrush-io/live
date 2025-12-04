import AFrame from '@skybrush/aframe-components';
import { showError } from '~/features/snackbar/actions';
import { getActiveUAVIds } from '~/features/uavs/selectors';

import { getDroneFlockDOMNode } from './refs';
import { rotateViewTowards } from './slice';

export { resetZoom } from './slice';

const { THREE } = AFrame;

export const rotateViewToDrones = () => (dispatch, getState) => {
  const state = getState();

  // This will include drones that are sleeping, but that's okay.
  // See discussion in https://github.com/skybrush-io/live/issues/80
  const activeUAVIds = getActiveUAVIds(state);
  if (activeUAVIds.length === 0) {
    dispatch(showError('No active UAVs to focus the view on.'));
    return;
  }

  const flockDOMNode = getDroneFlockDOMNode();
  const flockComponent = flockDOMNode?.components['drone-flock'];
  if (!flockComponent) {
    console.warn(
      'No drone flock component is mounted in the DOM; this is probably a bug.'
    );
    return;
  }

  const center = new THREE.Vector3();
  let numberOfVisibleEntities = 0;
  for (const uavId of activeUAVIds) {
    const entity = flockComponent.getEntityForUAVById(uavId);
    const position = entity?.getAttribute('position');
    if (position) {
      center.add(position);
      numberOfVisibleEntities += 1;
    }
  }

  if (numberOfVisibleEntities > 0) {
    center.divideScalar(numberOfVisibleEntities);
    dispatch(rotateViewTowards(center.toArray()));
  }
};
