import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';
import PropTypes from 'prop-types';
import React, { useCallback, useState } from 'react';
import { connect } from 'react-redux';

import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';

import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
import { isConnected as isConnectedToServer } from '~/features/servers/selectors';

import { clearMission, invokeMissionPlanner } from './actions';
import {
  getGeofencePolygon,
  getMissionPlannerDialogSelectedType,
  getMissionPlannerDialogUserParameters,
  isMissionPlannerDialogOpen,
  shouldMissionPlannerDialogApplyGeofence,
} from './selectors';
import {
  closeMissionPlannerDialog,
  setMissionPlannerDialogApplyGeofence,
  setMissionPlannerDialogContextParameters,
  setMissionPlannerDialogSelectedType,
  setMissionPlannerDialogUserParameters,
} from './slice';

import MissionPlannerMainPanel from './MissionPlannerMainPanel';

/**
 * Presentation component for the dialog that allows the user to plan a mission
 * by invoking a mission planning service on the server.
 */
const MissionPlannerDialog = ({
  applyGeofence,
  isConnectedToServer,
  isGeofenceOwnedByUser,
  onApplyGeofenceChanged,
  onClearMission,
  onClose,
  onInvokePlanner,
  onSaveContextParameters,
  onSaveUserParameters,
  onSelectedTypeChanged,
  open,
  parametersFromUser,
  selectedType,
}) => {
  const [selectedTypeInfo, setSelectedTypeInfo] = useState(null);
  const [canInvokePlanner, setCanInvokePlanner] = useState(false);

  const handleParametersChange = useCallback(
    ({ fromUser, fromContext }) => {
      let userParametersChanged = false;
      let parametersValid = false;

      if (fromUser !== undefined) {
        userParametersChanged = true;

        if (typeof fromUser === 'object' && fromUser !== null) {
          onSaveUserParameters(fromUser);
          parametersValid = true;
        }
      }

      if (fromContext !== undefined) {
        onSaveContextParameters(fromContext);
      }

      setCanInvokePlanner(
        Boolean(selectedTypeInfo) &&
          (userParametersChanged ? parametersValid : canInvokePlanner)
      );
    },
    [
      canInvokePlanner,
      onSaveContextParameters,
      onSaveUserParameters,
      selectedTypeInfo,
    ]
  );

  const handleMissionTypeChange = useCallback(
    (value) => {
      onSelectedTypeChanged(value.id);
      setSelectedTypeInfo(value);
      setCanInvokePlanner(Boolean(value));
    },
    [onSelectedTypeChanged, setCanInvokePlanner, setSelectedTypeInfo]
  );

  const handleMissionTypeCleared = useCallback(() => {
    onSelectedTypeChanged(null);
    handleParametersChange({ fromUser: {}, fromContext: {} });
    setCanInvokePlanner(false);
  }, [handleParametersChange, onSelectedTypeChanged, setCanInvokePlanner]);

  const invokePlanner = () => {
    if (onInvokePlanner && canInvokePlanner && isConnectedToServer) {
      onClearMission();
      onInvokePlanner();
    }
  };

  return (
    <DraggableDialog
      fullWidth
      // Mount the children of the dialog if we are connected to the server,
      // even while it is closed, so the mission parameters can be set up in the
      // store for resuming without having to open the dialog.
      keepMounted={isConnectedToServer}
      open={open}
      maxWidth='sm'
      title='Plan mission'
      onClose={onClose}
    >
      <MissionPlannerMainPanel
        parameters={parametersFromUser}
        selectedType={selectedType}
        selectedTypeInfo={selectedTypeInfo}
        onMissionTypeChange={handleMissionTypeChange}
        onMissionTypeCleared={handleMissionTypeCleared}
        onParametersChange={handleParametersChange}
      />
      <DialogActions>
        <Tooltip
          content='Manual geofence in use'
          disabled={!isGeofenceOwnedByUser}
        >
          <FormControlLabel
            label='Generate geofence'
            control={
              <Checkbox
                disabled={isGeofenceOwnedByUser}
                indeterminate={isGeofenceOwnedByUser}
                checked={applyGeofence}
                onChange={onApplyGeofenceChanged}
              />
            }
            style={{ marginLeft: 0 }}
          />
        </Tooltip>

        <Box flex={1} />

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
  applyGeofence: PropTypes.bool,
  isConnectedToServer: PropTypes.bool,
  isGeofenceOwnedByUser: PropTypes.bool,
  open: PropTypes.bool,
  onApplyGeofenceChanged: PropTypes.func,
  onClearMission: PropTypes.func,
  onClose: PropTypes.func,
  onInvokePlanner: PropTypes.func,
  onSaveContextParameters: PropTypes.func,
  onSaveUserParameters: PropTypes.func,
  onSelectedTypeChanged: PropTypes.func,
  parametersFromUser: PropTypes.object,
  selectedType: PropTypes.string,
};

export default connect(
  // mapStateToProps
  (state) => ({
    applyGeofence: shouldMissionPlannerDialogApplyGeofence(state),
    parametersFromUser: getMissionPlannerDialogUserParameters(state),
    open: isMissionPlannerDialogOpen(state),
    isConnectedToServer: isConnectedToServer(state),
    isGeofenceOwnedByUser: getGeofencePolygon(state)?.owner === 'user',
    selectedType: getMissionPlannerDialogSelectedType(state),
  }),

  // mapDispatchToProps
  {
    onApplyGeofenceChanged: (event) =>
      setMissionPlannerDialogApplyGeofence(event.target.checked),
    onClearMission: clearMission,
    onClose: closeMissionPlannerDialog,
    onInvokePlanner: invokeMissionPlanner,
    onSaveContextParameters: setMissionPlannerDialogContextParameters,
    onSaveUserParameters: setMissionPlannerDialogUserParameters,
    onSelectedTypeChanged: setMissionPlannerDialogSelectedType,
  }
)(MissionPlannerDialog);
