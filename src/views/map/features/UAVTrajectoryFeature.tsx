import reject from 'lodash-es/reject';
import type { Feature as OLFeature } from 'ol';
import type { LineString } from 'ol/geom';
import type { Source as OLSource } from 'ol/source';
import { Style } from 'ol/style';
import { useMemo } from 'react';
import { connect } from 'react-redux';

import { Feature, geom } from '@collmot/ol-react';

import Colors from '~/components/colors';
import { getTrajectoryPointsInWorldCoordinatesByUavId } from '~/features/uavs/selectors';
import type { GPSPosition } from '~/model/geography';
import { plannedTrajectoryIdToGlobalId } from '~/model/identifiers';
import type { RootState } from '~/store/reducers';
import { mapViewCoordinateFromLonLat } from '~/utils/geography';
import type { Coordinate2DPlus } from '~/utils/math';
import { lineStringArrow, thinOutline } from '~/utils/styles';

/**
 * Style for the trajectory of a UAV.
 */
const baseTrajectoryStyle = new Style({
  stroke: thinOutline(Colors.plannedTrajectory),
});

const filterConsecutiveDuplicates = (points: Coordinate2DPlus[]) =>
  reject(
    points,
    (point, i) =>
      i > 0 && point[0] === points[i - 1][0] && point[1] === points[i - 1][1]
  );

export function mapTrajectoryToView(trajectory: GPSPosition[] | undefined) {
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
export const createStyleForTrajectoryFeature = (
  feature: OLFeature<LineString>
) => [
  baseTrajectoryStyle,
  lineStringArrow(Colors.plannedTrajectory, 'start')(feature),
  lineStringArrow(Colors.plannedTrajectory, 'end')(feature),
];

type StateProps = {
  trajectory: GPSPosition[] | undefined;
};

type OwnProps = {
  uavId: string;
  source?: OLSource;
};

type Props = StateProps & OwnProps;

export const UAVTrajectoryFeature = ({ source, trajectory, uavId }: Props) => {
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

export default connect(
  // mapStateToProps
  (state: RootState, { uavId }: OwnProps) => ({
    trajectory: getTrajectoryPointsInWorldCoordinatesByUavId(state, uavId),
  }),
  // mapDispatchToProps
  {}
)(UAVTrajectoryFeature);
