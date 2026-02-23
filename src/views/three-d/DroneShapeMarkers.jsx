import React from 'react';

/**
 * Fixed positions for demo drone-shaped circles in the 3D view (local coordinates).
 * Y is up in the scene; positions are slightly above ground to avoid z-fighting.
 */
const DRONE_SHAPE_POSITIONS = [
  [0, 1, 1],
  [1.5, 1, 1],
  [3, 1, 1],
  [-1.5, 1, 1],
  [-3, 1, 1],
];

/**
 * Renders a few circular drone-shaped markers in the 3D view for reference/demo.
 */
const DroneShapeMarkers = () =>
  DRONE_SHAPE_POSITIONS.map((pos, index) => (
    <a-entity
      key={index}
      class="three-d-clickable"
      mixin="drone-marker"
      position={pos.join(' ')}
      rotation="0 0 0"
    >
      {/* 👇 이게 raycast용 invisible collider */}
      <a-entity
        geometry="primitive: sphere; radius: 0.5"
        material="opacity: 0; transparent: true"
      />
    </a-entity>
  ));

export default DroneShapeMarkers;
