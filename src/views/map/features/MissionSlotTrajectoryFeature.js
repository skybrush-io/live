import { Style } from 'ol/style';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { Feature, geom } from '@collmot/ol-react';

import Colors from '~/components/colors';
import { getTrajectoryPointsInWorldCoordinatesByMissionIndex } from '~/features/show/selectors';
import { plannedTrajectoryIdToGlobalId } from '~/model/identifiers';
import { mapViewCoordinateFromLonLat } from '~/utils/geography';
import CustomPropTypes from '~/utils/prop-types';
import { thinOutline, whiteThickOutline } from '~/utils/styles';

/**
 * Style for the trajectory of a mission slot.
 */
const baseTrajectoryStyle = new Style({
  stroke: thinOutline(Colors.plannedTrajectory),
});
const trajectorySelectionStyle = new Style({
  stroke: whiteThickOutline,
});
const trajectoryStyles = [
  [baseTrajectoryStyle],
  [trajectorySelectionStyle, baseTrajectoryStyle],
];

export const MissionSlotTrajectoryFeature = ({
  source,
  trajectory,
  missionIndex,
}) => {
  const points = trajectory
    ? trajectory.map((point) =>
        mapViewCoordinateFromLonLat([point.lon, point.lat])
      )
    : undefined;
  return points ? (
    <Feature
      id={plannedTrajectoryIdToGlobalId(missionIndex)}
      source={source}
      style={trajectoryStyles[0]}
    >
      <geom.LineString coordinates={points} />
    </Feature>
  ) : null;
};

MissionSlotTrajectoryFeature.propTypes = {
  source: PropTypes.any,
  trajectory: PropTypes.arrayOf(CustomPropTypes.coordinate),
  missionIndex: PropTypes.string,
};

export default connect(
  // mapStateToProps
  (state, { missionIndex }) => {
    const trajectory = getTrajectoryPointsInWorldCoordinatesByMissionIndex(
      state,
      missionIndex
    );
    return { trajectory };
  },
  // mapDispatchToProps
  {}
)(MissionSlotTrajectoryFeature);
