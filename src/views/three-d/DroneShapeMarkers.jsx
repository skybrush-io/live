import React from 'react';

/**
 * Fixed positions for demo drone-shaped circles in the 3D view (local coordinates).
 * Y is up in the scene; positions are slightly above ground to avoid z-fighting.
 */
const DRONE_SHAPE_POSITIONS = [
  [0, 1, 0],
  [1.5, 1, 0],
  [3, 1, 0],
  [-1.5, 1, 0],
  [-3, 1, 0],
];

/**
 * Renders a few circular drone-shaped markers in the 3D view for reference/demo.
 */
const DroneShapeMarkers = () =>
  DRONE_SHAPE_POSITIONS.map((pos, index) => (
    <a-entity
      key={`drone-marker-${index}`}
      mixin='drone-marker'
      position={pos.join(' ')}
    />
  ));

export default DroneShapeMarkers;
