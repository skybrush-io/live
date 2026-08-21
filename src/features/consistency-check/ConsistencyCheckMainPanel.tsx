import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Trans } from 'react-i18next';

import ParseableTextField, {
  type ParseableTextFieldChange,
} from '~/features/upload-setup-dialog/ParseableTextField';
import { useAppDispatch } from '~/store/hooks';

import { parseParameterNames } from './formatting';
import { addConsistencyCheckParameterNames } from './slice';

const formatNames = (names: string[]): string =>
  names.length > 0 ? names.join('\n') + '\n' : '';

/**
 * Main panel of the parameter consistency-check setup dialog: a shared
 * `ParseableTextField` fed by `parseParameterNames`/`formatNames`, plus the
 * feature-specific usage hint.
 */
const ConsistencyCheckMainPanel = () => {
  const dispatch = useAppDispatch();

  const handleNamesChange = (change: ParseableTextFieldChange<string>) => {
    if (change.valid && change.commit && change.value.length > 0) {
      dispatch(addConsistencyCheckParameterNames(change.value));
    }
  };

  return (
    <Box sx={{ pt: 1 }}>
      <ParseableTextField
        labelKey='consistencyCheck.mainPanel.parameterNames'
        helperTextFallbackKey='consistencyCheck.mainPanel.specifyEntries'
        parse={parseParameterNames}
        format={formatNames}
        onChange={handleNamesChange}
      />
      <Box sx={{ pt: 1 }}>
        <Typography variant='body1'>
          <Trans
            i18nKey='consistencyCheck.mainPanel.parameterCheckHint'
            components={{ kbd: <kbd /> }}
          />
        </Typography>
      </Box>
    </Box>
  );
};

export default ConsistencyCheckMainPanel;
