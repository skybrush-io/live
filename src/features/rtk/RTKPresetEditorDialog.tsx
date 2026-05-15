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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Form, type FormRenderProps } from 'react-final-form';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { DraggableDialog, FormHeader } from '@skybrush/mui-components';

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
  closeRTKPresetEditorDialog,
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
  user: 'rtkPresetEditor.presetTypeUser',
  builtin: 'rtkPresetEditor.presetTypeBuiltin',
  dynamic: 'rtkPresetEditor.presetTypeDynamic',
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
      variant='filled'
      value={value}
      error={Boolean(error)}
      helperText={helperText}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    />
    <IconButton
      style={{ marginTop: 4 }}
      aria-label={removeAriaLabel}
      disabled={disabled}
      onClick={onRemove}
    >
      <DeleteIcon />
    </IconButton>
  </Box>
);

type RTKPresetEditorFormProps = {
  initialValues?: RTKPresetData | null;
  isReadOnly: boolean;
  mode: DialogMode | undefined;
  onCancel: () => void;
  onRefreshPresets?: () => void;
  onSubmit: () => void;
  presetId?: string;
  presetType?: RTKPresetType;
};

const RTKPresetEditorFormPresentation = ({
  initialValues,
  isReadOnly,
  mode,
  onCancel,
  onRefreshPresets,
  onSubmit,
  presetId,
  presetType,
}: RTKPresetEditorFormProps) => {
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
  const createdPresetIdRef = useRef<string | undefined>(undefined);

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
        showConfirmationDialog(t('rtkPresetEditor.deleteConfirmation'), {
          title: t('rtkPresetEditor.deletePreset'),
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
      setError(getErrorMessage(error_, t('rtkPresetEditor.deleteFailed')));
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
          if (createdPresetIdRef.current) {
            await messageHub.execute.updateRTKPreset(
              createdPresetIdRef.current,
              presetData
            );
          } else {
            const createdPresetId =
              await messageHub.execute.createRTKPreset(presetData);
            createdPresetIdRef.current = createdPresetId;
          }
        } else if (presetId) {
          await messageHub.execute.updateRTKPreset(presetId, presetData);
        }

        await messageHub.execute.saveRTKPresets();
        createdPresetIdRef.current = undefined;

        if (onRefreshPresets) {
          onRefreshPresets();
        }

        onSubmit();
      } catch (error_) {
        setError(
          getErrorMessage(
            error_,
            isNew
              ? t('rtkPresetEditor.createFailed')
              : t('rtkPresetEditor.updateFailed')
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

  useEffect(() => {
    if (!isNew) {
      createdPresetIdRef.current = undefined;
    }
  }, [isNew]);

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
              display='flex'
              flexDirection='row'
              alignItems='center'
              sx={{ gap: 1, mb: 1 }}
            >
              <Typography variant='body2' color='textSecondary'>
                {t('rtkPresetEditor.type')}:
              </Typography>
              <Chip
                label={displayType}
                color={presetType === 'user' ? 'primary' : 'default'}
              />
              {isReadOnly && (
                <Typography variant='caption' color='textSecondary'>
                  {t('rtkPresetEditor.readOnlyMessage')}
                </Typography>
              )}
            </Box>

            <FormTextField
              fullWidth
              autoFocus
              name='title'
              label={t('rtkPresetEditor.presetName')}
              placeholder={t('rtkPresetEditor.presetNamePlaceholder')}
              fieldProps={{ validate: required }}
              disabled={isReadOnly}
            />

            <FormHeader>{t('rtkPresetEditor.dataSources')}</FormHeader>
            {sources.map((source, index) => (
              <SourceInputField
                key={source.id}
                value={source.value}
                error={false}
                helperText={
                  index === 0 && sources.length === 1 && !source.value.trim()
                    ? t('rtkPresetEditor.sourcesHelp')
                    : undefined
                }
                disabled={isReadOnly}
                placeholder={t('rtkPresetEditor.sourcePlaceholder')}
                removeAriaLabel={t('rtkPresetEditor.removeSource')}
                onChange={(value) => handleSourceChange(index, value)}
                onRemove={() => handleRemoveSource(index)}
              />
            ))}
            {!isReadOnly && (
              <Button
                startIcon={<AddIcon />}
                disabled={isReadOnly}
                onClick={handleAddSource}
              >
                {t('rtkPresetEditor.addSource')}
              </Button>
            )}

            <FormSelect
              fullWidth
              margin='dense'
              name='format'
              label={t('rtkPresetEditor.messageFormat')}
              disabled={isReadOnly}
            >
              <MenuItem value='auto'>
                {t('rtkPresetEditor.formatAuto')}
              </MenuItem>
              <MenuItem value='rtcm2'>RTCM2</MenuItem>
              <MenuItem value='rtcm3'>RTCM3</MenuItem>
              <MenuItem value='ubx'>UBX</MenuItem>
            </FormSelect>
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

type RTKPresetEditorDialogPresentationProps = {
  initialPreset: RTKPresetData | null;
  mode: DialogMode | undefined;
  onClose: () => void;
  onRefreshPresets?: () => void;
  open: boolean;
  presetId?: string;
  presetType?: RTKPresetType;
};

const RTKPresetEditorDialogPresentation = ({
  initialPreset,
  mode,
  onClose,
  onRefreshPresets,
  open,
  presetId,
  presetType,
}: RTKPresetEditorDialogPresentationProps) => {
  const { t } = useTranslation();
  const isEditMode = mode === 'edit';
  // Only builtin and dynamic presets are read-only
  const isReadOnly = presetType !== 'user' && isEditMode;

  const title =
    mode === 'create'
      ? t('rtkPresetEditor.createTitle')
      : t('rtkPresetEditor.editTitle');

  return (
    <DraggableDialog
      fullWidth
      maxWidth='sm'
      open={open}
      title={title}
      onClose={onClose}
    >
      <RTKPresetEditorFormPresentation
        initialValues={initialPreset}
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

type RTKPresetEditorDialogContainerProps = {
  mode: DialogMode | undefined;
  onClose: () => void;
  onRefreshPresets?: () => void;
  open: boolean;
  presetId?: string;
  presetType?: RTKPresetType;
};

const RTKPresetEditorDialogContainer = ({
  mode,
  onClose,
  onRefreshPresets,
  open,
  presetId,
  presetType,
}: RTKPresetEditorDialogContainerProps) => {
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
    <RTKPresetEditorDialogPresentation
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

const RTKPresetEditorDialog = connect(
  // mapStateToProps
  (state: RootState) => state.rtk.presetEditorDialog,
  // mapDispatchToProps
  {
    onClose: closeRTKPresetEditorDialog,
    onRefreshPresets: refreshRTKPresets,
  }
)(RTKPresetEditorDialogContainer);

export default RTKPresetEditorDialog;
