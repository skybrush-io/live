import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { type ChangeEvent, type KeyboardEvent, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { shouldOptimizeUIForTouch } from '~/features/settings/selectors';
import { useAppDispatch } from '~/store/hooks';
import type { RootState } from '~/store/reducers';

import { parseParameterNames } from './formatting';
import { setConsistencyCheckParameterNames } from './slice';

type NamesTextFieldChange =
  | { valid: false }
  | { commit: boolean; valid: true; value: string[] };

type ParameterNamesTextFieldProps = {
  onChange?: (change: NamesTextFieldChange) => void;
  optimizeUIForTouch: boolean;
};

const formatNames = (names: string[]): string =>
  names.length > 0 ? names.join('\n') + '\n' : '';

const ParameterNamesTextField = ({
  onChange,
  optimizeUIForTouch,
}: ParameterNamesTextFieldProps) => {
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
    let parsedNames: string[];

    try {
      parsedNames = parseParameterNames(value);
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      onChange?.({ valid: false });
      return false;
    }

    setError('');
    onChange?.({ value: parsedNames, valid: true, commit });
    setParameterString(formatNames(parsedNames));

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
      label={t('consistencyCheckMainPanel.parameterNames')}
      variant='filled'
      minRows={7}
      helperText={error || t('consistencyCheckMainPanel.specifyEntries')}
      value={parameterString}
      onBlur={validate}
      onChange={handleChange}
      onKeyPress={handleKeyPress}
    />
  );
};

const ConnectedParameterNamesTextField = connect(
  // mapStateToProps
  (state: RootState) => ({
    optimizeUIForTouch: shouldOptimizeUIForTouch(state),
  })
)(ParameterNamesTextField);

const ConsistencyCheckMainPanel = () => {
  const dispatch = useAppDispatch();

  const handleNamesChange = (change: NamesTextFieldChange) => {
    if (change.valid && change.commit && change.value.length > 0) {
      dispatch(setConsistencyCheckParameterNames(change.value));
    }
  };

  return (
    <Box sx={{ pt: 1 }}>
      <ConnectedParameterNamesTextField onChange={handleNamesChange} />
      <Box sx={{ pt: 1 }}>
        <Typography variant='body1'>
          <Trans
            i18nKey='consistencyCheckMainPanel.parameterCheckHint'
            components={{ kbd: <kbd /> }}
          />
        </Typography>
      </Box>
    </Box>
  );
};

export default ConsistencyCheckMainPanel;
