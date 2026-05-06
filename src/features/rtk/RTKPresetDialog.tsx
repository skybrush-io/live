/**
 * @file Dialog component for creating or editing RTK presets.
 */

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { nanoid } from 'nanoid';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Form, type FormRenderProps } from 'react-final-form';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { DraggableDialog } from '@skybrush/mui-components';

import {
  Select as FormSelect,
  TextField as FormTextField,
} from '~/components/forms';
import { showConfirmationDialog } from '~/features/prompt/actions';
import messageHub from '~/message-hub';
import { useAppDispatch } from '~/store/hooks';
import type { RootState } from '~/store/reducers';
import { required } from '~/utils/validation';

import {
  closeRTKPresetDialog,
  refreshRTKPresets,
  type RTKPresetType,
} from './slice';

type DialogMode = 'create' | 'edit';

type SourceRow = {
  id: string;
  value: string;
};

type RTKPresetData = {
  id: string;
  title: string;
  sources?: string[];
  format?: string;
  type?: RTKPresetType;
};

type FormValues = {
  title: string;
  format: string;
};

const PRESET_TYPE_I18N_KEYS: Record<RTKPresetType, string> = {
  user: 'rtkPresetDialog.presetTypeUser',
  builtin: 'rtkPresetDialog.presetTypeBuiltin',
  dynamic: 'rtkPresetDialog.presetTypeDynamic',
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (isRecord(error)) {
    if (typeof error.message === 'string' && error.message.length > 0) {
      return error.message;
    }

    if (typeof error.reason === 'string' && error.reason.length > 0) {
      return error.reason;
    }
  }

  return fallback;
};

const parsePreset = (value: unknown): RTKPresetData | null => {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.title !== 'string'
  ) {
    return null;
  }

  const sources = Array.isArray(value.sources)
    ? value.sources.filter((s): s is string => typeof s === 'string')
    : undefined;

  const format = typeof value.format === 'string' ? value.format : undefined;

  const presetType =
    value.type === 'user' ||
    value.type === 'builtin' ||
    value.type === 'dynamic'
      ? value.type
      : undefined;

  return {
    id: value.id,
    title: value.title,
    sources,
    format,
    type: presetType,
  };
};

type SourceInputFieldProps = {
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  placeholder?: string;
  removeAriaLabel?: string;
  value?: string;
};

const SourceInputField = ({
  disabled,
  error,
  helperText,
  onChange,
  onRemove,
  placeholder,
  removeAriaLabel,
  value,
}: SourceInputFieldProps) => (
  <Box display='flex' alignItems='flex-start' mb={1} style={{ gap: 8 }}>
    <TextField
      fullWidth
      hiddenLabel
      size='small'
      variant='filled'
      value={value}
      error={Boolean(error)}
      helperText={helperText}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    />
    <IconButton
      size='small'
      style={{ marginTop: 4 }}
      aria-label={removeAriaLabel}
      disabled={disabled}
      onClick={onRemove}
    >
      <DeleteIcon fontSize='small' />
    </IconButton>
  </Box>
);

type RTKPresetDialogFormProps = {
  initialValues?: RTKPresetData | null;
  isEditMode: boolean;
  isReadOnly: boolean;
  mode: DialogMode | undefined;
  onCancel: () => void;
  onRefreshPresets?: () => void;
  onSubmit: () => void;
  presetId?: string;
  presetType?: RTKPresetType;
};

const RTKPresetDialogFormPresentation = ({
  initialValues,
  isEditMode,
  isReadOnly,
  mode,
  onCancel,
  onRefreshPresets,
  onSubmit,
  presetId,
  presetType,
}: RTKPresetDialogFormProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const displayType = t(PRESET_TYPE_I18N_KEYS[presetType ?? 'user']);
  const [sources, setSources] = useState<SourceRow[]>(() =>
    initialValues?.sources && initialValues.sources.length > 0
      ? initialValues.sources.map((value) => ({ id: nanoid(), value }))
      : [{ id: nanoid(), value: '' }]
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNew = mode === 'create';

  const handleAddSource = useCallback(() => {
    setSources((prev) => [...prev, { id: nanoid(), value: '' }]);
  }, []);

  const handleRemoveSource = useCallback((index: number) => {
    setSources((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) {
        next.push({ id: nanoid(), value: '' });
      }

      return next;
    });
  }, []);

  const handleSourceChange = useCallback((index: number, value: string) => {
    setSources((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], value };
      return next;
    });
  }, []);

  const handleDelete = useCallback(async () => {
    if (!presetId) {
      return;
    }

    if (
      !(await dispatch(
        showConfirmationDialog(t('rtkPresetDialog.deleteConfirmation'), {
          title: t('rtkPresetDialog.deletePreset'),
          submitButtonLabel: t('general.action.delete'),
          cancelButtonLabel: t('general.action.cancel'),
        })
      ))
    ) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const selectedPresetId = await messageHub.query.getSelectedRTKPresetId();
      // Disable RTK if the deleted preset was the active one.
      if (selectedPresetId == presetId) {
        await messageHub.execute.setRTKCorrectionsSource(null);
      }

      await messageHub.execute.deleteRTKPreset(presetId);
      await messageHub.execute.saveRTKPresets();

      if (onRefreshPresets) {
        onRefreshPresets();
      }

      onSubmit();
    } catch (error_) {
      setError(getErrorMessage(error_, t('rtkPresetDialog.deleteFailed')));
    } finally {
      setSubmitting(false);
    }
  }, [presetId, onSubmit, onRefreshPresets, t, dispatch]);

  const handleFormSubmit = useCallback(
    async (values: FormValues) => {
      setSubmitting(true);
      setError(null);

      try {
        const filteredSources = sources
          .map((s) => s.value)
          .filter((s) => s && s.trim() !== '');

        const presetData: Record<string, unknown> = {
          title: values.title,
          ...(filteredSources.length > 0 && { sources: filteredSources }),
          ...(values.format && { format: values.format }),
        };

        if (isNew) {
          await messageHub.execute.createRTKPreset(presetData);
        } else if (presetId) {
          await messageHub.execute.updateRTKPreset(presetId, presetData);
        }

        await messageHub.execute.saveRTKPresets();

        if (onRefreshPresets) {
          onRefreshPresets();
        }

        onSubmit();
      } catch (error_) {
        setError(
          getErrorMessage(
            error_,
            isNew
              ? t('rtkPresetDialog.createFailed')
              : t('rtkPresetDialog.updateFailed')
          )
        );
      } finally {
        setSubmitting(false);
      }
    },
    [sources, isNew, presetId, onSubmit, onRefreshPresets, t]
  );

  const formInitialValues = useMemo<FormValues>(
    () => ({
      title: initialValues?.title ?? '',
      format: initialValues?.format ?? 'auto',
    }),
    [initialValues]
  );

  useEffect(() => {
    if (initialValues?.sources && initialValues.sources.length > 0) {
      setSources(
        initialValues.sources.map((value) => ({ id: nanoid(), value }))
      );
    }
  }, [initialValues]);

  return (
    <Form<FormValues>
      initialValues={formInitialValues}
      onSubmit={handleFormSubmit}
      render={({
        handleSubmit,
        values,
        errors,
      }: FormRenderProps<FormValues>) => (
        <form
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
        >
          <DialogContent>
            {error && (
              <Alert severity='error' style={{ marginBottom: 16 }}>
                {error}
              </Alert>
            )}

            <Box
              mb={2}
              display='flex'
              flexDirection='column'
              style={{ gap: 8 }}
            >
              <Box display='flex' alignItems='center' style={{ gap: 8 }}>
                <Typography variant='body2' color='textSecondary'>
                  {t('rtkPresetDialog.type')}:
                </Typography>
                <Chip
                  label={displayType}
                  size='small'
                  color={presetType === 'user' ? 'primary' : 'default'}
                />
                {isReadOnly && (
                  <Typography variant='caption' color='textSecondary'>
                    {t('rtkPresetDialog.readOnlyMessage')}
                  </Typography>
                )}
              </Box>
              {isEditMode && presetId && (
                <Typography variant='body2' color='textSecondary'>
                  {t('rtkPresetDialog.id')}: <code>{presetId}</code>
                </Typography>
              )}
            </Box>

            <Box display='flex' flexDirection='column' style={{ gap: 16 }}>
              <FormTextField
                fullWidth
                autoFocus
                size='small'
                name='title'
                label={t('rtkPresetDialog.presetName')}
                placeholder={t('rtkPresetDialog.presetNamePlaceholder')}
                fieldProps={{ validate: required }}
                helperText={t('rtkPresetDialog.presetNameHelp')}
                disabled={isReadOnly}
              />

              <Box>
                <Typography variant='body2' style={{ marginBottom: 8 }}>
                  {t('rtkPresetDialog.dataSources')}
                </Typography>
                {sources.map((source, index) => (
                  <SourceInputField
                    key={source.id}
                    value={source.value}
                    error={false}
                    helperText={
                      index === 0 &&
                      sources.length === 1 &&
                      !source.value.trim()
                        ? t('rtkPresetDialog.sourcesHelp')
                        : undefined
                    }
                    disabled={isReadOnly}
                    placeholder={t('rtkPresetDialog.sourcePlaceholder')}
                    removeAriaLabel={t('rtkPresetDialog.removeSource')}
                    onChange={(value) => handleSourceChange(index, value)}
                    onRemove={() => handleRemoveSource(index)}
                  />
                ))}
                {!isReadOnly && (
                  <Button
                    size='small'
                    startIcon={<AddIcon />}
                    disabled={isReadOnly}
                    style={{ marginTop: 8 }}
                    onClick={handleAddSource}
                  >
                    {t('rtkPresetDialog.addSource')}
                  </Button>
                )}
              </Box>

              <FormSelect
                fullWidth
                size='small'
                margin='dense'
                name='format'
                label={t('rtkPresetDialog.messageFormat')}
                helperText={t('rtkPresetDialog.formatHelp')}
                disabled={isReadOnly}
              >
                <MenuItem value='auto'>
                  {t('rtkPresetDialog.formatAuto')}
                </MenuItem>
                <MenuItem value='rtcm2'>RTCM2</MenuItem>
                <MenuItem value='rtcm3'>RTCM3</MenuItem>
                <MenuItem value='ubx'>UBX</MenuItem>
              </FormSelect>
            </Box>
          </DialogContent>
          <DialogActions>
            {!isNew && !isReadOnly && (
              <Button
                color='secondary'
                disabled={submitting}
                style={{ marginRight: 'auto' }}
                onClick={() => {
                  void handleDelete();
                }}
              >
                {t('general.action.delete')}
              </Button>
            )}
            <Button disabled={submitting} onClick={onCancel}>
              {t('general.action.cancel')}
            </Button>
            {!isReadOnly && (
              <Button
                type='submit'
                color='primary'
                variant='contained'
                disabled={
                  submitting ||
                  !values?.title ||
                  !values.title.trim() ||
                  Object.keys(errors ?? {}).length > 0
                }
              >
                {submitting
                  ? t('general.action.saving')
                  : t('general.action.save')}
              </Button>
            )}
          </DialogActions>
        </form>
      )}
    />
  );
};

type RTKPresetDialogPresentationProps = {
  initialPreset: RTKPresetData | null;
  mode: DialogMode | undefined;
  onClose: () => void;
  onRefreshPresets?: () => void;
  open: boolean;
  presetId?: string;
  presetType?: RTKPresetType;
};

const RTKPresetDialogPresentation = ({
  initialPreset,
  mode,
  onClose,
  onRefreshPresets,
  open,
  presetId,
  presetType,
}: RTKPresetDialogPresentationProps) => {
  const { t } = useTranslation();
  const isEditMode = mode === 'edit';
  // Only builtin and dynamic presets are read-only
  const isReadOnly = presetType !== 'user' && isEditMode;

  const title =
    mode === 'create'
      ? t('rtkPresetDialog.createTitle')
      : t('rtkPresetDialog.editTitle');

  return (
    <DraggableDialog
      fullWidth
      maxWidth='sm'
      open={open}
      title={title}
      onClose={onClose}
    >
      <RTKPresetDialogFormPresentation
        initialValues={initialPreset}
        isEditMode={isEditMode}
        isReadOnly={isReadOnly}
        mode={mode}
        presetId={presetId}
        presetType={presetType}
        onRefreshPresets={onRefreshPresets}
        onSubmit={onClose}
        onCancel={onClose}
      />
    </DraggableDialog>
  );
};

type RTKPresetDialogContainerProps = {
  mode: DialogMode | undefined;
  onClose: () => void;
  onRefreshPresets?: () => void;
  open: boolean;
  presetId?: string;
  presetType?: RTKPresetType;
};

const RTKPresetDialogContainer = ({
  mode,
  onClose,
  onRefreshPresets,
  open,
  presetId,
  presetType,
}: RTKPresetDialogContainerProps) => {
  const [initialPreset, setInitialPreset] = useState<RTKPresetData | null>(
    null
  );

  useEffect(() => {
    const fetchPresets = async () => {
      try {
        const presets = (await messageHub.query.getRTKPresets()) as unknown;
        const list: RTKPresetData[] = Array.isArray(presets)
          ? presets
              .map((preset) => parsePreset(preset))
              .filter((preset): preset is RTKPresetData => preset !== null)
          : [];
        const preset = list.find((p) => p.id === presetId);
        setInitialPreset(preset ?? null);
      } catch {
        setInitialPreset(null);
      }
    };

    if (open && mode === 'edit' && presetId) {
      void fetchPresets();
    } else {
      setInitialPreset(null);
    }
  }, [open, mode, presetId]);

  return (
    <RTKPresetDialogPresentation
      initialPreset={initialPreset}
      mode={mode}
      open={open}
      presetId={presetId}
      presetType={presetType}
      onClose={onClose}
      onRefreshPresets={onRefreshPresets}
    />
  );
};

const RTKPresetDialog = connect(
  // mapStateToProps
  (state: RootState) => {
    const { mode, open, presetId, presetType } = state.rtk.presetDialog;

    return {
      mode,
      open,
      presetId,
      presetType,
    };
  },
  // mapDispatchToProps
  {
    onClose: closeRTKPresetDialog,
    onRefreshPresets: refreshRTKPresets,
  }
)(RTKPresetDialogContainer);

export default RTKPresetDialog;
