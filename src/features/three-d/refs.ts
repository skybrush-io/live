import React from 'react';

/**
 * React reference to the camera of the 3D view.
 */
export const cameraRef = React.createRef<HTMLElement>();

/**
 * Retrieves the DOM node of the drone flock that the camera is looking at.
 */
export function getDroneFlockDOMNode(): HTMLElement | undefined {
  const scene = getSceneDOMNode();
  return scene
    ? (scene.querySelector('a-drone-flock') ?? undefined)
    : undefined;
}

/**
 * Retrieves the DOM node of the scene containing the camera of the 3D view.
 */
export function getSceneDOMNode(): HTMLElement | undefined {
  let node: Node | null | undefined = cameraRef.current;

  while (node && node.nodeName && node.nodeName.toLowerCase() !== 'a-scene') {
    node = node.parentNode;
  }

  if (node && node.nodeName && node.nodeName.toLowerCase() === 'a-scene') {
    return node as HTMLElement;
  }

  return undefined;
}
