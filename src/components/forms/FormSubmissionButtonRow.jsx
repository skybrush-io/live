import PropTypes from 'prop-types';
import React from 'react';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';

import LabeledStatusLight from '@skybrush/mui-components/lib/LabeledStatusLight';

/**
 * Helper component that provides an indicator at the bottom of react-final-form
 * forms that informs the user whether the form contents should be saved, and
 * also provides Save and Reset buttons.
 */
const FormSubmissionButtonRow = ({ dirty, form, label, onSubmit }) => (
  <Box display='flex' flexDirection='row'>
    <LabeledStatusLight status={dirty ? 'warning' : 'success'}>
      {dirty
        ? `${label || 'Form'} changed; do not forget to save.`
        : `${label || 'Form'} saved.`}
    </LabeledStatusLight>
    {form && (
      <>
        <Button disabled={!dirty} onClick={() => form.reset()}>
          Reset
        </Button>
        <Button color='primary' disabled={!dirty} onClick={onSubmit}>
          Save
        </Button>
      </>
    )}
  </Box>
);

FormSubmissionButtonRow.propTypes = {
  dirty: PropTypes.bool.isRequired,
  form: PropTypes.shape({
    reset: PropTypes.func,
  }),
  label: PropTypes.string,
  onSubmit: PropTypes.func,
};

export default FormSubmissionButtonRow;
