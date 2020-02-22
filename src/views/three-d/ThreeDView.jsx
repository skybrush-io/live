/**
 * @file Component that shows a three-dimensional view of the drone flock.
 */

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import CoordinateSystemAxes from './CoordinateSystemAxes';
import HomePositionMarkers from './HomePositionMarkers';
import LandingPositionMarkers from './LandingPositionMarkers';
import Scenery from './Scenery';

// eslint-disable-next-line no-unused-vars
import AFrame from '~/aframe';
import Colors from '~/components/colors';
import { isMapCoordinateSystemLeftHanded } from '~/selectors/map';

const images = {
  glow: 'assets/img/sphere-glow-hollow.png'
};

const ThreeDView = React.forwardRef((props, ref) => {
  const {
    grid,
    isCoordinateSystemLeftHanded,
    scenery,
    showAxes,
    showHomePositions,
    showLandingPositions,
    showStatistics
  } = props;
  const extraSceneProps = {};

  if (showStatistics) {
    extraSceneProps.stats = 'true';
  }

  return (
    <a-scene
      ref={ref}
      deallocate
      embedded="true"
      loading-screen="backgroundColor: #444; dotsColor: #888"
      renderer="antialias: false"
      vr-mode-ui="enabled: false"
      {...extraSceneProps}
    >
      <a-assets>
        <img crossOrigin="anonymous" id="glow-texture" src={images.glow} />

        <a-mixin
          id="takeoff-marker"
          geometry="primitive: triangle; vertexA: 1 0 0; vertexB: -0.5 0.866 0; vertexC: -0.5 -0.866 0"
          material={`shader: flat; color: ${Colors.takeoffMarker}`}
        />
        <a-mixin
          id="landing-marker"
          geometry="primitive: triangle; vertexA: -1 0 0; vertexB: 0.5 -0.866 0; vertexC: 0.5 0.866 0"
          material={`shader: flat; color: ${Colors.landingMarker}`}
        />
      </a-assets>

      <a-camera look-controls="reverseMouseDrag: true" />

      <a-entity rotation="-90 0 90">
        {showAxes && (
          <CoordinateSystemAxes leftHanded={isCoordinateSystemLeftHanded} />
        )}
        {showHomePositions && <HomePositionMarkers />}
        {showLandingPositions && <LandingPositionMarkers />}

        <a-sphere
          segments-width="18"
          segments-height="9"
          radius="0.5"
          material="color: #08f; shader: flat"
          position="5 0 0"
        >
          <a-entity sprite="blending: additive; color: #08f; scale: 2 2 1; src: #glow-texture; transparent: 0" />
        </a-sphere>
      </a-entity>

      {/* Move the floor slightly down to ensure that the coordinate axes are nicely visible */}
      <Scenery type={scenery} grid={grid} />
    </a-scene>
  );
});

ThreeDView.propTypes = {
  grid: PropTypes.string,
  isCoordinateSystemLeftHanded: PropTypes.bool,
  scenery: PropTypes.string,
  showAxes: PropTypes.bool,
  showHomePositions: PropTypes.bool,
  showLandingPositions: PropTypes.bool,
  showStatistics: PropTypes.bool
};

export default connect(
  // mapStateToProps
  state => ({
    isCoordinateSystemLeftHanded: isMapCoordinateSystemLeftHanded(state),
    ...state.settings.threeD
  }),
  // mapDispatchToProps
  {},
  // mergeProps
  null,
  { forwardRef: true }
)(ThreeDView);
