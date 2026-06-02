import React from 'react';
import PropTypes from 'prop-types';

function normalizeDrones(drones) {
  if (!Array.isArray(drones) || !drones.length) return [];

  return drones
    .map((d, index) => {
      const id =
        d.id !== undefined && d.id !== null && String(d.id).trim() !== ''
          ? String(d.id)
          : `drone-${index + 1}`;
      const name = d.name || id;
      const battery = Number.isFinite(Number(d.battery)) ? Number(d.battery) : 100;
      const status = d.status || 'Idle';
      const firstPathPoint = Array.isArray(d.path) && d.path.length ? d.path[0] : null;
      const fallbackPos =
        firstPathPoint &&
        Number.isFinite(Number(firstPathPoint.x)) &&
        Number.isFinite(Number(firstPathPoint.y)) &&
        Number.isFinite(Number(firstPathPoint.z))
          ? [Number(firstPathPoint.x), Number(firstPathPoint.y), Number(firstPathPoint.z)]
          : [0, 1, 1];
      let initialPosArray = fallbackPos;
      if (Array.isArray(d.initialPos) && d.initialPos.length === 3) {
        initialPosArray = d.initialPos;
      } else if (Array.isArray(d.initial_position) && d.initial_position.length === 3) {
        initialPosArray = d.initial_position;
      }
      const posArray = firstPathPoint ? fallbackPos : (Array.isArray(d.pos) && d.pos.length === 3 ? d.pos : initialPosArray);
      const yaw = Number.isFinite(Number(d.yaw))
        ? Number(d.yaw)
        : Number.isFinite(Number(d.heading))
          ? Number(d.heading)
          : 0;

      return {
        id,
        name,
        battery,
        status,
        pos: posArray,
        initialPos: initialPosArray,
        path: Array.isArray(d.path) ? d.path : [],
        yaw,
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
      data-heading={d.yaw}
      data-initial-pos={d.initialPos.join(' ')}
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
      yaw: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      heading: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      pos: PropTypes.arrayOf(PropTypes.number),
      initialPos: PropTypes.arrayOf(PropTypes.number),
      initial_position: PropTypes.arrayOf(PropTypes.number),
      path: PropTypes.array,
    })
  ),
};

export default DroneShapeMarkers;
