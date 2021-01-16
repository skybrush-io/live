import { TextField } from 'mui-rff';
import PropTypes from 'prop-types';
import React from 'react';
import { Form } from 'react-final-form';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';

import LabeledStatusLight from '~/components/LabeledStatusLight';
import { updateManualPreflightCheckItemsFromString } from '~/features/preflight/actions';
import { getFormattedHeadersAndItems } from '~/features/preflight/selectors';
import { Typography } from '@material-ui/core';

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
            rows={10}
            variant='filled'
            helperText='Lines ending with a colon (:) become headings.'
          />
        </Box>
        <Box display='flex' flexDirection='row'>
          <LabeledStatusLight status={dirty ? 'warning' : 'success'}>
            {dirty
              ? 'Preflight check items changed; do not forget to save.'
              : 'Preflight check items saved.'}
          </LabeledStatusLight>
          <Button disabled={!dirty} onClick={() => form.reset()}>
            Reset
          </Button>
          <Button color='primary' disabled={!dirty} onClick={handleSubmit}>
            Save
          </Button>
        </Box>
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
