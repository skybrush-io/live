import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';
import LabeledStatusLight from '@skybrush/mui-components/lib/LabeledStatusLight';

import { LPS_DETAILS_DIALOG_SIDEBAR_WIDTH as WIDTH } from './constants';
import { getSelectedLPSIdInLPSDetailsDialog } from './details';

import CalibrationButton from './CalibrationButton';
import LPSStatusSummaryMiniTable from './LPSStatusSummaryMiniTable';
import { createSelector } from 'reselect';
import {
  getLocalPositioningSystemById,
  getLocalPositioningSystemDisplayName,
  getLocalPositioningSystemStatus,
} from './selectors';

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
      padding: theme.spacing(2, 0, 0, 0),
    },
  }),
  {
    name: 'LPSDetailsDialogSidebar',
  }
);

const LPSDetailsDialogSidebarHeader = connect(
  // mapStateToProps
  () => {
    const selector = createSelector(getLocalPositioningSystemById, (lps) => ({
      status: getLocalPositioningSystemStatus(lps),
      children: getLocalPositioningSystemDisplayName(lps),
    }));

    return (state, ownProps) => selector(state, ownProps.lpsId);
  },
  // mapDispatchToProps
  {}
)(LabeledStatusLight);

/**
 * Sidebar of the UAV details dialog.
 */
const LPSDetailsDialogSidebar = ({ lpsId }) => {
  const classes = useStyles();
  return (
    <Box className={classes.root}>
      <Box>
        <LPSDetailsDialogSidebarHeader lpsId={lpsId} />
      </Box>
      <Box className={classes.mainBox}>
        <LPSStatusSummaryMiniTable />
      </Box>
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
