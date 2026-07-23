import { memo } from 'react';

import Colors from '~/components/colors';
import type { Coordinate3D } from '~/utils/math';

/**
 * Converts the trajectory points (specified as an array-of-arrays) into a
 * format that is suitable for the meshline component.
 */
function pointsToString(points: Coordinate3D[]): string {
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

type Props = {
  lineWidth?: number;
  points?: Coordinate3D[];
};

const Trajectory = ({ lineWidth = 5, points }: Props) => {
  const path = pointsToString(points ?? []);
  return path ? (
    <a-entity
      meshline={`lineWidth: ${lineWidth}; path: ${path}; color: ${Colors.plannedTrajectory}`}
    />
  ) : null;
};

export default memo(Trajectory);
