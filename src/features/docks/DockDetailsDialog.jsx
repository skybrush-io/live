import Box from '@mui/material/Box';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { DraggableDialog } from '@skybrush/mui-components';

import {
  closeDockDetailsDialog,
  getSelectedTabInDockDetailsDialog,
} from './details';
import DockDetailsDialogBody from './DockDetailsDialogBody';
import DockDetailsDialogSidebar from './DockDetailsDialogSidebar';
import DockDetailsDialogTabs from './DockDetailsDialogTabs';

/**
 * Presentation component for the dialog that allows the user to inspect the
 * details of a specific docking station.
 */
const DockDetailsDialog = ({ onClose, open }) => (
  <DraggableDialog
    fullWidth
    open={open}
    maxWidth='sm'
    sidebarComponents={<DockDetailsDialogSidebar />}
    toolbarComponent={(dragHandleId) => (
      <DockDetailsDialogTabs dragHandle={dragHandleId} />
    )}
    onClose={onClose}
  >
    <Box sx={{ position: 'relative', height: 448, overflow: 'auto' }}>
      <DockDetailsDialogBody />
    </Box>
  </DraggableDialog>
);

DockDetailsDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    open: state.dialogs.dockDetails.open,
    selectedTab: getSelectedTabInDockDetailsDialog(state),
  }),

  // mapDispatchToProps
  {
    onClose: closeDockDetailsDialog,
  }
)(DockDetailsDialog);
