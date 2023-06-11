/**
 * @file Component that shows a three-dimensional view of the drone flock.
 */

import PropTypes from 'prop-types';
import React, { useRef } from 'react';
import { IgnoreKeys } from 'react-hotkeys';
import { connect } from 'react-redux';
import useResizeObserver from 'use-resize-observer';

import loadable from '@loadable/component';
import AppBar from '@material-ui/core/AppBar';
import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import Toolbar from '@material-ui/core/Toolbar';
import makeStyles from '@material-ui/core/styles/makeStyles';
import Settings from '@material-ui/icons/Settings';
import Alert from '@material-ui/lab/Alert';
import AlertTitle from '@material-ui/lab/AlertTitle';

import { isThemeDark } from '@skybrush/app-theme-material-ui';

import NavigationButtonGroup from './NavigationButtonGroup';
import NavigationInstructions from './NavigationInstructions';
import Overlay from './Overlay';

import DarkModeSwitch from '~/components/DarkModeSwitch';
import ToolbarDivider from '~/components/ToolbarDivider';
import {
  setAppSettingsDialogTab,
  showAppSettingsDialog,
} from '~/features/settings/actions';
import NearestItemTooltip from '~/features/session/NearestItemTooltip';
import { getLightingConditionsForThreeDView } from '~/features/settings/selectors';
import { toggleLightingConditionsInThreeDView } from '~/features/settings/slice';
import { resetZoom, rotateViewToDrones } from '~/features/three-d/actions';
import { cameraRef } from '~/features/three-d/refs';
import { setNavigationMode } from '~/features/three-d/slice';
import { isMapCoordinateSystemSpecified } from '~/selectors/map';

const ThreeDView = loadable(() =>
  import(/* webpackChunkName: "three-d" */ './ThreeDView')
);

const useStyles = makeStyles(
  (theme) => ({
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
  }),
  { name: 'ThreeDTopLevelView' }
);

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
      <Box display='flex' flexDirection='column' height='100%'>
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
        <Box ref={ref} position='relative' flex={1}>
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
