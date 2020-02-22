import PropTypes from 'prop-types';
import React, { memo } from 'react';

import { objectToString } from '~/aframe/utils';

const grounds = {
  /* Minecraft-style ground texture (green) */
  default: {
    groundColor: '#8eb971',
    groundColor2: '#507a32',
    groundTexture: 'walkernoise',
    groundYScale: 9
  },
  /* Checkerboard indoor texture */
  indoor: {
    ground: 'flat',
    groundColor: '#444',
    groundColor2: '#666',
    groundTexture: 'checkerboard'
  }
};

const environments = {
  day: {
    preset: 'default',
    gridColor: '#fff',
    ...grounds.default
  },
  night: {
    preset: 'starry',
    gridColor: '#39d2f2',
    ...grounds.default
  },
  indoor: {
    preset: 'default',
    gridColor: '#888',
    skyType: 'color',
    skyColor: '#222',
    ...grounds.indoor
  }
};

/**
 * Component that renders a basic scenery in which the drones will be placed.
 */
const Scenery = ({ grid, type }) => (
  <a-entity position="0 -0.001 0">
    {/* Move the floor slightly down to ensure that the coordinate axes are nicely visible */}
    <a-entity
      environment={objectToString({
        ...environments[type],
        grid: typeof grid === 'string' ? grid : grid ? '1x1' : 'none'
      })}
    />
  </a-entity>
);

Scenery.propTypes = {
  grid: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  type: PropTypes.oneOf(Object.keys(environments))
};

export default memo(Scenery);
