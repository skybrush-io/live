import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { type ChangeEvent, type KeyboardEvent, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { connect, useSelector } from 'react-redux';

import { shouldOptimizeUIForTouch } from '~/features/settings/selectors';
import { useAppDispatch } from '~/store/hooks';
import type { RootState } from '~/store/reducers';

import { formatParameters, parseParameters } from './formatting';
import { shouldRebootAfterParameterUpload } from './selectors';
import { setRebootAfterUpload, updateParametersInManifest } from './slice';
import type { ParameterData } from './types';

type ParametersTextFieldChange =
  | { valid: false }
  | { commit: boolean; valid: true; value: ParameterData[] };

type ParametersTextFieldPresentationProps = {
  onChange?: (change: ParametersTextFieldChange) => void;
  optimizeUIForTouch: boolean;
};

const ParametersTextFieldPresentation = ({
  onChange,
  optimizeUIForTouch,
}: ParametersTextFieldPresentationProps) => {
  const [parameterString, setParameterString] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setParameterString(event.target.value);
  };

  const validate = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    validateValue(event.target.value);
  };

  const validateValue = (value: string, commit = false) => {
    let parsedParameters: ParameterData[];

    try {
      parsedParameters = parseParameters(value);
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      onChange?.({ valid: false });
      return false;
    }

    setError('');
    onChange?.({ value: parsedParameters, valid: true, commit });
    setParameterString(formatParameters(parsedParameters));

    return true;
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target;
    if (
      event.shiftKey &&
      event.key === 'Enter' &&
      (target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement)
    ) {
      if (validateValue(target.value, true)) {
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

const ParametersTextField = connect(
  // mapStateToProps
  (state: RootState) => ({
    optimizeUIForTouch: shouldOptimizeUIForTouch(state),
  })
)(ParametersTextFieldPresentation);

const ParameterUploadMainPanel = () => {
  const shouldReboot = useSelector(shouldRebootAfterParameterUpload);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const handleManifestChange = (change: ParametersTextFieldChange) => {
    if (change.valid && change.commit && change.value.length > 0) {
      dispatch(updateParametersInManifest(change.value));
    }
  };

  const handleRebootStateChange = (event: ChangeEvent<HTMLInputElement>) => {
    dispatch(setRebootAfterUpload(event.target.checked));
  };

  return (
    <Box sx={{ pt: 1 }}>
      <ParametersTextField onChange={handleManifestChange} />
      <Box sx={{ pt: 1 }}>
        <Typography variant='body1'>
          <Trans
            i18nKey='parameterUploadMainPanel.parameterUploadHint'
            components={{ kbd: <kbd /> }}
          />
        </Typography>
      </Box>
      <Box sx={{ pt: 1 }}>
        <FormControlLabel
          style={{ margin: '0' }}
          control={
            <Switch checked={shouldReboot} onChange={handleRebootStateChange} />
          }
          label={t('parameterUploadMainPanel.rebootAfterUpload')}
        />
      </Box>
    </Box>
  );
};

export default ParameterUploadMainPanel;
