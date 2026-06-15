import Box from '@mui/material/Box';
import clamp from 'lodash-es/clamp';
import type React from 'react';
import type { DraggableData, DraggableEvent } from 'react-draggable';
import { connect } from 'react-redux';
import type { ResizeCallbackData } from 'react-resizable';

import { DraggableDialog } from '@skybrush/mui-components';

import ResizableBox from '~/components/ResizableBox';
import { clearPendingUAVId } from '~/features/hotkeys/actions';
import { isPendingUAVIdOverlayVisible } from '~/features/hotkeys/selectors';
import type { AppDispatch, RootState } from '~/store/reducers';
import type { Coordinate2DObject } from '~/utils/math';

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

type StateProps = {
  initialPosition: Coordinate2DObject;
  initialWidth: number;
  open: boolean;
};

type DispatchProps = {
  onClose: () => void;
  onDragStop: (event: DraggableEvent, data: DraggableData) => void;
  onResizeStop: (event: React.SyntheticEvent, data: ResizeCallbackData) => void;
};

type UAVDetailsDialogProps = StateProps & DispatchProps;

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
}: UAVDetailsDialogProps) => {
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
        <UAVDetailsDialogTabs dragHandleId={dragHandleId} />
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
        // Props copied from react-resizable defaults, because the lib's
        // typing incorrectly exposes them as required.
        // TODO: remove the following props when the fix is merged.
        // PR with the fix: https://github.com/react-grid-layout/react-resizable/pull/264
        handleSize={[20, 20]}
        lockAspectRatio={false}
        maxConstraints={[Infinity, Infinity]}
        transformScale={1}
      >
        <Box sx={{ height: '100%', overflow: 'auto' }}>
          <UAVDetailsDialogBody />
        </Box>
      </ResizableBox>
    </DraggableDialog>
  );
};

const ConnectedUAVDetailsDialog = connect(
  // mapStateToProps
  (state: RootState) => ({
    initialPosition: getUAVDetailsDialogPosition(state),
    initialWidth: getUAVDetailsDialogWidth(state),
    open: isUAVDetailsDialogOpen(state),
  }),

  // mapDispatchToProps
  {
    onClose: () => (dispatch: AppDispatch, getState: () => RootState) => {
      if (isPendingUAVIdOverlayVisible(getState())) {
        dispatch(clearPendingUAVId());
      } else {
        dispatch(closeUAVDetailsDialog());
      }
    },
    onDragStop:
      (_event: DraggableEvent, { x, y }: DraggableData) =>
      (dispatch: AppDispatch) => {
        dispatch(setUAVDetailsDialogPosition({ x, y }));
      },
    onResizeStop:
      (_event: React.SyntheticEvent, { size }: ResizeCallbackData) =>
      (dispatch: AppDispatch) => {
        dispatch(setUAVDetailsDialogWidth(size.width + SIDEBAR_WIDTH));
      },
  }
)(UAVDetailsDialog);

export default ConnectedUAVDetailsDialog;
