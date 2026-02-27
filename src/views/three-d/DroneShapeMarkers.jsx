import React from 'react';

const DRONES = [
  { id: 'drone-1', name: 'Drone A', battery: 92, status: 'Idle', pos: [0, 1, 1] },
  { id: 'drone-2', name: 'Drone B', battery: 76, status: 'Flying', pos: [1.5, 1, 1] },
  { id: 'drone-3', name: 'Drone C', battery: 55, status: 'Charging', pos: [3, 1, 1] },
  { id: 'drone-4', name: 'Drone D', battery: 88, status: 'Idle', pos: [-1.5, 1, 1] },
  { id: 'drone-5', name: 'Drone E', battery: 63, status: 'Returning', pos: [-3, 1, 1] },
];

const DroneShapeMarkers = () =>
  DRONES.map((d) => (
    <a-entity
      key={d.id}
      mixin="drone-marker"
      position={d.pos.join(' ')}
      rotation="90 0 0"
      class="three-d-clickable"
      data-drone-id={d.id}
      data-drone-name={d.name}
      data-battery={d.battery}
      data-status={d.status}
    />
  ));

export default DroneShapeMarkers;