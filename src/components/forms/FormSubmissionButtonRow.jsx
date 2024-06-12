import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';

import LabeledStatusLight from '@skybrush/mui-components/lib/LabeledStatusLight';

/**
 * Helper component that provides an indicator at the bottom of react-final-form
 * forms that informs the user whether the form contents should be saved, and
 * also provides Save and Reset buttons.
 */
const FormSubmissionButtonRow = withTranslation()(
  ({ dirty, form, label, onSubmit, t }) => (
    <Box display='flex' flexDirection='row'>
      <LabeledStatusLight status={dirty ? 'warning' : 'success'}>
        {dirty
          ? `${label || 'Form'} changed; do not forget to save.`
          : `${label || 'Form'} saved.`}
      </LabeledStatusLight>
      {form && (
        <>
          <Button disabled={!dirty} onClick={() => form.reset()}>
            {t('general.action.reset')}
          </Button>
          <Button color='primary' disabled={!dirty} onClick={onSubmit}>
            {t('general.action.save')}
          </Button>
        </>
      )}
    </Box>
  )
);

FormSubmissionButtonRow.propTypes = {
  dirty: PropTypes.bool.isRequired,
  form: PropTypes.shape({
    reset: PropTypes.func,
  }),
  label: PropTypes.string,
  onSubmit: PropTypes.func,
  t: PropTypes.func,
};

export default FormSubmissionButtonRow;
