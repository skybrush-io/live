/**
 * @file Component that shows a three-dimensional view of the drone flock.
 */

import loadable from '@loadable/component';
import Settings from '@mui/icons-material/Settings';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import PropTypes from 'prop-types';
import { useRef } from 'react';
import { IgnoreKeys } from 'react-hotkeys';
import { connect } from 'react-redux';
import useResizeObserver from 'use-resize-observer';

import { isThemeDark, makeStyles } from '@skybrush/app-theme-mui';

import DarkModeSwitch from '~/components/DarkModeSwitch';
import ToolbarDivider from '~/components/ToolbarDivider';
import NearestItemTooltip from '~/features/session/NearestItemTooltip';
import {
  setAppSettingsDialogTab,
  showAppSettingsDialog,
} from '~/features/settings/actions';
import { getLightingConditionsForThreeDView } from '~/features/settings/selectors';
import { toggleLightingConditionsInThreeDView } from '~/features/settings/slice';
import { resetZoom, rotateViewToDrones } from '~/features/three-d/actions';
import { cameraRef } from '~/features/three-d/refs';
import { setNavigationMode } from '~/features/three-d/slice';
import { isMapCoordinateSystemSpecified } from '~/selectors/map';

import NavigationButtonGroup from './NavigationButtonGroup';
import NavigationInstructions from './NavigationInstructions';
import Overlay from './Overlay';

const ThreeDView = loadable(
  () => import(/* webpackChunkName: "three-d" */ './ThreeDView')
);

const useStyles = makeStyles((theme) => ({
  appBar: {
    backgroundColor: isThemeDark(theme)
      ? '#424242'
      : theme.palette.background.paper,
    height: 48,
  },

  toolbar: {
    position: 'absolute',
    left: theme.spacing(1),
    right: theme.spacing(1),
    top: 0,
  },
}));

const ThreeDTopLevelView = ({
  hasMapCoordinateSystem,
  lighting,
  navigation,
  onResetZoom,
  onRotateCameraTowardsDrones,
  onSetNavigationMode,
  onShowSettings,
  onToggleLightingConditions,
}) => {
  const classes = useStyles();

  const threeDViewRef = useRef(null);
  const { ref } = useResizeObserver({
    onResize() {
      if (threeDViewRef.current) {
        threeDViewRef.current.resize();
      }
    },
  });

  return (
    <IgnoreKeys style={{ height: '100%' }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <AppBar color='default' position='static' className={classes.appBar}>
          <Toolbar disableGutters variant='dense' className={classes.toolbar}>
            <NavigationButtonGroup
              mode={navigation.mode}
              parameters={navigation.parameters}
              onChange={onSetNavigationMode}
              onResetZoom={onResetZoom}
              onRotateCameraTowardsDrones={onRotateCameraTowardsDrones}
            />
            <ToolbarDivider orientation='vertical' />
            <NavigationInstructions mode={navigation.mode} />
            <DarkModeSwitch
              value={lighting === 'dark'}
              onChange={onToggleLightingConditions}
            />
          </Toolbar>
        </AppBar>
        <Box ref={ref} sx={{ position: 'relative', flex: 1 }}>
          <NearestItemTooltip>
            <ThreeDView ref={threeDViewRef} cameraRef={cameraRef} />
          </NearestItemTooltip>
          {!hasMapCoordinateSystem && (
            <Overlay left={8} right={8} top={8}>
              <Alert
                severity='warning'
                action={
                  <IconButton
                    color='inherit'
                    size='small'
                    onClick={onShowSettings}
                  >
                    <Settings />
                  </IconButton>
                }
              >
                <AlertTitle>No map coordinate system specified</AlertTitle>
                <div>
                  Drones will become visible when a coordinate system is
                  specified in the <strong>Settings</strong> dialog.
                </div>
              </Alert>
            </Overlay>
          )}
        </Box>
      </Box>
    </IgnoreKeys>
  );
};

ThreeDTopLevelView.propTypes = {
  hasMapCoordinateSystem: PropTypes.bool,
  lighting: PropTypes.string,
  navigation: PropTypes.shape({
    mode: PropTypes.string,
    parameters: PropTypes.object,
  }),
  onResetZoom: PropTypes.func,
  onRotateCameraTowardsDrones: PropTypes.func,
  onSetNavigationMode: PropTypes.func,
  onShowSettings: PropTypes.func,
  onToggleLightingConditions: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    hasMapCoordinateSystem: isMapCoordinateSystemSpecified(state),
    ...state.threeD,
    lighting: getLightingConditionsForThreeDView(state),
  }),
  // mapDispatchToProps
  {
    onResetZoom: resetZoom,
    onRotateCameraTowardsDrones: rotateViewToDrones,
    onSetNavigationMode: setNavigationMode,

    onShowSettings: () => (dispatch) => {
      dispatch(setAppSettingsDialogTab('display'));
      dispatch(showAppSettingsDialog());
    },

    onToggleLightingConditions: toggleLightingConditionsInThreeDView,
  }
)(ThreeDTopLevelView);
