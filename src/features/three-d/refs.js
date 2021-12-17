import React from 'react';

/**
 * React reference to the camera of the 3D view.
 */
export const cameraRef = React.createRef();

/**
 * Retrieves the DOM node of the drone flock that the camera is looking at.
 */
export function getDroneFlockDOMNode() {
  const scene = getSceneDOMNode();
  return scene ? scene.querySelector('a-drone-flock') : undefined;
}

/**
 * Retrieves the DOM node of the scene containing the camera of the 3D view.
 */
export function getSceneDOMNode() {
  let node = cameraRef.current;

  while (node && node.nodeName && node.nodeName.toLowerCase() !== 'a-scene') {
    node = node.parentNode;
  }

  if (node && node.nodeName && node.nodeName.toLowerCase() === 'a-scene') {
    return node;
  }
}
