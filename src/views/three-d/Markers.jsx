import PropTypes from 'prop-types';
import React from 'react';

/**
 * Presentational component that renders a set of markers in the scene at the
 * given Three.JS coordinates.
 */
const Markers = ({ coordinates, mixin }) =>
  coordinates.map((coordinate, index) => {
    const key = `${mixin}-${index}`;
    return (
      coordinate && (
        <a-entity key={key} mixin={mixin} position={coordinate.join(' ')} />
      )
    );
  });

Markers.propTypes = {
  coordinates: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
  mixin: PropTypes.string,
};

export default Markers;
