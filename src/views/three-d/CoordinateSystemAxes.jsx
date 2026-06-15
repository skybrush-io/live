import PropTypes from 'prop-types';
import React, { memo } from 'react';

import Colors from '~/components/colors';

/** Satellite map ground tiles sit at z≈0.015; keep axes above them. */
const AXIS_GROUND_CLEARANCE = 0.08;

/**
 * Component that renders unit-length coordinate system axes at the origin.
 */
const CoordinateSystemAxes = ({ leftHanded, lineWidth = 10 }) => {
  const z = AXIS_GROUND_CLEARANCE;
  const yDir = leftHanded ? -1 : 1;

  return (
    <>
      <a-entity
        meshline={`lineWidth: ${lineWidth}; path: 0 0 ${z}, 1 0 ${z}; color: ${Colors.axes.x}`}
      />
      <a-entity
        meshline={`lineWidth: ${lineWidth}; path: 0 0 ${z}, 0 ${yDir} ${z}; color: ${Colors.axes.y}`}
      />
      <a-entity
        meshline={`lineWidth: ${lineWidth}; path: 0 0 ${z}, 0 0 ${1 + z}; color: ${Colors.axes.z}`}
      />
    </>
  );
};

CoordinateSystemAxes.propTypes = {
  leftHanded: PropTypes.bool,
  lineWidth: PropTypes.number,
};

export default memo(CoordinateSystemAxes);
