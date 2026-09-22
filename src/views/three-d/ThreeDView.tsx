/**
 * @file Component that shows a three-dimensional view of the drone flock.
 */

import type { RefObject } from 'react';
import { connect } from 'react-redux';

import CoordinateSystemAxes from './CoordinateSystemAxes';
import HomePositionMarkers from './HomePositionMarkers';
import LandingPositionMarkers from './LandingPositionMarkers';
import Room from './Room';
import Scenery from './Scenery';
import SelectedTrajectories from './SelectedTrajectories';

import { objectToString } from '~/aframe/utils';
import Colors from '~/components/colors';
import {
  getLightingConditionsForThreeDView,
  getSceneryForThreeDView,
} from '~/features/settings/selectors';
import { isShowIndoor } from '~/features/show/selectors';
import {
  NavigationMode,
  type NavigationSettings,
  type Scenery as SceneryType,
} from '~/features/three-d/types';
import { isMapCoordinateSystemLeftHanded } from '~/selectors/map';
import type { RootState } from '~/store/reducers';

type Props = {
  cameraRef?: RefObject<HTMLElement | null>;
  grid?: 'none' | '1x1' | '2x2';
  isCoordinateSystemLeftHanded?: boolean;
  lighting: 'dark' | 'light';
  navigation?: NavigationSettings;
  ref?: RefObject<HTMLElement>;
  sceneId?: number;
  scenery: SceneryType;
  showAxes?: boolean;
  showHomePositions?: boolean;
  showLandingPositions?: boolean;
  showStatistics?: boolean;
  showTrajectoriesOfSelection?: boolean;
};

/**
 * Selector that returns the "effective" scenery to use in the 3D view,
 * potentially based on whether the show is indoor or outdoor.
 */
const getEffectiveScenery = (state: RootState): SceneryType => {
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

/**
 * Component that shows a three-dimensional view of the drone flock.
 */
const ThreeDView = (props: Props) => {
  const {
    cameraRef,
    grid,
    isCoordinateSystemLeftHanded,
    lighting,
    navigation,
    ref,
    sceneId,
    scenery,
    showAxes,
    showHomePositions,
    showLandingPositions,
    showStatistics,
    showTrajectoriesOfSelection,
  } = props;

  const extraCameraProps = {
    'advanced-camera-controls': objectToString({
      acceptsKeyboardEvent: 'notEditable',
      embedded: true,
      fly: navigation?.mode === NavigationMode.FLY,
      minAltitude: 0.5,
      reverseMouseDrag: true,
    }),
    'look-controls': objectToString({
      enabled: false,
    }),
    'wasd-controls': objectToString({
      enabled: false,
    }),
  };

  const extraSceneProps: Record<string, string> = {};

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
      loading-screen='backgroundColor: #424242; dotsColor: #888'
      renderer='antialias: false'
      xr-mode-ui='enabled: false'
      device-orientation-permission-ui='enabled: false'
      tabIndex={-1}
      class='react-hotkeys-ignore no-focus-ring'
      {...extraSceneProps}
    >
      <a-assets>
        <a-mixin
          id='takeoff-marker'
          geometry='primitive: triangle; vertexA: 1 0 0; vertexB: -0.5 0.866 0; vertexC: -0.5 -0.866 0'
          material={`color: ${Colors.markers.takeoff}; shader: flat; side: double`}
        />
        <a-mixin
          id='landing-marker'
          geometry='primitive: triangle; vertexA: -1 0 0; vertexB: 0.5 -0.866 0; vertexC: 0.5 0.866 0'
          material={`color: ${Colors.markers.landing}; shader: flat; side: double`}
        />
      </a-assets>

      <a-camera
        ref={cameraRef}
        sync-pose-with-store=''
        id='three-d-camera'
        {...extraCameraProps}
      >
        <a-entity
          cursor='rayOrigin: mouse'
          raycaster='objects: .three-d-clickable; interval: 100'
        />
      </a-camera>

      <a-entity rotation='-90 0 90'>
        {showAxes && (
          <CoordinateSystemAxes
            leftHanded={isCoordinateSystemLeftHanded}
            lineWidth={10}
          />
        )}
        {showHomePositions && <HomePositionMarkers />}
        {showLandingPositions && <LandingPositionMarkers />}
        {showTrajectoriesOfSelection && <SelectedTrajectories />}

        <a-drone-flock />

        <Room />
      </a-entity>

      <Scenery type={`${scenery}-${lighting}`} grid={grid} />
    </a-scene>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
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
