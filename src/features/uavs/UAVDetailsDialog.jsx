import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { ResizableBox } from 'react-resizable';

import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';

import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';

import {
  closeUAVDetailsDialog,
  getSelectedTabInUAVDetailsDialog,
} from './details';

import UAVDetailsDialogBody from './UAVDetailsDialogBody';
import UAVDetailsDialogSidebar from './UAVDetailsDialogSidebar';
import UAVDetailsDialogTabs from './UAVDetailsDialogTabs';

const useStyles = makeStyles(
  (theme) => ({
    resizeHandle: {
      width: 15,
      height: 50,

      position: 'absolute',
      right: 0,
      top: '50%',

      cursor: 'ew-resize',

      '&:after': {
        content: '""',
        display: 'block',

        width: 10,
        height: 50,

        borderRight: `5px dotted ${theme.palette.action.selected}`,
      },
    },
  }),
  { name: 'UAVDetailsDialog' }
);

const ResizeHandle = React.forwardRef((props, ref) => {
  const classes = useStyles();
  return <Box ref={ref} className={classes.resizeHandle} {...props} />;
});

/**
 * Presentation component for the dialog that allows the user to inspect the
 * details of a specific UAV.
 */
const UAVDetailsDialog = ({ onClose, open }) => (
  <DraggableDialog
    open={open}
    maxWidth={false}
    sidebarComponents={<UAVDetailsDialogSidebar />}
    toolbarComponent={(dragHandleId) => (
      <UAVDetailsDialogTabs dragHandle={dragHandleId} />
    )}
    onClose={onClose}
  >
    <ResizableBox
      width={414}
      height={448}
      minConstraints={[414, 448]}
      axis='x'
      handle={<ResizeHandle />}
    >
      <Box position='relative' height={448} overflow='auto'>
        <UAVDetailsDialogBody />
      </Box>
    </ResizableBox>
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
