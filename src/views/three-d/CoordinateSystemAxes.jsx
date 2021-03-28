import PropTypes from 'prop-types';
import React, { memo } from 'react';

import Colors from '~/components/colors';

/**
 * Component that renders unit-length coordinate system axes at the origin.
 */
const CoordinateSystemAxes = ({ leftHanded, lineWidth }) => (
  <>
    <a-entity
      meshline={`lineWidth: ${lineWidth}; path: 0 0 0, 1 0 0; color: ${Colors.axes.x}`}
    />
    <a-entity
      meshline={`lineWidth: ${lineWidth}; path: 0 0 0, 0 ${
        leftHanded ? -1 : 1
      } 0; color: ${Colors.axes.y}`}
    />
    <a-entity
      meshline={`lineWidth: ${lineWidth}; path: 0 0 0, 0 0 1; color: ${Colors.axes.z}`}
    />
  </>
);

CoordinateSystemAxes.propTypes = {
  leftHanded: PropTypes.bool,
  lineWidth: PropTypes.number,
};

CoordinateSystemAxes.defaultProps = {
  lineWidth: 10,
};

export default memo(CoordinateSystemAxes);
