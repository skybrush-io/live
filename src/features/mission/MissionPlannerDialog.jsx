import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { connect } from 'react-redux';

import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';

import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';

import { showErrorMessage } from '~/features/error-handling/actions';
import {
  getFeatureById,
  getSelectedFeatureIds,
} from '~/features/map-features/selectors';
import { isConnected as isConnectedToServer } from '~/features/servers/selectors';
import {
  getCurrentGPSPositionByUavId,
  getSingleSelectedUAVId,
} from '~/features/uavs/selectors';
import messageHub from '~/message-hub';
import { FeatureType } from '~/model/features';

import { setMissionItemsFromArray } from './actions';
import { isMissionPlannerDialogOpen } from './selectors';
import { closeMissionPlannerDialog } from './slice';

import MissionPlannerMainPanel from './MissionPlannerMainPanel';

/**
 * Presentation component for the dialog that allows the user to plan a mission
 * by invoking a mission planning service on the server.
 */
const MissionPlannerDialog = ({
  isConnectedToServer,
  onClose,
  onInvokePlanner,
  open,
}) => {
  const [parameters, setParameters] = useState(null);
  const [canInvokePlanner, setCanInvokePlanner] = useState(true);

  const handleParametersChange = (value) => {
    if (typeof value === 'object' && value !== null && value !== undefined) {
      setParameters(value);
      setCanInvokePlanner(true);
    } else {
      setParameters(null);
      setCanInvokePlanner(false);
    }
  };

  const invokePlanner = () => {
    if (onInvokePlanner && canInvokePlanner && isConnectedToServer) {
      onInvokePlanner(parameters);
    }
  };

  return (
    <DraggableDialog
      fullWidth
      open={open}
      maxWidth='sm'
      title='Plan mission'
      onClose={onClose}
    >
      <DialogContent>
        <MissionPlannerMainPanel onChange={handleParametersChange} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          disabled={!isConnectedToServer || !canInvokePlanner}
          color='primary'
          onClick={invokePlanner}
        >
          Create plan
        </Button>
      </DialogActions>
    </DraggableDialog>
  );
};

MissionPlannerDialog.propTypes = {
  isConnectedToServer: PropTypes.bool,
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onInvokePlanner: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    open: isMissionPlannerDialogOpen(state),
    isConnectedToServer: isConnectedToServer(state),
  }),

  // mapDispatchToProps
  {
    onClose: closeMissionPlannerDialog,
    onInvokePlanner: (parameters) => async (dispatch, getState) => {
      let items = null;

      try {
        const state = getState();
        const selectedFeatureIds = getSelectedFeatureIds(state);
        const uavId = getSingleSelectedUAVId(state);

        if (!uavId) {
          throw new Error('Exactly one UAV must be selected');
        }

        if (selectedFeatureIds.length !== 1) {
          throw new Error(
            'Exactly one line string must be selected on the map'
          );
        }

        const feature = getFeatureById(state, selectedFeatureIds[0]);
        if (feature?.type !== FeatureType.LINE_STRING) {
          throw new Error(
            `The selected feature on the map must be a line string, got: ${selectedFeatureTypes[0]}`
          );
        }

        if (!Array.isArray(feature.points) || feature.points.length === 0) {
          throw new Error(
            'The selected line string must have at least one point'
          );
        }

        // Extend the parameters with the coordinates of the selected line string
        // and the coordinates of the selected UAV
        const uavPosition = getCurrentGPSPositionByUavId(state, uavId);
        if (!uavPosition) {
          throw new Error('The selected UAV does not have a GPS position yet');
        }

        parameters.start = [
          Math.round(uavPosition.lon * 1e7),
          Math.round(uavPosition.lat * 1e7),
        ];

        parameters.towers = feature.points.map((point) => [
          Math.round(point[0] * 1e7),
          Math.round(point[1] * 1e7),
        ]);

        items = await messageHub.execute.planMission({
          id: 'powerline',
          parameters,
        });
        if (!Array.isArray(items)) {
          throw new TypeError('Expected an array of mission items');
        }
      } catch (error) {
        dispatch(
          showErrorMessage('Error while invoking mission planner', error)
        );
      }

      if (Array.isArray(items)) {
        dispatch(setMissionItemsFromArray(items));
        dispatch(closeMissionPlannerDialog());
      }
    },
  }
)(MissionPlannerDialog);
