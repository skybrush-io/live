/**
 * @file Component that shows a three-dimensional view of the drone flock.
 */

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import CoordinateSystemAxes from './CoordinateSystemAxes';
import HomePositionMarkers from './HomePositionMarkers';
import LandingPositionMarkers from './LandingPositionMarkers';
import Room from './Room';
import Scenery from './Scenery';
import SelectedTrajectories from './SelectedTrajectories';

// eslint-disable-next-line no-unused-vars
import AFrame from '~/aframe';
import { objectToString } from '~/aframe/utils';
import Colors from '~/components/colors';
import {
  getLightingConditionsForThreeDView,
  getSceneryForThreeDView,
} from '~/features/settings/selectors';
import { isShowIndoor } from '~/features/show/selectors';
import { isMapCoordinateSystemLeftHanded } from '~/selectors/map';

import glowImage from '~/../assets/img/sphere-glow-hollow.png';


const images = {
  glow: glowImage
};

/**
 * Selector that returns the "effective' scenery to use in the 3D view,
 * potentially based on whether the show is indoor or outdoor.
 */
const getEffectiveScenery = (state) => {
  const scenery = getSceneryForThreeDView(state);
  if (scenery === 'auto') {
    if (isShowIndoor(state)) {
      return 'indoor';
    } else {
      return 'outdoor';
    }
  } else {
    return scenery;
  }
};

const ThreeDView = React.forwardRef((props, ref) => {
  const {
    grid,
    isCoordinateSystemLeftHanded,
    lighting,
    navigation,
    sceneId,
    scenery,
    showAxes,
    showHomePositions,
    showLandingPositions,
    showStatistics,
    showTrajectoriesOfSelection,
  } = props;

  const extraCameraProps = {
    'altitude-control': objectToString({
      enabled: true,
      min: 0.01,
    }),
    'better-wasd-controls': objectToString({
      fly: navigation && navigation.mode === 'fly',
    }),
    'wasd-controls': objectToString({
      enabled: false,
    }),
  };
  const extraSceneProps = {};

  if (showStatistics) {
    extraSceneProps.stats = 'true';
  }

  return (
    <a-scene
      key={sceneId}
      ref={ref}
      deallocate
      embedded='true'
      keyboard-shortcuts='enterVR: false'
      loading-screen='backgroundColor: #444; dotsColor: #888'
      renderer='antialias: false'
      vr-mode-ui='enabled: false'
      device-orientation-permission-ui='enabled: false'
      {...extraSceneProps}
    >
      <a-assets>
        <img crossOrigin='anonymous' id='glow-texture' src={images.glow} />
        <a-mixin
          id='takeoff-marker'
          geometry='primitive: triangle; vertexA: 1 0 0; vertexB: -0.5 0.866 0; vertexC: -0.5 -0.866 0'
          material={`color: ${Colors.takeoffMarker}; shader: flat; side: double`}
        />
        <a-mixin
          id='landing-marker'
          geometry='primitive: triangle; vertexA: -1 0 0; vertexB: 0.5 -0.866 0; vertexC: 0.5 0.866 0'
          material={`color: ${Colors.landingMarker}; shader: flat; side: double`}
        />
      </a-assets>

      <a-camera
        sync-pose-with-store=''
        id='three-d-camera'
        look-controls='reverseMouseDrag: true'
        {...extraCameraProps}
      >
        <a-entity
          cursor='rayOrigin: mouse'
          raycaster='objects: .three-d-clickable; interval: 100'
        />
      </a-camera>

      <a-entity rotation='-90 0 90'>
        {showAxes && (
          <CoordinateSystemAxes leftHanded={isCoordinateSystemLeftHanded} />
        )}
        {showHomePositions && <HomePositionMarkers />}
        {showLandingPositions && <LandingPositionMarkers />}
        {showTrajectoriesOfSelection && <SelectedTrajectories />}
        <a-drone-flock />

        <Room />
      </a-entity>

      <Scenery scale={10} type={`${scenery}-${lighting}`} grid={grid} />
    </a-scene>
  );
});

ThreeDView.propTypes = {
  grid: PropTypes.string,
  isCoordinateSystemLeftHanded: PropTypes.bool,
  lighting: PropTypes.oneOf(['dark', 'light']),
  navigation: PropTypes.shape({
    mode: PropTypes.oneOf(['walk', 'fly']),
    parameters: PropTypes.object,
  }),
  sceneId: PropTypes.number,
  scenery: PropTypes.oneOf(['outdoor', 'indoor']),
  showAxes: PropTypes.bool,
  showHomePositions: PropTypes.bool,
  showLandingPositions: PropTypes.bool,
  showStatistics: PropTypes.bool,
  showTrajectoriesOfSelection: PropTypes.bool,
};

export default connect(
  // mapStateToProps
  (state) => ({
    isCoordinateSystemLeftHanded: isMapCoordinateSystemLeftHanded(state),
    ...state.settings.threeD,
    ...state.threeD,
    scenery: getEffectiveScenery(state),
    lighting: getLightingConditionsForThreeDView(state),
  }),
  // mapDispatchToProps
  {},
  // mergeProps
  null,
  { forwardRef: true }
)(ThreeDView);
