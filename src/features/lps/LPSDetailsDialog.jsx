import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';

import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';

import {
  LPS_DETAILS_DIALOG_BODY_HEIGHT as BODY_HEIGHT,
  LPS_DETAILS_DIALOG_BODY_MIN_WIDTH as BODY_WIDTH,
} from './constants';

import { closeLPSDetailsDialog, isLPSDetailsDialogOpen } from './details';

import LPSDetailsDialogBody from './LPSDetailsDialogBody';
import LPSDetailsDialogSidebar from './LPSDetailsDialogSidebar';
import LPSDetailsDialogTabs from './LPSDetailsDialogTabs';

/**
 * Presentation component for the dialog that allows the user to inspect the
 * details of a specific UAV.
 */
const LPSDetailsDialog = ({ onClose, open }) => {
  return (
    <DraggableDialog
      DraggableProps={{ bounds: 'parent' }}
      open={open}
      maxWidth={false}
      sidebarComponents={<LPSDetailsDialogSidebar />}
      toolbarComponent={(dragHandleId) => (
        <LPSDetailsDialogTabs dragHandle={dragHandleId} />
      )}
      onClose={onClose}
    >
      <Box
        // TODO: Why is `relative` necessary? Introduced in: c81d173647
        position='relative'
        maxWidth='100%'
        width={BODY_WIDTH}
        height={BODY_HEIGHT}
        overflow='auto'
      >
        <LPSDetailsDialogBody />
      </Box>
    </DraggableDialog>
  );
};

LPSDetailsDialog.propTypes = {
  onClose: PropTypes.func,
  open: PropTypes.bool,
};

export default connect(
  // mapStateToProps
  (state) => ({
    open: isLPSDetailsDialogOpen(state),
  }),

  // mapDispatchToProps
  {
    onClose: closeLPSDetailsDialog,
  }
)(LPSDetailsDialog);
