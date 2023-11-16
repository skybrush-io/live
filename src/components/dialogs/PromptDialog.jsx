/**
 * @file Generic input dialog to request data from the user based on a schema.
 */

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';

import Form from '@rjsf/material-ui';
import validator from '@rjsf/validator-ajv8';

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import {
  cancelPromptDialog,
  submitPromptDialog,
} from '~/features/prompt/actions';

const PromptDialogPresentation = ({
  initialValues,
  onCancel,
  onSubmit,
  open,
  schema,
}) => {
  return (
    <Dialog open={open} onClose={onCancel}>
      <Box px={2} py={1}>
        <Form
          // TODO: Somehow make `fields.SchemaField` use `DialogContent`.
          formData={initialValues}
          schema={schema}
          validator={validator}
          onSubmit={onSubmit}
        >
          <DialogActions style={{ padding: 0 }}>
            <Button color='primary' type='submit'>
              Submit
            </Button>
            <Button onClick={onCancel}>Cancel</Button>
          </DialogActions>
        </Form>
      </Box>
    </Dialog>
  );
};

PromptDialogPresentation.propTypes = {
  initialValues: PropTypes.object,
  onCancel: PropTypes.func,
  onSubmit: PropTypes.func,
  open: PropTypes.bool,
  schema: PropTypes.object,
};

const PromptDialog = connect(
  // mapStateToProps
  (state) => state.dialogs.prompt,
  // mapDispatchToProps
  (dispatch) => ({
    onCancel() {
      dispatch(cancelPromptDialog());
    },

    onSubmit({ formData }) {
      dispatch(submitPromptDialog(formData));
    },
  })
)(PromptDialogPresentation);

export default PromptDialog;
