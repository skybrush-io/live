import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import { connect } from 'react-redux';

import { Feature, geom } from '@collmot/ol-react';

import { getTrajectoryPointsInWorldCoordinatesByMissionIndex } from '~/features/show/selectors';
import { plannedTrajectoryIdToGlobalId } from '~/model/identifiers';
import CustomPropTypes from '~/utils/prop-types';

import {
  createStyleForTrajectoryFeature,
  mapTrajectoryToView,
} from './UAVTrajectoryFeature';
import { Circle, Fill, Style } from 'ol/style';

export const MissionSlotTrajectoryFeature = ({
  source,
  trajectory,
  missionIndex,
}) => {
  const points = useMemo(() => mapTrajectoryToView(trajectory), [trajectory]);
  console.log({ l: points?.length });
  return points ? (
    <Feature
      id={plannedTrajectoryIdToGlobalId(missionIndex)}
      source={source}
      style={
        false
          ? createStyleForTrajectoryFeature
          : new Style({
              image: new Circle({
                radius: 2,
                fill: new Fill({ color: 'blue' }),
              }),
            })
      }
    >
      <geom.MultiPoint coordinates={points} />
      {/* <geom.LineString coordinates={points} /> */}
    </Feature>
  ) : null;
};

MissionSlotTrajectoryFeature.propTypes = {
  source: PropTypes.any,
  trajectory: PropTypes.arrayOf(CustomPropTypes.coordinate),
  missionIndex: PropTypes.number,
};

export default connect(
  // mapStateToProps
  (state, { missionIndex }) => ({
    trajectory: getTrajectoryPointsInWorldCoordinatesByMissionIndex(
      state,
      missionIndex
    ),
  }),
  // mapDispatchToProps
  {}
)(MissionSlotTrajectoryFeature);
