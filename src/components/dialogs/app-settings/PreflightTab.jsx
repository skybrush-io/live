import { TextField } from 'mui-rff';
import PropTypes from 'prop-types';
import React from 'react';
import { Form } from 'react-final-form';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

import FormSubmissionButtonRow from '~/components/forms/FormSubmissionButtonRow';
import { updateManualPreflightCheckItemsFromString } from '~/features/preflight/actions';
import { getFormattedHeadersAndItems } from '~/features/preflight/selectors';

const PreflightTabPresentation = ({ items, onSubmit }) => (
  <Form initialValues={{ items }} onSubmit={onSubmit}>
    {({ dirty, form, handleSubmit }) => (
      <Box pt={1} pb={2}>
        <Typography>
          Enter your preferred manual preflight check items, one per line.
        </Typography>
        <Box py={1}>
          <TextField
            fullWidth
            multiline
            name='items'
            label='Manual preflight check items'
            minRows={10}
            variant='filled'
            helperText='Lines ending with a colon (:) become headings.'
          />
        </Box>
        <FormSubmissionButtonRow
          label='Preflight check items'
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
)(PreflightTabPresentation);
