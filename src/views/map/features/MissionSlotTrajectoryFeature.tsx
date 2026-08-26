import type { Source as OLSource } from 'ol/source';
import { useMemo } from 'react';
import { connect } from 'react-redux';

import { Feature, geom } from '@collmot/ol-react';

import { getTrajectoryPointsInWorldCoordinatesByMissionIndex } from '~/features/show/selectors';
import type { GPSPosition } from '~/model/geography';
import { plannedTrajectoryIdToGlobalId } from '~/model/identifiers';
import type { RootState } from '~/store/reducers';

import {
  createStyleForTrajectoryFeature,
  mapTrajectoryToView,
} from './UAVTrajectoryFeature';

type StateProps = {
  trajectory: GPSPosition[] | undefined;
};

type OwnProps = {
  missionIndex: number;
  source?: OLSource;
};

type Props = StateProps & OwnProps;

export const MissionSlotTrajectoryFeature = ({
  missionIndex,
  source,
  trajectory,
}: Props) => {
  const points = useMemo(() => mapTrajectoryToView(trajectory), [trajectory]);
  return points ? (
    <Feature
      id={plannedTrajectoryIdToGlobalId(String(missionIndex))}
      source={source}
      style={createStyleForTrajectoryFeature}
    >
      <geom.LineString coordinates={points} />
    </Feature>
  ) : null;
};

export default connect(
  // mapStateToProps
  (state: RootState, { missionIndex }: OwnProps) => ({
    trajectory: getTrajectoryPointsInWorldCoordinatesByMissionIndex(
      state,
      missionIndex
    ),
  }),
  // mapDispatchToProps
  {}
)(MissionSlotTrajectoryFeature);
