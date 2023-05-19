import clamp from 'lodash-es/clamp';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { Resizable } from 'react-resizable';

import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';

import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';

import {
  UAV_DETAILS_DIALOG_BODY_HEIGHT as BODY_HEIGHT,
  UAV_DETAILS_DIALOG_BODY_MIN_WIDTH as BODY_MIN_WIDTH,
  UAV_DETAILS_DIALOG_HEIGHT as HEIGHT,
  UAV_DETAILS_DIALOG_SIDEBAR_WIDTH as SIDEBAR_WIDTH,
} from './constants';

import {
  closeUAVDetailsDialog,
  getUAVDetailsDialogPosition,
  getUAVDetailsDialogWidth,
  isUAVDetailsDialogOpen,
  setUAVDetailsDialogPosition,
  setUAVDetailsDialogWidth,
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
const UAVDetailsDialog = ({
  initialPosition,
  initialWidth,
  onClose,
  onDragStop,
  onResizeStop,
  open,
}) => {
  const horizontalBound = (window.innerWidth - initialWidth) / 2;
  const verticalBound = (window.innerHeight - HEIGHT) / 2;

  const defaultPosition = {
    x: clamp(initialPosition.x, -horizontalBound, horizontalBound),
    y: clamp(initialPosition.y, -verticalBound, verticalBound),
  };

  const [width, setWidth] = useState(initialWidth - SIDEBAR_WIDTH);

  const onResize = (_event, { size }) => {
    setWidth(size.width);
  };

  return (
    <DraggableDialog
      DraggableProps={{ bounds: 'parent', defaultPosition, onStop: onDragStop }}
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
        height={BODY_HEIGHT}
        minConstraints={[BODY_MIN_WIDTH, BODY_HEIGHT]}
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
          height={BODY_HEIGHT}
          overflow='auto'
        >
          <UAVDetailsDialogBody />
        </Box>
      </Resizable>
    </DraggableDialog>
  );
};

UAVDetailsDialog.propTypes = {
  initialPosition: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
  }),
  initialWidth: PropTypes.number,
  onClose: PropTypes.func,
  onDragStop: PropTypes.func,
  onResizeStop: PropTypes.func,
  open: PropTypes.bool,
};

export default connect(
  // mapStateToProps
  (state) => ({
    initialPosition: getUAVDetailsDialogPosition(state),
    initialWidth: getUAVDetailsDialogWidth(state),
    open: isUAVDetailsDialogOpen(state),
  }),

  // mapDispatchToProps
  {
    onClose: closeUAVDetailsDialog,
    onDragStop:
      (_event, { x, y }) =>
      (dispatch) => {
        dispatch(setUAVDetailsDialogPosition({ x, y }));
      },
    onResizeStop:
      (_event, { size }) =>
      (dispatch) => {
        dispatch(setUAVDetailsDialogWidth(size.width + SIDEBAR_WIDTH));
      },
  }
)(UAVDetailsDialog);
