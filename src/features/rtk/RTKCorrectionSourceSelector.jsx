import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { useAsync, useAsyncFn } from 'react-use';

import FormControl from '@material-ui/core/FormControl';
import FormGroup from '@material-ui/core/FormGroup';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';

import { resetRTKStatistics } from '~/features/rtk/slice';
import messageHub from '~/message-hub';

const NULL_ID = '__null__';

const nullPreset = {
  id: NULL_ID,
  title: 'RTK disabled',
};

const RTKCorrectionSourceSelector = ({ onSourceChanged }) => {
  const [selectedByUser, setSelectedByUser] = useState();
  const [selectionState, getSelectionFromServer] = useAsyncFn(async () =>
    messageHub.query.getSelectedRTKPresetId()
  );

  const presetsState = useAsync(
    async () => messageHub.query.getRTKPresets(),
    []
  );

  const loading = presetsState.loading || selectionState.loading;
  const hasError = presetsState.error || selectionState.error;

  const presets = presetsState.value ? presetsState.value : [];
  const hasSelectionFromServer = selectionState.value !== undefined;
  const selectedOnServer =
    selectionState.value !== undefined
      ? selectionState.value === null
        ? NULL_ID
        : selectionState.value
      : undefined;
  const hasPresets = presets && presets.length > 0;

  const handleChange = async (event) => {
    // We assume that the request will succeed so we eagerly select the new
    // value. If changing the RTK source fails, it will be changed back in the
    // response handler triggered by the effect that we set up below.
    setSelectedByUser(event.target.value);

    if (onSourceChanged) {
      onSourceChanged();
    }
  };

  // If we have the preset list, but we don't have the current selection yet,
  // load the current selection
  useEffect(() => {
    if (!loading && !hasError && hasPresets && selectedOnServer === undefined) {
      getSelectionFromServer();
    }
  });

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
            setSelectedByUser(undefined);
            getSelectionFromServer();
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
    getSelectionFromServer,
    selectedByUser,
    selectedOnServer,
    setSelectedByUser,
  ]);

  return (
    <FormGroup>
      <FormControl variant='filled' error={hasError && !loading}>
        <InputLabel htmlFor='rtk-corrections'>RTK corrections</InputLabel>
        <Select
          displayEmpty
          disabled={Boolean(hasError || loading || !hasPresets)}
          value={
            selectedByUser ||
            (hasSelectionFromServer ? selectedOnServer : NULL_ID)
          }
          inputProps={{ id: 'rtk-corrections' }}
          onChange={handleChange}
        >
          {presetsState.loading ? (
            <MenuItem disabled value={NULL_ID}>
              Please wait, loading RTK sources...
            </MenuItem>
          ) : hasError ? (
            <MenuItem disabled value={NULL_ID}>
              Error while loading RTK sources from server
            </MenuItem>
          ) : hasPresets ? (
            [nullPreset, ...presets].map((preset) => (
              <MenuItem key={preset.id} value={preset.id}>
                {preset.title}
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled value='__null__'>
              No RTK data sources on server
            </MenuItem>
          )}
        </Select>
      </FormControl>
    </FormGroup>
  );
};

RTKCorrectionSourceSelector.propTypes = {
  onSourceChanged: PropTypes.func,
};

export default connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  {
    onSourceChanged: resetRTKStatistics,
  }
)(RTKCorrectionSourceSelector);
