import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import RefreshIcon from '@material-ui/icons/Refresh';
import Box from '@material-ui/core/Box';
import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import IconButton from '@material-ui/core/IconButton';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import Tooltip from '@material-ui/core/Tooltip';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { useAsyncRetry } from 'react-use';

import {
  resetRTKStatistics,
  showCoordinateRestorationDialog,
  openRTKPresetDialog,
} from '~/features/rtk/slice';
import {
  hasSavedCoordinateForPreset,
  getSavedCoordinateForPreset,
} from '~/features/rtk/selectors';
import messageHub from '~/message-hub';

const NULL_ID = '__null__';

const nullPreset = {
  id: NULL_ID,
  title: 'RTK disabled',
};

const RTKCorrectionSourceSelector = ({
  onCreatePreset,
  onEditPreset,
  onSourceChanged,
  presetsRefreshTrigger,
  t,
  hasSavedCoordinateForPreset,
  getSavedCoordinateForPreset,
  showCoordinateRestorationDialog,
}) => {
  const [selectedByUser, setSelectedByUser] = useState();

  const presetsState = useAsyncRetry(async () => {
    return messageHub.query.getRTKPresets();
  }, [presetsRefreshTrigger]);

  const selectionState = useAsyncRetry(async () => {
    return messageHub.query.getSelectedRTKPresetId();
  }, [presetsRefreshTrigger]);

  const loading = presetsState.loading || selectionState.loading;
  const hasError = presetsState.error || selectionState.error;

  const presets = presetsState.value || [];
  const hasSelectionFromServer = selectionState.value !== undefined;
  const selectedOnServer =
    selectionState.value === undefined
      ? undefined
      : (selectionState.value ?? NULL_ID);
  const hasPresets = presets && presets.length > 0;

  const handleChange = async (event) => {
    const newPresetId = event.target.value;

    // Check if there's a saved coordinate for this preset
    if (newPresetId !== NULL_ID && hasSavedCoordinateForPreset(newPresetId)) {
      const savedCoordinate = getSavedCoordinateForPreset(newPresetId);
      showCoordinateRestorationDialog({
        presetId: newPresetId,
        savedCoordinate,
      });
    }

    // We assume that the request will succeed so we eagerly select the new
    // value. If changing the RTK source fails, it will be changed back in the
    // response handler triggered by the effect that we set up below.
    setSelectedByUser(newPresetId);

    if (onSourceChanged) {
      onSourceChanged();
    }
  };

  const handleRefresh = () => {
    presetsState.retry();
    selectionState.retry();
  };

  const selectionRetry = selectionState.retry;

  // If the selection of the user differs from the selection on the server,
  // send the selection of the user to the server
  useEffect(() => {
    let isMounted = true;

    if (selectedByUser !== undefined && selectedByUser !== selectedOnServer) {
      const commitNewSelection = async () => {
        const newId = selectedByUser === NULL_ID ? null : selectedByUser;
        try {
          await messageHub.execute.setRTKCorrectionsSource(newId);
        } catch (error) {
          console.warn(error);
        }

        try {
          if (isMounted) {
            selectionRetry(); // Refresh selection from server
          }
        } catch (error) {
          console.warn(error);
          throw error;
        }
      };

      commitNewSelection();
    }

    return () => {
      isMounted = false;
    };
  }, [
    selectionRetry,
    selectedByUser,
    selectedOnServer,
    setSelectedByUser,
  ]);

  // Cleanup optimistic state when server state catches up
  useEffect(() => {
    if (selectedByUser !== undefined && selectedByUser === selectedOnServer) {
      setSelectedByUser(undefined);
    }
  }, [selectedByUser, selectedOnServer]);

  const handleCreatePreset = () => {
    if (onCreatePreset) {
      onCreatePreset();
    }
  };

  const handleEditPreset = (presetId, preset) => {
    if (onEditPreset) {
      // Determine preset type - assume User if not specified
      const presetType = preset?.type || 'User';
      onEditPreset(presetId, presetType);
    }
  };

  const handleEditCurrentPreset = () => {
    const currentValue =
      selectedByUser || (hasSelectionFromServer ? selectedOnServer : NULL_ID);
    if (currentValue && currentValue !== NULL_ID) {
      const preset = presets.find((p) => p.id === currentValue);
      if (preset) {
        handleEditPreset(currentValue, preset);
      }
    }
  };

  const currentValue =
    selectedByUser || (hasSelectionFromServer ? selectedOnServer : NULL_ID);
  const canEdit =
    !loading &&
    !hasError &&
    hasPresets &&
    currentValue &&
    currentValue !== NULL_ID;

  return (
    <FormGroup>
      <Box display='flex' alignItems='center' style={{ gap: '8px' }}>
        <FormControl
          variant='filled'
          error={hasError && !loading}
          style={{ flex: 1 }}
        >
          <InputLabel htmlFor='rtk-corrections'>
            {t('RTKCorrectionSourceSelector.RTKCorrections')}
          </InputLabel>
          <Select
            displayEmpty
            disabled={Boolean(hasError || loading || !hasPresets)}
            value={currentValue}
            inputProps={{ id: 'rtk-corrections' }}
            onChange={handleChange}
          >
            {presetsState.loading ? (
              <MenuItem disabled value={NULL_ID}>
                {t('RTKCorrectionSourceSelector.pleaseWait')}
              </MenuItem>
            ) : hasError ? (
              <MenuItem disabled value={NULL_ID}>
                {t('RTKCorrectionSourceSelector.error')}
              </MenuItem>
            ) : hasPresets ? (
              [nullPreset, ...presets].map((preset) => (
                <MenuItem key={preset.id} value={preset.id}>
                  {preset.title}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled value='__null__'>
                {t('RTKCorrectionSourceSelector.noRTKData')}
              </MenuItem>
            )}
          </Select>
        </FormControl>
        <Tooltip
          title={t('RTKCorrectionSourceSelector.editPreset', 'Edit preset')}
        >
          <span>
            <IconButton
              disabled={!canEdit}
              size='small'
              onClick={handleEditCurrentPreset}
            >
              <EditIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip
          title={t('RTKCorrectionSourceSelector.refresh', 'Refresh sources')}
        >
          <span>
            <IconButton disabled={loading} size='small' onClick={handleRefresh}>
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip
          title={t(
            'RTKCorrectionSourceSelector.createPreset',
            'Create new RTK preset'
          )}
        >
          <span>
            <IconButton
              disabled={loading}
              size='small'
              onClick={handleCreatePreset}
            >
              <AddIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </FormGroup>
  );
};

RTKCorrectionSourceSelector.propTypes = {
  onCreatePreset: PropTypes.func,
  onEditPreset: PropTypes.func,
  onSourceChanged: PropTypes.func,
  presetsRefreshTrigger: PropTypes.number,
  t: PropTypes.func,
  hasSavedCoordinateForPreset: PropTypes.func,
  getSavedCoordinateForPreset: PropTypes.func,
  showCoordinateRestorationDialog: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    hasSavedCoordinateForPreset: (presetId) =>
      hasSavedCoordinateForPreset(state, presetId),
    getSavedCoordinateForPreset: (presetId) =>
      getSavedCoordinateForPreset(state, presetId),
    presetsRefreshTrigger: state.rtk.presetsRefreshTrigger,
  }),
  // mapDispatchToProps
  (dispatch) => ({
    onCreatePreset() {
      dispatch(openRTKPresetDialog({ mode: 'create' }));
    },
    onEditPreset(presetId, presetType) {
      dispatch(openRTKPresetDialog({ mode: 'edit', presetId, presetType }));
    },
    onSourceChanged: () => dispatch(resetRTKStatistics()),
    showCoordinateRestorationDialog: (payload) =>
      dispatch(showCoordinateRestorationDialog(payload)),
  })
)(withTranslation()(RTKCorrectionSourceSelector));
