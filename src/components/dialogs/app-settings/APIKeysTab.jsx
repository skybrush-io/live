import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import config from 'config';
import { TextField } from 'mui-rff';
import PropTypes from 'prop-types';
import React from 'react';
import { Form } from 'react-final-form';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import FormSubmissionButtonRow from '~/components/forms/FormSubmissionButtonRow';
import { updateAppSettings } from '~/features/settings/slice';

const enabledTileProviders = config?.map?.tileProviders ?? {};

const providers = [
  enabledTileProviders.bingMaps ? { label: 'Bing Maps', key: 'BING' } : false,
  enabledTileProviders.googleMaps
    ? { label: 'Google Maps', key: 'GOOGLE' }
    : false,
  { label: 'Mapbox', key: 'MAPBOX' },
  { label: 'Maptiler', key: 'MAPTILER' },
].filter(Boolean);

const APIKeysTabPresentation = ({ apiKeys, onSubmit, t }) => (
  <Form initialValues={apiKeys} onSubmit={onSubmit}>
    {({ dirty, form, handleSubmit }) => (
      <Box>
        {providers.map((provider) => (
          <Box key={provider.key} py={1}>
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
        <Box pb={2} />
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

APIKeysTabPresentation.propTypes = {
  apiKeys: PropTypes.object,
  onSubmit: PropTypes.func,
  t: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    apiKeys: state.settings.apiKeys,
  }),
  // mapDispatchToProps
  {
    onSubmit(apiKeys) {
      // It seems like apiKeys does not include empty text fields so we
      // explicitly add those
      const updates = {};
      for (const provider of providers) {
        updates[provider.key] = apiKeys[provider.key]
          ? String(apiKeys[provider.key])
          : '';
      }

      return updateAppSettings('apiKeys', updates);
    },
  }
)(withTranslation()(APIKeysTabPresentation));
