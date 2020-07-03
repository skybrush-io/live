import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Dialog from '@material-ui/core/Dialog';

import BearingCalculator from './BearingCalculator';
import CoordinateAveragingDialogToolbar from './CoordinateAveragingDialogToolbar';
import MeasurementList from './MeasurementList';
import { closeAveragingDialog } from './slice';

/**
 * Presentation component for the dialog that allows the user to take a
 * long-running average of the coordinates of one or more UAVs.
 */
const CoordinateAveragingDialog = ({ onClose, open }) => (
  <Dialog fullWidth open={open} maxWidth='sm' onClose={onClose}>
    <CoordinateAveragingDialogToolbar />
    <Box
      display='flex'
      flexDirection='row'
      alignItems='stretch'
      minHeight={240}
    >
      <Box flex={1}>
        <MeasurementList />
      </Box>
      {/*
      <Box width={240}>
        <MeasurementList />
      </Box>
      <Box flex={1}>
        <BackgroundHint text='Map component goes here' />
      </Box>
      */}
    </Box>
    <Box className='bottom-bar' textAlign='center' py={1}>
      <BearingCalculator />
    </Box>
  </Dialog>
);

CoordinateAveragingDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    open: state.measurement.averagingDialog.open,
  }),

  // mapDispatchToProps
  {
    onClose: closeAveragingDialog,
  }
)(CoordinateAveragingDialog);
