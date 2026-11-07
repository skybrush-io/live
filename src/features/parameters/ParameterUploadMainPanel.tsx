import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { type ChangeEvent } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import ParseableTextField, {
  type ParseableTextFieldChange,
} from '~/features/upload-support/setup-dialog/ParseableTextField';
import { useAppDispatch } from '~/store/hooks';
import { formatIdsAndTruncateTrailingItems } from '~/utils/formatting';

import { formatParameters, parseParameters } from './formatting';
import {
  getExplicitParameterUploadTargets,
  shouldRebootAfterParameterUpload,
} from './selectors';
import {
  clearParameterUploadTargets,
  setRebootAfterUpload,
  updateParametersInManifest,
} from './slice';
import type { ParameterData } from './types';

/**
 * Main panel of the parameter upload setup dialog: a shared `ParseableTextField`
 * fed by `parseParameters`/`formatParameters`, plus the feature-specific usage
 * hint and "reboot after upload" switch.
 */
const ParameterUploadMainPanel = () => {
  const shouldReboot = useSelector(shouldRebootAfterParameterUpload);
  const targets = useSelector(getExplicitParameterUploadTargets);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const handleManifestChange = (
    change: ParseableTextFieldChange<ParameterData>
  ) => {
    if (change.valid && change.commit && change.value.length > 0) {
      dispatch(updateParametersInManifest(change.value));
    }
  };

  const handleRebootStateChange = (event: ChangeEvent<HTMLInputElement>) => {
    dispatch(setRebootAfterUpload(event.target.checked));
  };

  const handleClearTargets = () => {
    dispatch(clearParameterUploadTargets());
  };

  return (
    <Box sx={{ pt: 1 }}>
      {targets && (
        <Alert
          severity='warning'
          variant='filled'
          sx={{ mb: 2 }}
          action={
            <Button color='inherit' size='small' onClick={handleClearTargets}>
              {t('general.action.clear')}
            </Button>
          }
        >
          {t('parameterUploadMainPanel.restrictedToUAVs', {
            uavIds: formatIdsAndTruncateTrailingItems(targets),
          })}
        </Alert>
      )}
      <ParseableTextField
        labelKey='parameterUploadMainPanel.parameterNamesValues'
        helperTextFallbackKey='parameterUploadMainPanel.specifyEntries'
        parse={parseParameters}
        format={formatParameters}
        onChange={handleManifestChange}
      />
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
