/**
 * @file Dialog component for creating or editing RTK presets.
 */

import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Chip from '@material-ui/core/Chip';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import IconButton from '@material-ui/core/IconButton';
import MenuItem from '@material-ui/core/MenuItem';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Alert from '@material-ui/lab/Alert';
import PropTypes from 'prop-types';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Field, Form } from 'react-final-form';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { nanoid } from 'nanoid';

import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';

import {
  Select as FormSelect,
  Switch as FormSwitch,
  TextField as FormTextField,
} from '~/components/forms';
import messageHub from '~/message-hub';
import { closeRTKPresetDialog, refreshRTKPresets } from './slice';
import { required } from '~/utils/validation';

/**
 * Validates a filter message ID format (rtcm2/X or rtcm3/X).
 */
const validateFilterMessage = (value) => {
  if (!value || value.trim() === '') {
    return undefined;
  }

  const pattern = /^(rtcm2|rtcm3)\/\d+$/;
  if (!pattern.test(value.trim())) {
    return 'Format must be rtcm2/X or rtcm3/X where X is the packet ID';
  }

  return undefined;
};

/**
 * Validates an array of filter messages (comma-separated string).
 */
const validateFilterMessages = (value) => {
  if (!value || value.trim() === '') {
    return undefined;
  }

  const messages = value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s !== '');
  for (const msg of messages) {
    const error = validateFilterMessage(msg);
    if (error) {
      return error;
    }
  }

  return undefined;
};

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
 * Filter message input field (comma-separated list).
 */
const FilterMessagesField = ({
  label,
  name,
  placeholder,
  helperText,
  validate,
  disabled,
}) => (
  <FormTextField
    fullWidth
    size='small'
    name={name}
    label={label}
    placeholder={placeholder}
    helperText={helperText}
    fieldProps={{ validate }}
    disabled={disabled}
  />
);

FilterMessagesField.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  helperText: PropTypes.string,
  validate: PropTypes.func,
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

  const [sources, setSources] = useState(
    initialValues?.sources && initialValues.sources.length > 0
      ? initialValues.sources.map((s) => ({ id: nanoid(), value: s }))
      : [{ id: nanoid(), value: '' }]
  );
  const [tabValue, setTabValue] = useState(0);
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
          ...(values.format &&
            values.format !== 'auto' && { format: values.format }),
          ...(values.autoSurvey !== undefined && {
            auto_survey: values.autoSurvey,
          }),
          ...(values.autoSelect !== undefined && {
            auto_select: values.autoSelect,
          }),
          ...(values.initData &&
            values.initData.trim() !== '' && {
              init_data: values.initData,
            }),
          ...(values.acceptMessages || values.rejectMessages
            ? {
                filter: {
                  ...(values.acceptMessages &&
                    values.acceptMessages.trim() !== '' && {
                      accept: values.acceptMessages
                        .split(',')
                        .map((s) => s.trim())
                        .filter((s) => s !== ''),
                    }),
                  ...(values.rejectMessages &&
                    values.rejectMessages.trim() !== '' && {
                      reject: values.rejectMessages
                        .split(',')
                        .map((s) => s.trim())
                        .filter((s) => s !== ''),
                    }),
                },
              }
            : {}),
        };

        if (isNew) {
          await messageHub.execute.createRTKPreset(presetData);
        } else {
          await messageHub.execute.updateRTKPreset(presetId, presetData);
        }

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

  // Parse filter messages from initial values
  const initialFilterAccept = useMemo(() => {
    if (initialValues?.filter?.accept) {
      return initialValues.filter.accept.join(', ');
    }

    return '';
  }, [initialValues]);

  const initialFilterReject = useMemo(() => {
    if (initialValues?.filter?.reject) {
      return initialValues.filter.reject.join(', ');
    }

    return '';
  }, [initialValues]);

  const formInitialValues = useMemo(
    () => ({
      title: initialValues?.title || '',
      format: initialValues?.format || 'auto',
      autoSurvey: initialValues?.auto_survey || false,
      autoSelect: initialValues?.auto_select || false,
      initData: initialValues?.init_data || '',
      acceptMessages: initialFilterAccept,
      rejectMessages: initialFilterReject,
    }),
    [initialValues, initialFilterAccept, initialFilterReject]
  );

  // Update sources when initialValues change (for edit mode)
  useEffect(() => {
    if (initialValues?.sources && initialValues.sources.length > 0) {
      setSources(initialValues.sources.map((s) => ({ id: nanoid(), value: s })));
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

              {/* Tabs */}
              <Tabs
                value={tabValue}
                style={{
                  marginBottom: 16,
                  borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                }}
                onChange={(_, newValue) => setTabValue(newValue)}
              >
                <Tab
                  label={t('rtkPresetDialog.basicSettings', 'Basic Settings')}
                />
                <Tab
                  label={t(
                    'rtkPresetDialog.advancedSettings',
                    'Advanced Settings'
                  )}
                />
              </Tabs>

              {/* Basic Settings Tab */}
              {tabValue === 0 && (
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
                          index === 0 && sources.length === 1 && !source.value.trim()
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
                    <Button
                      size='small'
                      startIcon={<AddIcon />}
                      disabled={isReadOnly}
                      style={{ marginTop: 8 }}
                      onClick={handleAddSource}
                    >
                      {t('rtkPresetDialog.addSource', 'Add Source')}
                    </Button>
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
              )}

              {/* Advanced Settings Tab */}
              {tabValue === 1 && (
                <Box display='flex' flexDirection='column' style={{ gap: 16 }}>
                  <Box>
                    <FormControlLabel
                      control={
                        <Field
                          name='autoSurvey'
                          component={FormSwitch}
                          type='checkbox'
                          disabled={isReadOnly}
                        />
                      }
                      label={t(
                        'rtkPresetDialog.autoSurvey',
                        'Start survey automatically when selected'
                      )}
                    />
                    <FormHelperText style={{ marginLeft: 36, marginTop: -12 }}>
                      {t(
                        'rtkPresetDialog.autoSurveyHelp',
                        'Automatically start a survey attempt when this preset is activated'
                      )}
                    </FormHelperText>
                  </Box>

                  <Box>
                    <FormControlLabel
                      control={
                        <Field
                          name='autoSelect'
                          component={FormSwitch}
                          type='checkbox'
                          disabled={isReadOnly}
                        />
                      }
                      label={t(
                        'rtkPresetDialog.autoSelect',
                        'Select automatically at startup'
                      )}
                    />
                    <FormHelperText style={{ marginLeft: 36, marginTop: -12 }}>
                      {t(
                        'rtkPresetDialog.autoSelectHelp',
                        'Automatically select this preset when the server starts'
                      )}
                    </FormHelperText>
                  </Box>

                  <FormTextField
                    fullWidth
                    multiline
                    size='small'
                    name='initData'
                    label={t('rtkPresetDialog.initData', 'Initialization Data')}
                    placeholder={t(
                      'rtkPresetDialog.initDataPlaceholder',
                      'Optional data to send before reading RTCM messages'
                    )}
                    minRows={2}
                    maxRows={4}
                    helperText={t(
                      'rtkPresetDialog.initDataHelp',
                      'Raw bytes or text to send on connection before starting to read RTK messages'
                    )}
                    disabled={isReadOnly}
                  />

                  <Box>
                    <Typography variant='subtitle2' style={{ marginBottom: 8 }}>
                      {t('rtkPresetDialog.packetFilter', 'Packet Filter')}
                    </Typography>
                    <FilterMessagesField
                      label={t(
                        'rtkPresetDialog.acceptMessages',
                        'Accept only these message types'
                      )}
                      name='acceptMessages'
                      placeholder='rtcm3/1020, rtcm3/1077'
                      helperText={t(
                        'rtkPresetDialog.acceptMessagesHelp',
                        'If specified, only these RTCM packet types will be accepted'
                      )}
                      validate={validateFilterMessages}
                      disabled={isReadOnly}
                    />
                    <FilterMessagesField
                      label={t(
                        'rtkPresetDialog.rejectMessages',
                        'Reject these message types'
                      )}
                      name='rejectMessages'
                      placeholder='rtcm3/1001'
                      helperText={t(
                        'rtkPresetDialog.rejectMessagesHelp',
                        'These RTCM packet types will be rejected (processed before accept list)'
                      )}
                      validate={validateFilterMessages}
                      disabled={isReadOnly}
                    />
                  </Box>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && mode === 'edit' && presetId) {
      setLoading(true);
      messageHub.query
        .getRTKPresets()
        .then((presets) => {
          const preset = presets.find((p) => p.id === presetId);
          setInitialPreset(preset || null);
        })
        .catch(() => {
          setInitialPreset(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setInitialPreset(null);
    }
  }, [open, mode, presetId]);

  if (loading) {
    return (
      <DraggableDialog
        fullWidth
        maxWidth='sm'
        open={open}
        title='Loading...'
        onClose={onClose}
      >
        <DialogContent>
          <Typography>Loading preset data...</Typography>
        </DialogContent>
      </DraggableDialog>
    );
  }

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
