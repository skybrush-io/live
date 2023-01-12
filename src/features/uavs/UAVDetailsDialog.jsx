import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { Resizable } from 'react-resizable';

import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';

import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';

import {
  closeUAVDetailsDialog,
  getUAVDetailsDialogWidth,
  isUAVDetailsDialogOpen,
  setUAVDetailsDialogWidth,
} from './details';

import UAVDetailsDialogBody from './UAVDetailsDialogBody';
import UAVDetailsDialogSidebar from './UAVDetailsDialogSidebar';
import UAVDetailsDialogTabs from './UAVDetailsDialogTabs';
import {
  UAV_DETAILS_DIALOG_MIN_WIDTH,
  UAV_DETAILS_DIALOG_HEIGHT,
} from './constants';

const useStyles = makeStyles(
  (theme) => ({
    resizeHandle: {
      width: 15,
      height: 50,

      position: 'absolute',
      right: 5,
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

const ResizeHandle = React.forwardRef(({ handleAxis, ...props }, ref) => {
  // The `handleAxis` prop is omitted, so React doesn't complain about it
  const classes = useStyles();
  return <Box ref={ref} className={classes.resizeHandle} {...props} />;
});

ResizeHandle.propTypes = {
  handleAxis: PropTypes.string,
};

/**
 * Presentation component for the dialog that allows the user to inspect the
 * details of a specific UAV.
 */
const UAVDetailsDialog = ({ initialWidth, onClose, onResizeStop, open }) => {
  const [width, setWidth] = useState(initialWidth);

  const onResize = (_event, { size }) => {
    setWidth(size.width);
  };

  return (
    <DraggableDialog
      open={open}
      maxWidth={false}
      sidebarComponents={<UAVDetailsDialogSidebar />}
      toolbarComponent={(dragHandleId) => (
        <UAVDetailsDialogTabs dragHandle={dragHandleId} />
      )}
      onClose={onClose}
    >
      <Resizable
        width={width}
        height={UAV_DETAILS_DIALOG_HEIGHT}
        minConstraints={[
          UAV_DETAILS_DIALOG_MIN_WIDTH,
          UAV_DETAILS_DIALOG_HEIGHT,
        ]}
        axis='x'
        handle={<ResizeHandle />}
        onResize={onResize}
        onResizeStop={onResizeStop}
      >
        <Box
          // TODO: Why is `relative` necessary? Introduced in: c81d173647
          position='relative'
          width={width}
          maxWidth='100%'
          height={UAV_DETAILS_DIALOG_HEIGHT}
          overflow='auto'
        >
          <UAVDetailsDialogBody />
        </Box>
      </Resizable>
    </DraggableDialog>
  );
};

UAVDetailsDialog.propTypes = {
  initialWidth: PropTypes.number,
  onClose: PropTypes.func,
  onResizeStop: PropTypes.func,
  open: PropTypes.bool,
};

export default connect(
  // mapStateToProps
  (state) => ({
    initialWidth: getUAVDetailsDialogWidth(state),
    open: isUAVDetailsDialogOpen(state),
  }),

  // mapDispatchToProps
  {
    onClose: closeUAVDetailsDialog,
    onResizeStop:
      (_event, { size }) =>
      (dispatch) => {
        dispatch(setUAVDetailsDialogWidth(size.width));
      },
  }
)(UAVDetailsDialog);
