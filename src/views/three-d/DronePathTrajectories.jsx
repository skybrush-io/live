import PropTypes from 'prop-types';
import React, { memo, useMemo } from 'react';

import Colors from '~/components/colors';

import Trajectory from './Trajectory';

const DEFAULT_LINE_WIDTH = 8;
const WAYPOINT_RADIUS = 0.12;
const START_POINT_RADIUS = 0.18;
const END_POINT_RADIUS = 0.16;

const pathPointToTuple = (point) => {
  const x = Number(point?.x);
  const y = Number(point?.y);
  const z = Number(point?.z);

  return Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)
    ? [x, y, z]
    : null;
};

const getWaypointRadius = (index, count) => {
  if (index === 0) return START_POINT_RADIUS;
  if (index === count - 1) return END_POINT_RADIUS;
  return WAYPOINT_RADIUS;
};

const getWaypointColor = (index, count) => {
  if (index === 0) return Colors.doneMissionItem;
  if (index === count - 1) return Colors.error;
  return Colors.selectedMissionItem;
};

const pointsAreEqual = (a, b) =>
  Array.isArray(a) &&
  Array.isArray(b) &&
  a.length >= 3 &&
  b.length >= 3 &&
  a[0] === b[0] &&
  a[1] === b[1] &&
  a[2] === b[2];

const DronePathTrajectories = ({
  drones,
  lineWidth = DEFAULT_LINE_WIDTH,
  selectedDroneId,
}) => {
  const trajectories = useMemo(
    () =>
      (Array.isArray(drones) ? drones : [])
        .map((drone, index) => {
          const id =
            drone?.id !== undefined && drone?.id !== null && String(drone.id).trim() !== ''
              ? String(drone.id)
              : `drone-${index + 1}`;

          if (!selectedDroneId || String(selectedDroneId) !== id) {
            return null;
          }

          const rawPoints = Array.isArray(drone?.path)
            ? drone.path.map(pathPointToTuple).filter(Boolean)
            : [];
          const points = rawPoints.filter(
            (point, pointIndex) => pointIndex === 0 || !pointsAreEqual(point, rawPoints[pointIndex - 1])
          );

          return {
            id,
            points,
          };
        })
        .filter(Boolean)
        .filter(({ points }) => points.length >= 2),
    [drones, selectedDroneId]
  );

  return trajectories.map(({ id, points }) => (
    <React.Fragment key={id}>
      <Trajectory points={points} lineWidth={lineWidth} />
      {points.map((point, index) => (
        <a-entity
          key={`${id}-waypoint-${index}`}
          position={point.join(' ')}
          geometry={`primitive: sphere; radius: ${getWaypointRadius(index, points.length)}; segmentsWidth: 12; segmentsHeight: 8`}
          material={`color: ${getWaypointColor(index, points.length)}; shader: flat; fog: false`}
        />
      ))}
    </React.Fragment>
  ));
};

DronePathTrajectories.propTypes = {
  drones: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      path: PropTypes.arrayOf(
        PropTypes.shape({
          x: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          y: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          z: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        })
      ),
    })
  ),
  lineWidth: PropTypes.number,
  selectedDroneId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default memo(DronePathTrajectories);
