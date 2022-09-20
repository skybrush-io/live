import reject from 'lodash-es/reject';
import { RegularShape, Style } from 'ol/style';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import { connect } from 'react-redux';

import { Feature, geom } from '@collmot/ol-react';

import Colors from '~/components/colors';
import { getTrajectoryPointsInWorldCoordinatesByUavId } from '~/features/uavs/selectors';
import { plannedTrajectoryIdToGlobalId } from '~/model/identifiers';
import { mapViewCoordinateFromLonLat } from '~/utils/geography';
import CustomPropTypes from '~/utils/prop-types';
import { fill, thinOutline, whiteThickOutline } from '~/utils/styles';
import { Point } from 'ol/geom';

/**
 * Style for the trajectory of a UAV.
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

const createArrow = (head, rotation, initial) => {
  const scale = [0.75, 1];
  const radius = 10;
  const displacement = initial ? [0, radius * 0.5] : [0, -radius];
  return new Style({
    geometry: new Point(head),
    image: new RegularShape({
      points: 3,
      fill: fill(Colors.plannedTrajectory),
      rotateWithView: true,
      radius,
      scale,
      rotation,
      displacement,
    }),
  });
};

const bearing = (p, q) => Math.PI / 2 - Math.atan2(q[1] - p[1], q[0] - p[0]);
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
 * Creates a style object suitable for representing the given trajectory,
 * consisting of the given mapped points in view coordinates.
 */
export function createStyleForTrajectoryInViewCoordinates(points) {
  let result = trajectoryStyles[0];
  const numPoints = Array.isArray(points) ? points.length : 0;

  if (numPoints >= 2) {
    const initialBearing = bearing(points[0], points[1]);
    const finalBearing = bearing(points[numPoints - 2], points[numPoints - 1]);

    // Add arrowheads
    result = [
      ...result,
      createArrow(points[0], initialBearing, /* initial = */ true),
      createArrow(points[numPoints - 1], finalBearing),
    ];
  }

  return result;
}

export const UAVTrajectoryFeature = ({ source, trajectory, uavId }) => {
  const points = useMemo(() => mapTrajectoryToView(trajectory), [trajectory]);
  const style = useMemo(
    () => createStyleForTrajectoryInViewCoordinates(points),
    [points]
  );
  return points ? (
    <Feature
      id={plannedTrajectoryIdToGlobalId(uavId)}
      source={source}
      style={style}
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
