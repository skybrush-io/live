/**
 * @file Component that shows a three-dimensional view of the drone flock.
 */

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import CoordinateSystemAxes from './CoordinateSystemAxes';
import Scenery from './Scenery';

// eslint-disable-next-line no-unused-vars
import AFrame from '~/aframe';
import Colors from '~/components/colors';
import { isMapCoordinateSystemLeftHanded } from '~/selectors/map';

const images = {
  glow: 'assets/img/sphere-glow-hollow.png'
};

const ThreeDView = React.forwardRef(
  ({ gridType, isCoordinateSystemLeftHanded, sceneryType }, ref) => (
    <a-scene
      ref={ref}
      deallocate
      stats
      embedded="true"
      loading-screen="backgroundColor: #444; dotsColor: #888"
      renderer="antialias: false"
      vr-mode-ui="enabled: false"
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
        <CoordinateSystemAxes leftHanded={isCoordinateSystemLeftHanded} />

        <a-entity mixin="landing-marker" position="5 0 0" />

        <a-sphere
          segments-width="18"
          segments-height="9"
          radius="0.5"
          material="color: #08f; emissive: #08f; emissiveIntensity: 0.75"
          position="5 0 0"
        >
          <a-entity sprite="blending: additive; color: #08f; scale: 2 2 1; src: #glow-texture; transparent: 0" />
        </a-sphere>
      </a-entity>

      {/* Move the floor slightly down to ensure that the coordinate axes are nicely visible */}
      <Scenery type={sceneryType} grid={gridType} />
    </a-scene>
  )
);

ThreeDView.propTypes = {
  gridType: PropTypes.string,
  isCoordinateSystemLeftHanded: PropTypes.bool,
  sceneryType: PropTypes.string
};

export default connect(
  // mapStateToProps
  state => ({
    gridType: state.settings.threeD.grid,
    isCoordinateSystemLeftHanded: isMapCoordinateSystemLeftHanded(state),
    sceneryType: state.settings.threeD.scenery
  }),
  // mapDispatchToProps
  {},
  // mergeProps
  null,
  { forwardRef: true }
)(ThreeDView);
