import PropTypes from 'prop-types';
import React, { memo } from 'react';

import { objectToString } from '~/aframe/utils';

const grounds = {
  /* Minecraft-style ground texture (green) */
  default: {
    groundColor: '#8eb971',
    groundColor2: '#507a32',
    groundTexture: 'walkernoise',
    groundYScale: 24,
    /* make the "play area" larger so we have more space to fly around without
     * bumping into hills */
    playArea: 1.6,
  },
  /* Checkerboard indoor texture */
  indoor: {
    ground: 'flat',
    groundColor: '#333',
    groundColor2: '#666',
    groundTexture: 'checkerboard',
  },
};

const environments = {
  'outdoor-light': {
    preset: 'default',
    fog: 0.2,
    gridColor: '#fff',
    skyType: 'atmosphere',
    skyColor: '#88c',
    ...grounds.default,
  },
  'outdoor-dark': {
    preset: 'starry',
    fog: 0.2,
    gridColor: '#39d2f2',
    skyType: 'atmosphere',
    skyColor: '#88c',
    ...grounds.default,
  },
  'indoor-light': {
    preset: 'default',
    fog: 0.2,
    gridColor: '#fff',
    skyType: 'gradient',
    skyColor: '#eceff1',
    horizonColor: '#fed',
    ...grounds.indoor,
  },
  'indoor-dark': {
    preset: 'default',
    fog: 0.2,
    gridColor: '#888',
    skyType: 'gradient',
    skyColor: '#000',
    horizonColor: '#222',
    ...grounds.indoor,
  },
};

/**
 * Component that renders a basic scenery in which the drones will be placed.
 */
const Scenery = ({ grid, type }) => {
  const scale = type === 'indoor-light' || type === 'indoor-dark' ? 0.5 : 10;
  return (
    <a-entity position='0 -0.02 0' scale={`${scale} ${scale} ${scale}`}>
      {/* Move the floor slightly down to ensure that the coordinate axes are nicely visible */}
      <a-entity
        environment={objectToString({
          ...(environments[type] || environments['outdoor-dark']),
          grid: typeof grid === 'string' ? grid : grid ? '1x1' : 'none',
        })}
      />
    </a-entity>
  );
};

Scenery.propTypes = {
  grid: PropTypes.oneOfType([PropTypes.bool, PropTypes.string]),
  type: PropTypes.oneOf(Object.keys(environments)),
};

Scenery.defaultProps = {
  type: 'outdoor-dark',
};

export default memo(Scenery);
