/**
 * @file Component that shows a three-dimensional view of the drone flock.
 */

import PropTypes from 'prop-types';
import React, { useRef } from 'react';
import { connect } from 'react-redux';
import useResizeObserver from 'use-resize-observer';

import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import Settings from '@material-ui/icons/Settings';
import Alert from '@material-ui/lab/Alert';
import AlertTitle from '@material-ui/lab/AlertTitle';

import Overlay from './Overlay';
import ThreeDView from './ThreeDView';

import {
  setAppSettingsDialogTab,
  showAppSettingsDialog
} from '~/actions/app-settings';
import { isMapCoordinateSystemSpecified } from '~/selectors/map';

const ThreeDTopLevelView = ({ hasMapCoordinateSystem, onShowSettings }) => {
  const threeDViewRef = useRef(null);
  const { ref } = useResizeObserver({
    onResize() {
      if (threeDViewRef.current) {
        threeDViewRef.current.resize();
      }
    }
  });

  return (
    <Box ref={ref} position="relative">
      <ThreeDView ref={threeDViewRef} />
      {!hasMapCoordinateSystem && (
        <Overlay left={8} right={8} top={8}>
          <Alert
            severity="warning"
            action={
              <IconButton color="inherit" size="small" onClick={onShowSettings}>
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
  );
};

ThreeDTopLevelView.propTypes = {
  hasMapCoordinateSystem: PropTypes.bool,
  onShowSettings: PropTypes.func
};

export default connect(
  // mapStateToProps
  state => ({
    hasMapCoordinateSystem: isMapCoordinateSystemSpecified(state)
  }),
  // mapDispatchToProps
  {
    onShowSettings: () => dispatch => {
      dispatch(setAppSettingsDialogTab('display'));
      dispatch(showAppSettingsDialog());
    }
  }
)(ThreeDTopLevelView);
