import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { connect } from 'react-redux';

import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';

import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';

import { showErrorMessage } from '~/features/error-handling/actions';
import { getFeatureById } from '~/features/map-features/selectors';
import { isConnected as isConnectedToServer } from '~/features/servers/selectors';
import {
  getCurrentGPSPositionByUavId,
  getSingleSelectedUAVId,
} from '~/features/uavs/selectors';
import messageHub from '~/message-hub';
import { FeatureType } from '~/model/features';
import { getSelectedFeatureIds } from '~/selectors/selection';

import { setMissionItemsFromArray } from './actions';
import { isMissionPlannerDialogOpen } from './selectors';
import {
  closeMissionPlannerDialog,
  replaceMapping,
  setMappingLength,
  setMissionPlannerDialogParameters,
  setMissionType,
  updateHomePositions,
} from './slice';

import MissionPlannerMainPanel from './MissionPlannerMainPanel';
import { isEmpty } from 'lodash-es';
import { MissionType } from '~/model/missions';

/**
 * Presentation component for the dialog that allows the user to plan a mission
 * by invoking a mission planning service on the server.
 */
const MissionPlannerDialog = ({
  initialParameters,
  isConnectedToServer,
  onClose,
  onInvokePlanner,
  onSaveParameters,
  open,
}) => {
  const [missionType, setMissionType] = useState(null);
  const [parameters, setParameters] = useState(initialParameters);
  const [selectedPage, setSelectedPage] = useState('type');
  const [canInvokePlanner, setCanInvokePlanner] = useState(false);

  const handleMissionTypeChange = (value) => {
    setMissionType(value);
    setSelectedPage(value ? 'parameters' : 'type');

    if (!value) {
      setCanInvokePlanner(false);
    }
  };

  const handleParametersChange = (value) => {
    let parametersValid = false;

    if (typeof value === 'object' && value !== null && value !== undefined) {
      setParameters(value);

      if (onSaveParameters) {
        onSaveParameters(value);
      }

      parametersValid = true;
    } else {
      setParameters(null);
    }

    setCanInvokePlanner(missionType && parametersValid);
  };

  const invokePlanner = () => {
    if (onInvokePlanner && canInvokePlanner && isConnectedToServer) {
      onInvokePlanner(missionType, parameters);
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
      <MissionPlannerMainPanel
        missionType={missionType}
        parameters={parameters}
        selectedPage={selectedPage}
        onMissionTypeChange={handleMissionTypeChange}
        onParametersChange={handleParametersChange}
      />
      <DialogActions>
        <Button
          disabled={selectedPage === 'type'}
          onClick={() => setSelectedPage('type')}
        >
          Back
        </Button>
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
  initialParameters: PropTypes.string,
  isConnectedToServer: PropTypes.bool,
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onInvokePlanner: PropTypes.func,
  onSaveParameters: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    initialParameters: state.mission?.plannerDialog?.parameters || {},
    open: isMissionPlannerDialogOpen(state),
    isConnectedToServer: isConnectedToServer(state),
  }),

  // mapDispatchToProps
  {
    onClose: closeMissionPlannerDialog,
    onInvokePlanner:
      (missionType, parameters) => async (dispatch, getState) => {
        let items = null;

        const state = getState();
        const uavId = getSingleSelectedUAVId(state);
        const uavPosition = getCurrentGPSPositionByUavId(state, uavId);

        try {
          if (!uavId) {
            throw new Error('Exactly one UAV must be selected');
          }

          if (!uavPosition) {
            throw new Error(
              'The selected UAV does not have a GPS position yet'
            );
          }

          const selectedFeatureIds = getSelectedFeatureIds(state);
          if (selectedFeatureIds.length !== 1) {
            throw new Error(
              'Exactly one line string must be selected on the map'
            );
          }

          const feature = getFeatureById(state, selectedFeatureIds[0]);
          if (feature?.type !== FeatureType.LINE_STRING) {
            throw new Error(
              `The selected feature on the map must be a line string, got: ${feature?.type}`
            );
          }

          if (!Array.isArray(feature.points) || feature.points.length === 0) {
            throw new Error(
              'The selected line string must have at least one point'
            );
          }

          // Extend the parameters with the coordinates of the selected line string
          // and the coordinates of the selected UAV
          Object.assign(parameters, {
            start: [
              Math.round(uavPosition.lon * 1e7),
              Math.round(uavPosition.lat * 1e7),
            ],
            towers: feature.points.map((point) => [
              Math.round(point[0] * 1e7),
              Math.round(point[1] * 1e7),
            ]),
          });

          items = await messageHub.execute.planMission({
            id: missionType.id,
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
          dispatch(setMissionType(MissionType.WAYPOINT));
          dispatch(setMappingLength(1));
          dispatch(replaceMapping([uavId]));
          dispatch(updateHomePositions([uavPosition]));
          dispatch(setMissionItemsFromArray(items));
          dispatch(closeMissionPlannerDialog());
        }
      },
    onSaveParameters: setMissionPlannerDialogParameters,
  }
)(MissionPlannerDialog);
