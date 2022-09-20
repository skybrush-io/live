import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import { connect } from 'react-redux';

import { Feature, geom } from '@collmot/ol-react';

import { getTrajectoryPointsInWorldCoordinatesByMissionIndex } from '~/features/show/selectors';
import { plannedTrajectoryIdToGlobalId } from '~/model/identifiers';
import CustomPropTypes from '~/utils/prop-types';

import {
  createStyleForTrajectoryInViewCoordinates,
  mapTrajectoryToView,
} from './UAVTrajectoryFeature';

export const MissionSlotTrajectoryFeature = ({
  source,
  trajectory,
  missionIndex,
}) => {
  const points = useMemo(() => mapTrajectoryToView(trajectory), [trajectory]);
  const style = useMemo(
    () => createStyleForTrajectoryInViewCoordinates(points),
    [points]
  );
  return points ? (
    <Feature
      id={plannedTrajectoryIdToGlobalId(missionIndex)}
      source={source}
      style={style}
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
