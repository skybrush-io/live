import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import config from 'config';
import { TextField } from 'mui-rff';
import { Form } from 'react-final-form';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import FormSubmissionButtonRow from '~/components/forms/FormSubmissionButtonRow';
import { updateAppSettings } from '~/features/settings/slice';
import type { RootState } from '~/store/reducers';

const enabledTileProviders = config.map.tileProviders;

type Provider = {
  label: string;
  key: string;
};

const providers: Provider[] = [
  enabledTileProviders.bingMaps ? { label: 'Bing Maps', key: 'BING' } : false,
  enabledTileProviders.googleMaps
    ? { label: 'Google Maps', key: 'GOOGLE' }
    : false,
  { label: 'Mapbox', key: 'MAPBOX' },
  { label: 'Maptiler', key: 'MAPTILER' },
].filter((value): value is Provider => Boolean(value));

type APIKeys = Record<string, string>;

type Props = {
  apiKeys?: APIKeys;
  onSubmit: (apiKeys: APIKeys) => void;
};

const APIKeysTabPresentation = ({ apiKeys, onSubmit }: Props) => {
  const { t } = useTranslation();

  return (
    <Form initialValues={apiKeys} onSubmit={onSubmit}>
      {({ dirty, form, handleSubmit }) => (
        <Box>
          {providers.map((provider) => (
            <Box key={provider.key} sx={{ py: 1 }}>
              <TextField
                fullWidth
                name={provider.key}
                label={`${provider.label} API key`}
                variant='filled'
              />
            </Box>
          ))}
          <Typography variant='body2' color='textSecondary'>
            {t('APIKeysTab.description')}
          </Typography>
          <Box sx={{ pb: 2 }} />
          <FormSubmissionButtonRow
            dirty={dirty}
            form={form}
            label='API keys'
            onSubmit={handleSubmit}
          />
        </Box>
      )}
    </Form>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    apiKeys: state.settings.apiKeys,
  }),
  // mapDispatchToProps
  {
    onSubmit(apiKeys: APIKeys) {
      // It seems like apiKeys does not include empty text fields so we
      // explicitly add those
      const updates: APIKeys = {};
      for (const provider of providers) {
        updates[provider.key] = apiKeys[provider.key]
          ? String(apiKeys[provider.key])
          : '';
      }

      return updateAppSettings('apiKeys', updates);
    },
  }
)(APIKeysTabPresentation);
