import { Style } from 'ol/style';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { Feature, geom } from '@collmot/ol-react';

import Colors from '~/components/colors';
import { getTrajectoryPointsInWorldCoordinatesByUavId } from '~/features/uavs/selectors';
import { plannedTrajectoryIdToGlobalId } from '~/model/identifiers';
import { mapViewCoordinateFromLonLat } from '~/utils/geography';
import CustomPropTypes from '~/utils/prop-types';
import { thinOutline, whiteThickOutline } from '~/utils/styles';

/**
 * Style for the trajectory of a UAV.
 */
const baseTrajectoryStyle = new Style({
  stroke: thinOutline(Colors.plannedTrajectory),
});
const trajectorySelectionStyle = new Style({
  stroke: whiteThickOutline,
});
export const trajectoryStyles = [
  [baseTrajectoryStyle],
  [trajectorySelectionStyle, baseTrajectoryStyle],
];

export const UAVTrajectoryFeature = ({ source, trajectory, uavId }) => {
  const points = trajectory
    ? trajectory.map((point) =>
        mapViewCoordinateFromLonLat([point.lon, point.lat])
      )
    : undefined;
  return points ? (
    <Feature
      id={plannedTrajectoryIdToGlobalId(uavId)}
      source={source}
      style={trajectoryStyles[0]}
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
  (state, { uavId }) => {
    const trajectory = getTrajectoryPointsInWorldCoordinatesByUavId(
      state,
      uavId
    );
    return { trajectory };
  },
  // mapDispatchToProps
  {}
)(UAVTrajectoryFeature);
