import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { TextField } from 'mui-rff';
import PropTypes from 'prop-types';
import React from 'react';
import { Form } from 'react-final-form';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import FormSubmissionButtonRow from '~/components/forms/FormSubmissionButtonRow';
import { updateManualPreflightCheckItemsFromString } from '~/features/preflight/actions';
import { getFormattedHeadersAndItems } from '~/features/preflight/selectors';

const PreflightTabPresentation = ({ items, onSubmit, t }) => (
  <Form initialValues={{ items }} onSubmit={onSubmit}>
    {({ dirty, form, handleSubmit }) => (
      <Box>
        <Typography>{t('preflightTab.enterCheckItems')}</Typography>
        <Box py={1}>
          <TextField
            fullWidth
            multiline
            name='items'
            label={t('preflightTab.manualPreflightCheckItems')}
            minRows={10}
            variant='filled'
            helperText={t('preflightTab.headingsHint')}
          />
        </Box>
        <FormSubmissionButtonRow
          label={t('preflightTab.preflightCheckItems')}
          dirty={dirty}
          form={form}
          onSubmit={handleSubmit}
        />
      </Box>
    )}
  </Form>
);

PreflightTabPresentation.propTypes = {
  items: PropTypes.string,
  onSubmit: PropTypes.func,
  t: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    items: getFormattedHeadersAndItems(state),
  }),
  // mapDispatchToProps
  {
    onSubmit({ items }) {
      return updateManualPreflightCheckItemsFromString(items);
    },
  }
)(withTranslation()(PreflightTabPresentation));
