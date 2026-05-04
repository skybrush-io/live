import FormControl from '@mui/material/FormControl';
import FormGroup from '@mui/material/FormGroup';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import type { RTKPresetID } from '@skybrush/flockwave-spec';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { useAsync, useAsyncFn } from 'react-use';

import handleError from '~/error-handling';
import { setCurrentRTKPresetId } from '~/features/rtk/actions';
import { resetRTKStatistics } from '~/features/rtk/slice';
import messageHub from '~/message-hub';

const NULL_ID: RTKPresetID = '__null__';

type RTKPresetSource = {
  id: RTKPresetID;
  title: string;
};

const nullPreset: RTKPresetSource = {
  id: NULL_ID,
  title: 'RTK disabled',
};

type Props = {
  onSourceChanged?: () => void;
  setCurrentRTKPresetId: (presetId?: RTKPresetID) => void;
};

const RTKCorrectionSourceSelector = ({
  onSourceChanged,
  setCurrentRTKPresetId,
}: Props) => {
  const { t } = useTranslation();
  const [selectedByUser, setSelectedByUser] = useState<string>();
  const [selectionState, getSelectionFromServer] = useAsyncFn(
    async (): Promise<RTKPresetID | null> => {
      const presetId: RTKPresetID | null =
        await messageHub.query.getSelectedRTKPresetId();
      return presetId;
    }
  );

  const presetsState = useAsync(async () => {
    const presets: RTKPresetSource[] = await messageHub.query.getRTKPresets();
    return presets;
  }, []);

  const loading = presetsState.loading || selectionState.loading;
  const hasError = presetsState.error;

  if (selectionState.error) {
    console.warn('Failed to load RTK selection state:', selectionState.error);
  }

  const presets = presetsState.value ?? [];
  const hasSelectionFromServer = selectionState.value !== undefined;
  const selectedOnServer =
    selectionState.value !== undefined
      ? selectionState.value === null
        ? NULL_ID
        : selectionState.value
      : undefined;
  const hasPresets = presets && presets.length > 0;

  const handleChange = (event: SelectChangeEvent<string>) => {
    const newPresetId = event.target.value;

    // We assume that the request will succeed so we eagerly select the new
    // value. If changing the RTK source fails, it will be changed back in the
    // response handler triggered by the effect that we set up below.
    setSelectedByUser(newPresetId);

    if (onSourceChanged) {
      onSourceChanged();
    }
  };

  // Update current preset ID in Redux
  useEffect(() => {
    const currentId = selectedByUser ?? selectedOnServer;
    // Convert NULL_ID to undefined or keep as is? The selector uses 'undefined' for no selection usually.
    // But presets have IDs.
    const effectiveId = currentId === NULL_ID ? undefined : currentId;
    setCurrentRTKPresetId(effectiveId);
  }, [selectedByUser, selectedOnServer, setCurrentRTKPresetId]);

  // If we have the preset list, but we don't have the current selection yet,
  // load the current selection
  useEffect(() => {
    if (!loading && !hasError && hasPresets && selectedOnServer === undefined) {
      void getSelectionFromServer();
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
            void getSelectionFromServer();
          }
        } catch (error) {
          console.warn(error);
          throw error;
        }
      };

      commitNewSelection().catch(handleError);
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
        <InputLabel htmlFor='rtk-corrections'>
          {t('RTKCorrectionSourceSelector.RTKCorrections')}
        </InputLabel>
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
    </FormGroup>
  );
};

export default connect(
  null,
  // mapDispatchToProps
  {
    onSourceChanged: resetRTKStatistics,
    setCurrentRTKPresetId,
  }
)(RTKCorrectionSourceSelector);
