import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';

import { LPS_DETAILS_DIALOG_SIDEBAR_WIDTH as WIDTH } from './constants';
import { getSelectedLPSIdInLPSDetailsDialog } from './details';

import CalibrationButton from './CalibrationButton';

const useStyles = makeStyles(
  (theme) => ({
    root: {
      padding: theme.spacing(2),
      minWidth: WIDTH,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    },

    mainBox: {
      flex: 1,
    },
  }),
  {
    name: 'LPSDetailsDialogSidebar',
  }
);

/**
 * Sidebar of the UAV details dialog.
 */
const LPSDetailsDialogSidebar = ({ lpsId }) => {
  const classes = useStyles();
  return (
    <Box className={classes.root}>
      <Box className={classes.mainBox}>{lpsId}</Box>
      <CalibrationButton lpsId={lpsId} />
    </Box>
  );
};

LPSDetailsDialogSidebar.propTypes = {
  lpsId: PropTypes.string,
};

export default connect(
  // mapStateToProps
  (state) => ({
    lpsId: getSelectedLPSIdInLPSDetailsDialog(state),
  }),
  // mapDispatchToProps
  {}
)(LPSDetailsDialogSidebar);
