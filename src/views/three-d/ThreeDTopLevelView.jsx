/**
 * @file Component that shows a three-dimensional view of the drone flock.
 */

import PropTypes from 'prop-types';
import React, { useRef } from 'react';
import { connect } from 'react-redux';
import useResizeObserver from 'use-resize-observer';

import AppBar from '@material-ui/core/AppBar';
import Box from '@material-ui/core/Box';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import Toolbar from '@material-ui/core/Toolbar';
import makeStyles from '@material-ui/core/styles/makeStyles';
import Settings from '@material-ui/icons/Settings';
import Alert from '@material-ui/lab/Alert';
import AlertTitle from '@material-ui/lab/AlertTitle';

import NavigationButtonGroup from './NavigationButtonGroup';
import NavigationInstructions from './NavigationInstructions';
import Overlay from './Overlay';
import SelectionTooltip from './SelectionTooltip';
import ThreeDView from './ThreeDView';

import {
  setAppSettingsDialogTab,
  showAppSettingsDialog,
} from '~/actions/app-settings';
import { setNavigationMode } from '~/features/three-d/slice';
import { isMapCoordinateSystemSpecified } from '~/selectors/map';
import { isDark } from '~/theme';

const useStyles = makeStyles(
  (theme) => ({
    appBar: {
      backgroundColor: isDark(theme) ? '#444' : theme.palette.background.paper,
      height: 48,
    },

    divider: {
      alignSelf: 'stretch',
      height: 'auto',
      margin: theme.spacing(1, 0.5),
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
  navigation,
  onSetNavigationMode,
  onShowSettings,
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
    <Box display='flex' flexDirection='column' height='100%'>
      <AppBar color='default' position='static' className={classes.appBar}>
        <Toolbar disableGutters variant='dense' className={classes.toolbar}>
          <NavigationButtonGroup
            mode={navigation.mode}
            parameters={navigation.parameters}
            onChange={onSetNavigationMode}
          />
          <Divider className={classes.divider} orientation='vertical' />
          <NavigationInstructions mode={navigation.mode} />
        </Toolbar>
      </AppBar>
      <Box ref={ref} position='relative' flex={1}>
        <SelectionTooltip>
          <ThreeDView ref={threeDViewRef} />
        </SelectionTooltip>
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
                Drones will become visible when a coordinate system is specified
                in the <strong>Settings</strong> dialog.
              </div>
            </Alert>
          </Overlay>
        )}
      </Box>
    </Box>
  );
};

ThreeDTopLevelView.propTypes = {
  hasMapCoordinateSystem: PropTypes.bool,
  navigation: PropTypes.shape({
    mode: PropTypes.string,
    parameters: PropTypes.object,
  }),
  onSetNavigationMode: PropTypes.func,
  onShowSettings: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    hasMapCoordinateSystem: isMapCoordinateSystemSpecified(state),
    ...state.threeD,
  }),
  // mapDispatchToProps
  {
    onSetNavigationMode: setNavigationMode,

    onShowSettings: () => (dispatch) => {
      dispatch(setAppSettingsDialogTab('display'));
      dispatch(showAppSettingsDialog());
    },
  }
)(ThreeDTopLevelView);
