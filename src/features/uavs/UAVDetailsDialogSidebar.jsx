import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Toolbar from '@material-ui/core/Toolbar';
import { makeStyles } from '@material-ui/core/styles';

import DroneAvatar from '~/components/uavs/DroneAvatar';
import UAVOperationsButtonGroup from '~/components/uavs/UAVOperationsButtonGroup';

import { getSelectedUAVIdInUAVDetailsDialog } from './details';
import StatusSummaryMiniTable from './StatusSummaryMiniTable';

const useStyles = makeStyles(
  (theme) => ({
    root: {
      padding: theme.spacing(2),
      minWidth: 185,
    },
    toolbar: {
      justifyContent: 'center',
      padding: theme.spacing(1, 0),
    },
    toolbarInner: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      maxWidth: 144 /* 20px for the icon, 8px for the padding around the icons, four icons per row */,
      '& > button': {
        padding: 8,
      },
    },
  }),
  {
    name: 'UAVDetailsDialogSidebar',
  }
);

/**
 * Sidebar of the UAV details dialog.
 */
const UAVDetailsDialogSidebar = ({ uavId }) => {
  const classes = useStyles();
  return (
    <Box className={classes.root}>
      <DroneAvatar id={uavId} />
      <Toolbar disableGutters variant='dense' className={classes.toolbar}>
        <Box className={classes.toolbarInner}>
          <UAVOperationsButtonGroup
            hideSeparators
            selectedUAVIds={[uavId]}
            size='small'
          />
        </Box>
      </Toolbar>
      <StatusSummaryMiniTable uavId={uavId} />
    </Box>
  );
};

UAVDetailsDialogSidebar.propTypes = {
  uavId: PropTypes.string,
};

export default connect(
  // mapStateToProps
  (state) => ({
    uavId: getSelectedUAVIdInUAVDetailsDialog(state),
  }),
  // mapDispatchToProps
  {}
)(UAVDetailsDialogSidebar);
