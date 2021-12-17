import { take } from 'redux-saga/effects';

import { skybrushToThreeJsPosition } from '@skybrush/aframe-components/lib/spatial';

import { cameraRef, getSceneDOMNode } from './refs';
import { resetZoom, rotateViewTowards } from './slice';

/**
 * Saga that listens for camera-related actions dispatched from the store and
 * animates the 3D view appropriately.
 */
export default function* cameraAnimatorSaga() {
  const RESET_ZOOM = resetZoom.toString();
  const ROTATE_VIEW_TOWARDS = rotateViewTowards.toString();

  while (true) {
    const action = yield take([RESET_ZOOM, ROTATE_VIEW_TOWARDS]);
    const controller = getCameraController();

    if (controller) {
      switch (action.type) {
        case RESET_ZOOM:
          controller.resetZoom();
          setFocusOnScene();
          break;

        case ROTATE_VIEW_TOWARDS:
          handleViewRotationTowards(controller, action.payload);
          setFocusOnScene();
          break;

        default:
          break;
      }
    }
  }
}

/**
 * Finds the AFrame camera controller component in the entity referenced by the
 * cameraRef.
 */
function getCameraController() {
  if (cameraRef.current) {
    const components = cameraRef.current.components;
    return components ? components['advanced-camera-controls'] : null;
  }

  return null;
}

function handleViewRotationTowards(controller, point) {
  const target = { lookAt: skybrushToThreeJsPosition(point) };
  controller.startTransitionTo(target);
}

/**
 * Sets the focus to the scene containing the camera that the saga is controlling.
 */
function setFocusOnScene() {
  const scene = getSceneDOMNode();
  if (scene && scene.focus) {
    scene.focus();
  }
}
