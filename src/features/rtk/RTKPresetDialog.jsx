/**
 * @file Dialog component for creating or editing RTK presets.
 */

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import PropTypes from 'prop-types';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Form } from 'react-final-form';
import { withTranslation } from 'react-i18next';
import { connect, useDispatch } from 'react-redux';
import { nanoid } from 'nanoid';

import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';

import {
  Select as FormSelect,
  TextField as FormTextField,
} from '~/components/forms';
import messageHub from '~/message-hub';
import { closeRTKPresetDialog, refreshRTKPresets } from './slice';
import { showConfirmationDialog } from '~/features/prompt/actions';
import { required } from '~/utils/validation';

/**
 * Source input field with add/remove buttons.
 */
const SourceInputField = ({
  value,
  onChange,
  onRemove,
  error,
  helperText,
  disabled,
}) => (
  <Box display='flex' alignItems='flex-start' mb={1} style={{ gap: 8 }}>
    <TextField
      fullWidth
      hiddenLabel
      size='small'
      variant='filled'
      value={value}
      error={Boolean(error)}
      helperText={helperText}
      placeholder='serial:/dev/ttyUSB0?baud=9600'
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    />
    <IconButton
      size='small'
      style={{ marginTop: 4 }}
      aria-label='Remove source'
      disabled={disabled}
      onClick={onRemove}
    >
      <DeleteIcon fontSize='small' />
    </IconButton>
  </Box>
);

SourceInputField.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  disabled: PropTypes.bool,
};

/**
 * Presentation component for the RTK preset dialog form.
 */
const RTKPresetDialogFormPresentation = ({
  initialValues,
  isEditMode,
  isReadOnly,
  mode,
  onRefreshPresets,
  onSubmit,
  onCancel,
  presetId,
  presetType,
  t,
}) => {
  // Capitalize first letter for display
  const displayType = presetType
    ? presetType.charAt(0).toUpperCase() + presetType.slice(1)
    : 'User';

  const dispatch = useDispatch();
  const [sources, setSources] = useState(
    initialValues?.sources && initialValues.sources.length > 0
      ? initialValues.sources.map((s) => ({ id: nanoid(), value: s }))
      : [{ id: nanoid(), value: '' }]
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const formRef = useRef(null);

  const isNew = mode === 'create';

  const handleAddSource = useCallback(() => {
    setSources([...sources, { id: nanoid(), value: '' }]);
  }, [sources]);

  const handleRemoveSource = useCallback(
    (index) => {
      const newSources = sources.filter((_, i) => i !== index);
      if (newSources.length === 0) {
        newSources.push({ id: nanoid(), value: '' });
      }

      setSources(newSources);
    },
    [sources]
  );

  const handleDelete = useCallback(async () => {
    if (
      !(await dispatch(
        showConfirmationDialog(
          t(
            'rtkPresetDialog.deleteConfirmation',
            'Are you sure you want to delete this preset?'
          ),
          {
            title: t('rtkPresetDialog.deletePreset', 'Delete Preset'),
            submitButtonLabel: t('general.action.delete', 'Delete'),
            cancelButtonLabel: t('general.action.cancel', 'Cancel'),
          }
        )
      ))
    ) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await messageHub.execute.deleteRTKPreset(presetId);

      // Persist changes to disk
      await messageHub.execute.saveRTKPresets();

      // The deleted preset was the active one, so switch to "RTK Disabled" (null)
      await messageHub.execute.setRTKCorrectionsSource(null);

      // Trigger refresh of preset list in selector
      if (onRefreshPresets) {
        onRefreshPresets();
      }

      onSubmit();
    } catch (error_) {
      const errorMessage =
        error_?.message || error_?.reason || 'Failed to delete preset';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }, [presetId, onSubmit, onRefreshPresets, t, dispatch]);

  const handleSourceChange = useCallback(
    (index, value) => {
      const newSources = [...sources];
      newSources[index] = { ...newSources[index], value };
      setSources(newSources);
    },
    [sources]
  );

  const handleSubmit = useCallback(
    async (values) => {
      setSubmitting(true);
      setError(null);

      try {
        // Filter out empty sources
        const filteredSources = sources
          .map((s) => s.value)
          .filter((s) => s && s.trim() !== '');

        const presetData = {
          title: values.title,
          ...(filteredSources.length > 0 && { sources: filteredSources }),
          ...(values.format && { format: values.format }),
        };

        if (isNew) {
          await messageHub.execute.createRTKPreset(presetData);
        } else {
          await messageHub.execute.updateRTKPreset(presetId, presetData);
        }

        // Persist changes to disk
        await messageHub.execute.saveRTKPresets();

        // Trigger refresh of preset list in selector
        if (onRefreshPresets) {
          onRefreshPresets();
        }

        onSubmit();
      } catch (error_) {
        const errorMessage =
          error_?.message ||
          error_?.reason ||
          (isNew ? 'Failed to create preset' : 'Failed to update preset');
        setError(errorMessage);
      } finally {
        setSubmitting(false);
      }
    },
    [sources, isNew, presetId, onSubmit, onRefreshPresets]
  );

  const formInitialValues = useMemo(
    () => ({
      title: initialValues?.title || '',
      format: initialValues?.format || 'auto',
    }),
    [initialValues]
  );

  // Update sources when initialValues change (for edit mode)
  useEffect(() => {
    if (initialValues?.sources && initialValues.sources.length > 0) {
      setSources(
        initialValues.sources.map((s) => ({ id: nanoid(), value: s }))
      );
    }
  }, [initialValues]);

  return (
    <Form
      initialValues={formInitialValues}
      render={({ handleSubmit: formHandleSubmit, form, values, errors }) => {
        formRef.current = form;

        return (
          <form onSubmit={formHandleSubmit}>
            <DialogContent>
              {error && (
                <Alert severity='error' style={{ marginBottom: 16 }}>
                  {error}
                </Alert>
              )}

              {/* Header info */}
              <Box
                mb={2}
                display='flex'
                flexDirection='column'
                style={{ gap: 8 }}
              >
                <Box display='flex' alignItems='center' style={{ gap: 8 }}>
                  <Typography variant='body2' color='textSecondary'>
                    {t('rtkPresetDialog.type', 'Type')}:
                  </Typography>
                  <Chip
                    label={displayType}
                    size='small'
                    color={
                      presetType === 'user' || presetType === 'User'
                        ? 'primary'
                        : 'default'
                    }
                  />
                  {isReadOnly && (
                    <Typography variant='caption' color='textSecondary'>
                      {t(
                        'rtkPresetDialog.readOnlyMessage',
                        'Built-in/Dynamic presets cannot be edited'
                      )}
                    </Typography>
                  )}
                </Box>
                {isEditMode && presetId && (
                  <Typography variant='body2' color='textSecondary'>
                    {t('rtkPresetDialog.id', 'ID')}: <code>{presetId}</code>
                  </Typography>
                )}
              </Box>

              {/* Basic Settings */}
              <Box display='flex' flexDirection='column' style={{ gap: 16 }}>
                <FormTextField
                  fullWidth
                  autoFocus
                  size='small'
                  name='title'
                  label={t('rtkPresetDialog.presetName', 'Preset Name')}
                  placeholder={t(
                    'rtkPresetDialog.presetNamePlaceholder',
                    'My RTK Base Station'
                  )}
                  fieldProps={{ validate: required }}
                  helperText={t(
                    'rtkPresetDialog.presetNameHelp',
                    'A descriptive name for this RTK preset'
                  )}
                  disabled={isReadOnly}
                />

                <Box>
                  <Typography variant='body2' style={{ marginBottom: 8 }}>
                    {t('rtkPresetDialog.dataSources', 'Data Sources')}
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
                          ? t(
                              'rtkPresetDialog.sourcesHelp',
                              'Connection URLs for RTK correction data. You can specify multiple sources.'
                            )
                          : undefined
                      }
                      disabled={isReadOnly}
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
                      {t('rtkPresetDialog.addSource', 'Add Source')}
                    </Button>
                  )}
                </Box>

                <FormSelect
                  fullWidth
                  size='small'
                  name='format'
                  label={t('rtkPresetDialog.messageFormat', 'Message Format')}
                  disabled={isReadOnly}
                  formControlProps={{
                    helperText: t(
                      'rtkPresetDialog.formatHelp',
                      'Format of the GPS messages arriving in this configuration (supported formats: "rtcm2", "rtcm3", "ubx", and "auto" for auto detection)'
                    ),
                  }}
                >
                  <MenuItem value='auto'>
                    {t('rtkPresetDialog.formatAuto', 'Detect automatically')}
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
                  onClick={handleDelete}
                >
                  {t('general.action.delete', 'Delete')}
                </Button>
              )}
              <Button disabled={submitting} onClick={onCancel}>
                {t('general.action.cancel', 'Cancel')}
              </Button>
              {!isReadOnly && (
                <Button
                  type='submit'
                  color='primary'
                  variant='contained'
                  disabled={
                    submitting ||
                    !values.title ||
                    !values.title.trim() ||
                    Object.keys(errors || {}).length > 0
                  }
                  onClick={formHandleSubmit}
                >
                  {submitting
                    ? t('general.action.saving', 'Saving...')
                    : t('general.action.save', 'Save')}
                </Button>
              )}
            </DialogActions>
          </form>
        );
      }}
      onSubmit={handleSubmit}
    />
  );
};

RTKPresetDialogFormPresentation.propTypes = {
  initialValues: PropTypes.object,
  isEditMode: PropTypes.bool,
  isReadOnly: PropTypes.bool,
  mode: PropTypes.oneOf(['create', 'edit']),
  onRefreshPresets: PropTypes.func,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  presetId: PropTypes.string,
  presetType: PropTypes.oneOf(['User', 'Built-in', 'Dynamic']),
  t: PropTypes.func,
};

/**
 * Presentation component for the RTK preset dialog.
 */
const RTKPresetDialogPresentation = ({
  initialPreset,
  mode,
  onClose,
  onRefreshPresets,
  open,
  presetId,
  presetType,
  t,
}) => {
  const isEditMode = mode === 'edit';
  // Only Built-in and Dynamic are read-only; everything else (including null/undefined) is editable
  const isReadOnly =
    presetType !== 'User' && presetType !== 'user' && isEditMode;

  const title =
    mode === 'create'
      ? t('rtkPresetDialog.createTitle', 'Create RTK Preset')
      : t('rtkPresetDialog.editTitle', 'Edit RTK Preset');

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
        t={t}
        onRefreshPresets={onRefreshPresets}
        onSubmit={onClose}
        onCancel={onClose}
      />
    </DraggableDialog>
  );
};

RTKPresetDialogPresentation.propTypes = {
  initialPreset: PropTypes.object,
  mode: PropTypes.oneOf(['create', 'edit']),
  onClose: PropTypes.func.isRequired,
  onRefreshPresets: PropTypes.func,
  open: PropTypes.bool.isRequired,
  presetId: PropTypes.string,
  presetType: PropTypes.oneOf(['User', 'Built-in', 'Dynamic']),
  t: PropTypes.func,
};

/**
 * Container component that fetches preset data when needed.
 */
const RTKPresetDialogContainer = ({
  mode,
  open,
  presetId,
  presetType,
  onClose,
  onRefreshPresets,
  ...rest
}) => {
  const [initialPreset, setInitialPreset] = useState(null);

  useEffect(() => {
    const fetchPresets = async () => {
      try {
        const presets = await messageHub.query.getRTKPresets();
        const preset = presets.find((p) => p.id === presetId);
        setInitialPreset(preset || null);
      } catch {
        setInitialPreset(null);
      }
    };

    if (open && mode === 'edit' && presetId) {
      fetchPresets();
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
      {...rest}
    />
  );
};

RTKPresetDialogContainer.propTypes = {
  mode: PropTypes.oneOf(['create', 'edit']),
  onClose: PropTypes.func.isRequired,
  onRefreshPresets: PropTypes.func,
  open: PropTypes.bool.isRequired,
  presetId: PropTypes.string,
  presetType: PropTypes.oneOf(['User', 'Built-in', 'Dynamic']),
};

/**
 * Container component for the RTK preset dialog.
 */
const RTKPresetDialog = connect(
  // mapStateToProps
  (state) => {
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
)(withTranslation()(RTKPresetDialogContainer));

export default RTKPresetDialog;
