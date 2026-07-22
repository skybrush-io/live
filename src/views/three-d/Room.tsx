import { connect } from 'react-redux';

import { getRoomCorners, isRoomVisible } from '~/features/show/selectors';
import type { RootState } from '~/store/reducers';
import type { Coordinate3D } from '~/utils/math';

function processCorners(corners: Coordinate3D[]): {
  center: Coordinate3D;
  sizes: number[];
} {
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

  const center = dims.map((dim) => (mins[dim] + maxs[dim]) / 2) as Coordinate3D;
  const sizes = dims.map((dim) => maxs[dim] - mins[dim]);

  return { center, sizes };
}

type Props = {
  corners: Coordinate3D[];
  visible: boolean;
};

const Room = ({ corners, visible }: Props) => {
  if (!visible) {
    return null;
  }

  const { center, sizes } = processCorners(corners ?? []);

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

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    corners: getRoomCorners(state),
    visible: isRoomVisible(state),
  }),
  // mapDispatchToProps
  {}
)(Room);
