import clamp from 'lodash-es/clamp';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';
import ResizableBox from '@skybrush/mui-components/lib/ResizableBox';

import { clearPendingUAVId } from '~/features/hotkeys/actions';
import { isPendingUAVIdOverlayVisible } from '~/features/hotkeys/selectors';

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
      <ResizableBox
        axis='x'
        resizeHandles={['e']}
        initialSize={{
          width: initialWidth - SIDEBAR_WIDTH,
          height: BODY_HEIGHT,
        }}
        minConstraints={[BODY_MIN_WIDTH, BODY_HEIGHT]}
        boxProps={{ maxWidth: '100%' }}
        onResizeStop={onResizeStop}
      >
        <UAVDetailsDialogBody />
      </ResizableBox>
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
    onClose: () => (dispatch, getState) => {
      if (isPendingUAVIdOverlayVisible(getState())) {
        dispatch(clearPendingUAVId());
      } else {
        dispatch(closeUAVDetailsDialog());
      }
    },
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
