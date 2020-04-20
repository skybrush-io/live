import PropTypes from 'prop-types';
import React, { memo } from 'react';

import { objectToString } from '~/aframe/utils';

const grounds = {
  /* Minecraft-style ground texture (green) */
  default: {
    groundColor: '#8eb971',
    groundColor2: '#507a32',
    groundTexture: 'walkernoise',
    groundYScale: 9,
  },
  /* Checkerboard indoor texture */
  indoor: {
    ground: 'flat',
    groundColor: '#444',
    groundColor2: '#666',
    groundTexture: 'checkerboard',
  },
};

const environments = {
  day: {
    preset: 'default',
    fog: 0.2,
    gridColor: '#fff',
    skyType: 'atmosphere',
    skyColor: '#88c',
    ...grounds.default,
  },
  night: {
    preset: 'starry',
    fog: 0.2,
    gridColor: '#39d2f2',
    skyType: 'atmosphere',
    skyColor: '#88c',
    ...grounds.default,
  },
  indoor: {
    preset: 'default',
    fog: 0.2,
    gridColor: '#888',
    skyType: 'color',
    skyColor: '#222',
    ...grounds.indoor,
  },
};

/**
 * Component that renders a basic scenery in which the drones will be placed.
 */
const Scenery = ({ grid, scale, type }) => (
  <a-entity position='0 -0.001 0' scale={`${scale} ${scale} ${scale}`}>
    {/* Move the floor slightly down to ensure that the coordinate axes are nicely visible */}
    <a-entity
      environment={objectToString({
        ...environments[type],
        grid: typeof grid === 'string' ? grid : grid ? '1x1' : 'none',
      })}
    />
  </a-entity>
);

Scenery.propTypes = {
  grid: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  scale: PropTypes.number,
  type: PropTypes.oneOf(Object.keys(environments)),
};

Scenery.defaultProps = {
  scale: 1,
  type: 'night'
};

export default memo(Scenery);
