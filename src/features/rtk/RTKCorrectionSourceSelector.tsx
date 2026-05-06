import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormGroup from '@mui/material/FormGroup';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import type { RTKPresetID } from '@skybrush/flockwave-spec';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { useAsyncRetry } from 'react-use';

import handleError from '~/error-handling';
import { setCurrentRTKPresetId } from '~/features/rtk/actions';
import { openRTKPresetDialog, resetRTKStatistics } from '~/features/rtk/slice';
import messageHub from '~/message-hub';
import { useAppDispatch } from '~/store/hooks';
import type { RootState } from '~/store/reducers';

const NULL_ID: RTKPresetID = '__null__';

type RTKPresetSource = {
  id: RTKPresetID;
  title: string;
  type?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isRTKPresetSource = (value: unknown): value is RTKPresetSource =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.title === 'string' &&
  (value.type === undefined || typeof value.type === 'string');

const nullPreset: RTKPresetSource = {
  id: NULL_ID,
  title: 'RTK disabled',
};

type Props = {
  onCreatePreset: () => void;
  onEditPreset: (presetId: RTKPresetID, presetType: RTKPresetType) => void;
  onSourceChanged?: () => void;
  presetsRefreshTrigger: number;
};
type RTKPresetType = 'user' | 'builtin' | 'dynamic';

const RTKCorrectionSourceSelector = ({
  onCreatePreset,
  onEditPreset,
  onSourceChanged,
  presetsRefreshTrigger,
}: Props) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [selectedByUser, setSelectedByUser] = useState<RTKPresetID>();
  const presetsState = useAsyncRetry(async (): Promise<RTKPresetSource[]> => {
    const result = await messageHub.query.getRTKPresets();
    return Array.isArray(result) ? result.filter(isRTKPresetSource) : [];
  }, [presetsRefreshTrigger]);
  const selectionState = useAsyncRetry(async (): Promise<
    RTKPresetID | null | undefined
  > => {
    const result = await messageHub.query.getSelectedRTKPresetId();
    if (typeof result === 'string') {
      return result;
    }

    if (result === null) {
      return null;
    }

    return undefined;
  }, [presetsRefreshTrigger]);

  const loading = presetsState.loading || selectionState.loading;
  const hasError = presetsState.error;

  if (selectionState.error) {
    console.warn('Failed to load RTK selection state:', selectionState.error);
  }

  const presets: RTKPresetSource[] = presetsState.value ?? [];
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

  const selectionRetry = selectionState.retry;

  // Update current preset ID in Redux
  useEffect(() => {
    const currentId = selectedByUser ?? selectedOnServer;
    const effectiveId = currentId === NULL_ID ? undefined : currentId;
    dispatch(setCurrentRTKPresetId(effectiveId));
  }, [dispatch, selectedByUser, selectedOnServer]);

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

      commitNewSelection().catch(handleError);
    }

    return () => {
      isMounted = false;
    };
  }, [selectedByUser, selectedOnServer, selectionRetry]);

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

  const normalizePresetType = (type: unknown): RTKPresetType => {
    const presetType = typeof type === 'string' ? type.toLowerCase() : '';
    if (
      presetType === 'user' ||
      presetType === 'builtin' ||
      presetType === 'dynamic'
    ) {
      return presetType;
    }
    return 'user';
  };

  const handleEditPreset = (presetId: RTKPresetID, preset: RTKPresetSource) => {
    if (onEditPreset) {
      const presetType = normalizePresetType(preset?.type);
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
          error={Boolean(hasError) && !loading}
          style={{ flex: 1 }}
        >
          <InputLabel htmlFor='rtk-corrections'>
            {t('RTKCorrectionSourceSelector.RTKCorrections')}
          </InputLabel>
          <Select
            displayEmpty
            disabled={loading}
            value={hasError ? NULL_ID : (currentValue ?? NULL_ID)}
            inputProps={{ id: 'rtk-corrections' }}
            onChange={handleChange}
          >
            {presetsState.loading ? (
              <MenuItem disabled value={NULL_ID}>
                {t('RTKCorrectionSourceSelector.pleaseWait')}
              </MenuItem>
            ) : hasError ? (
              <MenuItem disabled value={NULL_ID}>
                <Typography color='error'>
                  {hasError.message || t('RTKCorrectionSourceSelector.error')}
                </Typography>
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
        <Tooltip title={t('RTKCorrectionSourceSelector.editPreset')}>
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
        <Tooltip title={t('RTKCorrectionSourceSelector.createPreset')}>
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

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    presetsRefreshTrigger: state.rtk.presetsRefreshTrigger,
  }),
  // mapDispatchToProps
  (dispatch) => ({
    onCreatePreset() {
      dispatch(openRTKPresetDialog({ mode: 'create' }));
    },
    onEditPreset(presetId: RTKPresetID, presetType: RTKPresetType) {
      dispatch(openRTKPresetDialog({ mode: 'edit', presetId, presetType }));
    },
    onSourceChanged: () => dispatch(resetRTKStatistics()),
  })
)(RTKCorrectionSourceSelector);
