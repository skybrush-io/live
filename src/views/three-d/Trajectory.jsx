import PropTypes from 'prop-types';
import React, { memo } from 'react';

import Colors from '~/components/colors';

/**
 * Converts the trajectory points (specified as an array-of-arrays) into a
 * format that is suitable for the meshline component.
 */
function pointsToString(points) {
  return (Array.isArray(points) ? points : [])
    .map((point) => {
      const [x, y, z] = point;

      if (
        typeof x !== 'number' ||
        typeof y !== 'number' ||
        typeof z !== 'number'
      ) {
        return null;
      }

      return `${x.toFixed(2)} ${y.toFixed(2)} ${z.toFixed(2)}`;
    })
    .filter(Boolean)
    .join(', ');
}

const Trajectory = ({ lineWidth, points }) => {
  const path = pointsToString(points);
  return path ? (
    <a-entity
      meshline={`lineWidth: ${lineWidth}; path: ${path}; color: ${Colors.plannedTrajectory}`}
    />
  ) : null;
};

Trajectory.propTypes = {
  lineWidth: PropTypes.number,
  points: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
};

Trajectory.defaultProps = {
  lineWidth: 5,
};

export default memo(Trajectory);
