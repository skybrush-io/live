import reject from 'lodash-es/reject';
import { Style } from 'ol/style';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import { connect } from 'react-redux';

import { Feature, geom } from '@collmot/ol-react';

import Colors from '~/components/colors';
import { getTrajectoryPointsInWorldCoordinatesByUavId } from '~/features/uavs/selectors';
import { plannedTrajectoryIdToGlobalId } from '~/model/identifiers';
import { mapViewCoordinateFromLonLat } from '~/utils/geography';
import CustomPropTypes from '~/utils/prop-types';
import { lineStringArrow, thinOutline } from '~/utils/styles';

/**
 * Style for the trajectory of a UAV.
 */
const baseTrajectoryStyle = new Style({
  stroke: thinOutline(Colors.plannedTrajectory),
});

const filterConsecutiveDuplicates = (points) =>
  reject(
    points,
    (point, i) =>
      i > 0 && point[0] === points[i - 1][0] && point[1] === points[i - 1][1]
  );

export function mapTrajectoryToView(trajectory) {
  return trajectory
    ? filterConsecutiveDuplicates(
        trajectory.map((point) =>
          mapViewCoordinateFromLonLat([point.lon, point.lat])
        )
      )
    : undefined;
}

/**
 * Creates a list of style objects to represent the given trajectory.
 */
export const createStyleForTrajectoryFeature = (feature) => [
  baseTrajectoryStyle,
  lineStringArrow(Colors.plannedTrajectory, 'start')(feature),
  lineStringArrow(Colors.plannedTrajectory, 'end')(feature),
];

export const UAVTrajectoryFeature = ({ source, trajectory, uavId }) => {
  const points = useMemo(() => mapTrajectoryToView(trajectory), [trajectory]);
  return points ? (
    <Feature
      id={plannedTrajectoryIdToGlobalId(uavId)}
      source={source}
      style={createStyleForTrajectoryFeature}
    >
      <geom.LineString coordinates={points} />
    </Feature>
  ) : null;
};

UAVTrajectoryFeature.propTypes = {
  source: PropTypes.any,
  trajectory: PropTypes.arrayOf(CustomPropTypes.coordinate),
  uavId: PropTypes.string,
};

export default connect(
  // mapStateToProps
  (state, { uavId }) => ({
    trajectory: getTrajectoryPointsInWorldCoordinatesByUavId(state, uavId),
  }),
  // mapDispatchToProps
  {}
)(UAVTrajectoryFeature);
