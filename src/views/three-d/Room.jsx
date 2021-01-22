import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { getRoomCorners, isRoomVisible } from '~/features/show/selectors';

function processCorners(corners) {
  if (corners.length === 0) {
    return {
      center: [0, 0, 0],
      sizes: [0, 0, 0],
    };
  }

  const mins = corners[0].slice(0, 3);
  const maxs = mins.concat();
  const dims = [0, 1, 2];

  for (const corner of corners) {
    for (const dim of dims) {
      mins[dim] = Math.min(mins[dim], corner[dim]);
      maxs[dim] = Math.max(maxs[dim], corner[dim]);
    }
  }

  if (Math.abs(mins[2]) < 0.01) {
    // Move the floor of the room a bit down so it won't fight with the
    // checkerboard pattern
    mins[2] = -0.05;
  }

  const center = dims.map((dim) => (mins[dim] + maxs[dim]) / 2);
  const sizes = dims.map((dim) => maxs[dim] - mins[dim]);

  return { center, sizes };
}

const Room = ({ corners, visible }) => {
  if (!visible) {
    return null;
  }

  const { center, sizes } = processCorners(corners);

  /* Due to how our scene is rotated, depth goes 'up', height goes
   * 'horizontally', and width goes 'into the screen' */
  return (
    <a-box
      position={`${center[0]} ${center[1]} ${center[2]}`}
      scale={`${sizes[0]} ${sizes[1]} ${sizes[2]}`}
      material='color: #fff; side: back'
    />
  );
};

Room.propTypes = {
  corners: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
  visible: PropTypes.bool,
};

Room.defaultProps = {
  corners: [],
};

export default connect(
  // mapStateToProps
  (state) => ({
    corners: getRoomCorners(state),
    visible: isRoomVisible(state),
  }),
  // mapDispatchToProps
  {}
)(Room);
