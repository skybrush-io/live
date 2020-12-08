import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import DraggableDialog from '~/components/dialogs/DraggableDialog';

import { closeUAVDetailsDialog } from './details';

import UAVDetailsDialogSidebar from './UAVDetailsDialogSidebar';
import UAVDetailsDialogTabs from './UAVDetailsDialogTabs';

/**
 * Presentation component for the dialog that allows the user to inspect the
 * details of a specific UAV.
 */
const UAVDetailsDialog = ({ onClose, open }) => {
  return (
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
      Dialog body
    </DraggableDialog>
  );
};

UAVDetailsDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    open: state.dialogs.uavDetails.open,
  }),

  // mapDispatchToProps
  {
    onClose: closeUAVDetailsDialog,
  }
)(UAVDetailsDialog);
