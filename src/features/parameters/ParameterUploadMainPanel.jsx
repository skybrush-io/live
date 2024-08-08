import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { connect, useDispatch, useSelector } from 'react-redux';

import Box from '@material-ui/core/Box';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';

import { shouldOptimizeUIForTouch } from '~/features/settings/selectors';

import { formatParameters, parseParameters } from './formatting';
import { shouldRebootAfterParameterUpload } from './selectors';
import { setRebootAfterUpload, updateParametersInManifest } from './slice';

const ParametersTextFieldPresentation = ({ onChange, optimizeUIForTouch }) => {
  const [parameterString, setParameterString] = useState('');
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  const handleChange = (event) => {
    setParameterString(event.target.value);
  };

  const validate = (event) => {
    validateValue(event.target.value);
  };

  const validateValue = (value, commit = false) => {
    let parsedParameters;

    try {
      parsedParameters = parseParameters(value);
    } catch (error) {
      setError(error.message || String(error));
      if (onChange) {
        onChange({ valid: false });
      }

      return false;
    }

    setError('');
    if (onChange) {
      onChange({ value: parsedParameters, valid: true, commit });
      setParameterString(formatParameters(parsedParameters));
    }

    return true;
  };

  const handleKeyPress = (event) => {
    if (event.shiftKey && event.key === 'Enter') {
      if (validateValue(event.target.value, true)) {
        setParameterString('');
      }

      event.preventDefault();
    }
  };

  return (
    <TextField
      fullWidth
      multiline
      autoFocus={!optimizeUIForTouch}
      error={Boolean(error)}
      label={t('parameterUploadMainPanel.parameterNamesValues')}
      variant='filled'
      minRows={7}
      helperText={error || t('parameterUploadMainPanel.specifyEntries')}
      value={parameterString}
      onBlur={validate}
      onChange={handleChange}
      onKeyPress={handleKeyPress}
    />
  );
};

ParametersTextFieldPresentation.propTypes = {
  onChange: PropTypes.func,
  optimizeUIForTouch: PropTypes.bool,
};

const ParametersTextField = connect(
  // mapStateToProps
  (state) => ({
    optimizeUIForTouch: shouldOptimizeUIForTouch(state),
  })
)(ParametersTextFieldPresentation);

const ParameterUploadMainPanel = () => {
  const shouldReboot = useSelector(shouldRebootAfterParameterUpload);
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const handleManifestChange = ({ value, valid, commit }) => {
    if (valid && commit && value.length > 0) {
      dispatch(updateParametersInManifest(value));
    }
  };

  const handleRebootStateChange = (value, checked) => {
    dispatch(setRebootAfterUpload(checked));
  };

  return (
    <Box pt={1}>
      <ParametersTextField onChange={handleManifestChange} />
      <Box pt={1}>
        <Typography variant='body1'>
          <Trans
            i18nKey='parameterUploadMainPanel.parameterUploadHint'
            components={{ kbd: <kbd /> }}
          />
        </Typography>
      </Box>
      <Box pt={1}>
        <FormControlLabel
          style={{ margin: '0' }}
          control={
            <Switch
              checked={shouldReboot}
              color='primary'
              onChange={handleRebootStateChange}
            />
          }
          label={t('parameterUploadMainPanel.rebootAfterUpload')}
        />
      </Box>
    </Box>
  );
};

export default ParameterUploadMainPanel;
