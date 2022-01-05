import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';
import { makeStyles } from '@material-ui/core/styles';

import FadeAndSlide from '~/components/transitions/FadeAndSlide';
import {
  getShowEnvironmentType,
  isShowAuthorizedToStartLocally,
} from '~/features/show/selectors';

import EnvironmentButton from './EnvironmentButton';
import GeofenceButton from './GeofenceButton';
import LargeControlButtonGroup from './LargeControlButtonGroup';
import LoadShowFromFileButton from './LoadShowFromFileButton';
import ManualPreflightChecksButton from './ManualPreflightChecksButton';
import OnboardPreflightChecksButton from './OnboardPreflightChecksButton';
import ShowUploadDialogButton from './ShowUploadDialogButton';
import StartTimeButton from './StartTimeButton';
import TakeoffAreaButton from './TakeoffAreaButton';

const useStyles = makeStyles(
  (theme) => ({
    root: {
      position: 'absolute',
      left: 0,
      top: 0,
      right: 0,
      bottom: 0,
    },

    scrollable: {
      overflow: 'auto',
    },

    button: {
      flex: 1,
      margin: theme.spacing(1),
    },
  }),
  {
    name: 'ShowControlPanelUpperSegment',
  }
);

/**
 * Panel that shows the widgets that are needed to load and configure a drone
 * show.
 */
const ShowControlPanelUpperSegment = ({ environmentType, isAuthorized }) => {
  const classes = useStyles();

  return (
    <Box flex={1} position='relative'>
      <FadeAndSlide
        mountOnEnter
        unmountOnExit
        in={!isAuthorized}
        direction='left'
      >
        <Box className={clsx(classes.root, classes.scrollable)}>
          <List dense>
            <LoadShowFromFileButton />

            <Divider />

            <EnvironmentButton />
            <TakeoffAreaButton />
            {environmentType === 'outdoor' && <GeofenceButton />}
            <ShowUploadDialogButton />

            <Divider />

            <OnboardPreflightChecksButton />
            <ManualPreflightChecksButton />

            <Divider />

            <StartTimeButton />
          </List>
        </Box>
      </FadeAndSlide>

      <FadeAndSlide
        mountOnEnter
        unmountOnExit
        in={isAuthorized}
        direction='left'
      >
        <Box
          className={clsx(classes.root)}
          display='flex'
          flexDirection='column'
        >
          <LargeControlButtonGroup />
        </Box>
      </FadeAndSlide>
    </Box>
  );
};

ShowControlPanelUpperSegment.propTypes = {
  environmentType: PropTypes.oneOf(['indoor', 'outdoor']),
  isAuthorized: PropTypes.bool,
};

export default connect(
  // mapStateToProps
  (state) => ({
    environmentType: getShowEnvironmentType(state),
    filename: null,
    isAuthorized: isShowAuthorizedToStartLocally(state),
  })
)(ShowControlPanelUpperSegment);
