import React from 'react';
import PropTypes from 'prop-types';

const DEFAULT_DRONES = [
  { id: 'drone-1', name: 'Drone A', battery: 92, status: 'Idle', pos: [0, 1, 1] },
  { id: 'drone-2', name: 'Drone B', battery: 76, status: 'Flying', pos: [1.5, 1, 1] },
  { id: 'drone-3', name: 'Drone C', battery: 55, status: 'Charging', pos: [3, 1, 1] },
  { id: 'drone-4', name: 'Drone D', battery: 88, status: 'Idle', pos: [-1.5, 1, 1] },
  { id: 'drone-5', name: 'Drone E', battery: 63, status: 'Returning', pos: [-3, 1, 1] },
];

function normalizeDrones(drones) {
  if (!Array.isArray(drones) || !drones.length) return DEFAULT_DRONES;

  return drones
    .map((d, index) => {
      const id = d.id || `drone-${index + 1}`;
      const name = d.name || id;
      const battery = Number.isFinite(Number(d.battery)) ? Number(d.battery) : 100;
      const status = d.status || 'Idle';
      const posArray = Array.isArray(d.pos) && d.pos.length === 3 ? d.pos : [0, 1, 1];

      return {
        id,
        name,
        battery,
        status,
        pos: posArray,
        path: Array.isArray(d.path) ? d.path : [],
      };
    })
    .filter((d) => d.id);
}

const DroneShapeMarkers = ({ drones }) => {
  const items = normalizeDrones(drones);

  return items.map((d) => (
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
      data-path={d.path && d.path.length ? JSON.stringify(d.path) : undefined}
    />
  ));
};

DroneShapeMarkers.propTypes = {
  drones: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      battery: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      status: PropTypes.string,
      pos: PropTypes.arrayOf(PropTypes.number),
      path: PropTypes.array,
    })
  ),
};

export default DroneShapeMarkers;