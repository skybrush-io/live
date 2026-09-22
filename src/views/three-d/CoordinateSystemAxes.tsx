import { memo } from 'react';

import Colors from '~/components/colors';

type Props = {
  leftHanded?: boolean;
  length?: number;
  lineWidth?: number;
};

/**
 * Component that renders unit-length coordinate system axes at the origin.
 */
const CoordinateSystemAxes = ({
  leftHanded,
  length = 1,
  lineWidth = 10,
}: Props) => (
  <>
    <a-entity
      meshline={`lineWidth: ${lineWidth}; path: 0 0 0, ${length} 0 0; color: ${Colors.axes.x}`}
    />
    <a-entity
      meshline={`lineWidth: ${lineWidth}; path: 0 0 0, 0 ${
        leftHanded ? -length : length
      } 0; color: ${Colors.axes.y}`}
    />
    <a-entity
      meshline={`lineWidth: ${lineWidth}; path: 0 0 0, 0 0 ${length}; color: ${Colors.axes.z}`}
    />
  </>
);

export default memo(CoordinateSystemAxes);
