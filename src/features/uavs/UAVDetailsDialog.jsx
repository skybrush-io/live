import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';

import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';

import {
  closeUAVDetailsDialog,
  getSelectedTabInUAVDetailsDialog,
} from './details';

import UAVDetailsDialogBody from './UAVDetailsDialogBody';
import UAVDetailsDialogSidebar from './UAVDetailsDialogSidebar';
import UAVDetailsDialogTabs from './UAVDetailsDialogTabs';

/**
 * Presentation component for the dialog that allows the user to inspect the
 * details of a specific UAV.
 */
const UAVDetailsDialog = ({ onClose, open }) => (
  <DraggableDialog
    fullWidth
    open={open}
    maxWidth='sm'
    sidebarComponents={<UAVDetailsDialogSidebar />}
    toolbarComponent={(dragHandleId) => (
      <UAVDetailsDialogTabs dragHandle={dragHandleId} />
    )}
    onClose={onClose}
  >
    <Box position='relative' height={448} overflow='auto'>
      <UAVDetailsDialogBody />
    </Box>
  </DraggableDialog>
);

UAVDetailsDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    open: state.dialogs.uavDetails.open,
    selectedTab: getSelectedTabInUAVDetailsDialog(state),
  }),

  // mapDispatchToProps
  {
    onClose: closeUAVDetailsDialog,
  }
)(UAVDetailsDialog);
