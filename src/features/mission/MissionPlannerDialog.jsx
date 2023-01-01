import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { connect } from 'react-redux';

import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';

import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';

import { showErrorMessage } from '~/features/error-handling/actions';
import { isConnected as isConnectedToServer } from '~/features/servers/selectors';
import messageHub from '~/message-hub';
import { MissionType } from '~/model/missions';

import {
  prepareMappingForSingleUAVMissionFromSelection,
  setMissionItemsFromArray,
} from './actions';
import { getParametersFromContext } from './parameter-context';
import { isMissionPlannerDialogOpen } from './selectors';
import {
  closeMissionPlannerDialog,
  setMissionPlannerDialogParameters,
  setMissionType,
} from './slice';

import MissionPlannerMainPanel from './MissionPlannerMainPanel';

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
  const [parametersFromUser, setParametersFromUser] =
    useState(initialParameters);
  const [parametersFromContext, setParametersFromContext] = useState(null);
  const [selectedPage, setSelectedPage] = useState('type');
  const [canInvokePlanner, setCanInvokePlanner] = useState(false);

  const handleMissionTypeChange = (value) => {
    setMissionType(value);
    setSelectedPage(value ? 'parameters' : 'type');

    if (!value) {
      setCanInvokePlanner(false);
    }
  };

  const handleParametersChange = ({ fromUser, fromContext }) => {
    let parametersValid = false;

    if (
      typeof fromUser === 'object' &&
      fromUser !== null &&
      fromUser !== undefined
    ) {
      setParametersFromUser(fromUser);

      if (onSaveParameters) {
        onSaveParameters(fromUser);
      }

      parametersValid = true;
    } else {
      setParametersFromUser(null);
    }

    setParametersFromContext(fromContext);
    setCanInvokePlanner(missionType && parametersValid);
  };

  const invokePlanner = () => {
    if (onInvokePlanner && canInvokePlanner && isConnectedToServer) {
      onInvokePlanner(missionType, {
        fromUser: parametersFromUser,
        fromContext: parametersFromContext,
      });
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
        parameters={parametersFromUser}
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
  initialParameters: PropTypes.object,
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
      (missionType, { fromUser, fromContext }) =>
      async (dispatch, getState) => {
        let items = null;
        const parameters = {};

        try {
          Object.assign(
            parameters,
            getParametersFromContext(fromContext, getState)
          );
        } catch (error) {
          dispatch(showErrorMessage('Error while setting parameters', error));
          return;
        }

        Object.assign(parameters, fromUser);

        try {
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
          dispatch(setMissionItemsFromArray(items));
          dispatch(prepareMappingForSingleUAVMissionFromSelection());
          dispatch(closeMissionPlannerDialog());
        }
      },
    onSaveParameters: setMissionPlannerDialogParameters,
  }
)(MissionPlannerDialog);