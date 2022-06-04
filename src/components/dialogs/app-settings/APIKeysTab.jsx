import { TextField } from 'mui-rff';
import PropTypes from 'prop-types';
import React from 'react';
import { Form } from 'react-final-form';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

import FormSubmissionButtonRow from '~/components/forms/FormSubmissionButtonRow';
import { updateAppSettings } from '~/features/settings/slice';

const providers = [
  { label: 'Mapbox', key: 'MAPBOX' },
  { label: 'Maptiler', key: 'MAPTILER' },
];

const APIKeysTabPresentation = ({ apiKeys, onSubmit }) => (
  <Form initialValues={apiKeys} onSubmit={onSubmit}>
    {({ dirty, form, handleSubmit }) => (
      <Box pt={1} pb={2}>
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
          {`Some map tile providers work without an API key; in this case, a 
          default API key is used. This API key is shared between all 
          users. We make no guarantees about the availability of map tiles if
          you use the default shared API key.`}
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
)(APIKeysTabPresentation);
