import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';
import { useCallback, useState, type ChangeEvent } from 'react';
import { connect } from 'react-redux';

import { DraggableDialog } from '@skybrush/mui-components';

import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
import { isConnected as isConnectedToServer } from '~/features/servers/selectors';
import type { RootState } from '~/store/reducers';

import { invokeMissionPlanner } from './actions';
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

type SelectedTypeInfo = {
  id: string;
  name?: string;
  description?: string;
};

type Props = {
  applyGeofence: boolean;
  isConnectedToServer: boolean;
  isGeofenceOwnedByUser: boolean;
  onApplyGeofenceChanged: (event: ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
  onInvokePlanner: () => void;
  onSaveContextParameters: (params: Record<string, unknown>) => void;
  onSaveUserParameters: (params: Record<string, unknown>) => void;
  onSelectedTypeChanged: (type: string | undefined) => void;
  open: boolean;
  parametersFromUser: Record<string, unknown>;
  selectedType: string | undefined;
};

const MissionPlannerDialog = ({
  applyGeofence,
  isConnectedToServer,
  isGeofenceOwnedByUser,
  onApplyGeofenceChanged,
  onClose,
  onInvokePlanner,
  onSaveContextParameters,
  onSaveUserParameters,
  onSelectedTypeChanged,
  open,
  parametersFromUser,
  selectedType,
}: Props) => {
  const [selectedTypeInfo, setSelectedTypeInfo] =
    useState<SelectedTypeInfo | null>(null);
  const [canInvokePlanner, setCanInvokePlanner] = useState(false);

  const handleParametersChange = useCallback(
    ({
      fromUser,
      fromContext,
    }: {
      fromUser?: Record<string, unknown>;
      fromContext?: Record<string, unknown>;
    }) => {
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
    (value: { id: string }) => {
      onSelectedTypeChanged(value.id);
      setSelectedTypeInfo(value);
      setCanInvokePlanner(Boolean(value));
    },
    [onSelectedTypeChanged, setCanInvokePlanner, setSelectedTypeInfo]
  );

  const handleMissionTypeCleared = useCallback(() => {
    onSelectedTypeChanged(undefined);
    handleParametersChange({ fromUser: {}, fromContext: {} });
    setCanInvokePlanner(false);
  }, [handleParametersChange, onSelectedTypeChanged, setCanInvokePlanner]);

  const invokePlanner = () => {
    if (onInvokePlanner && canInvokePlanner && isConnectedToServer) {
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

        <Box sx={{ flex: 1 }} />

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

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    applyGeofence: shouldMissionPlannerDialogApplyGeofence(state),
    parametersFromUser: getMissionPlannerDialogUserParameters(state),
    open: isMissionPlannerDialogOpen(state),
    isConnectedToServer: isConnectedToServer(state),
    isGeofenceOwnedByUser: getGeofencePolygon(state)?.owner === 'user',
    selectedType: getMissionPlannerDialogSelectedType(state),
  }),

  // mapDispatchToProps
  {
    onApplyGeofenceChanged: (event: ChangeEvent<HTMLInputElement>) =>
      setMissionPlannerDialogApplyGeofence(event.target.checked),
    onClose: closeMissionPlannerDialog,
    onInvokePlanner: invokeMissionPlanner,
    onSaveContextParameters: setMissionPlannerDialogContextParameters,
    onSaveUserParameters: setMissionPlannerDialogUserParameters,
    onSelectedTypeChanged: setMissionPlannerDialogSelectedType,
  }
)(MissionPlannerDialog);
