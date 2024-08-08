import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';

import Box from '@material-ui/core/Box';
import Fade from '@material-ui/core/Fade';

import LabeledStatusLight from '@skybrush/mui-components/lib/LabeledStatusLight';

import { formatSurveyAccuracy } from './utils';

function formatAccuracy(message, value) {
  if (typeof value !== 'number' || value <= 0) {
    return message;
  }

  const formattedValue = formatSurveyAccuracy(value);
  if (!message || message.length === 0) {
    if (formattedValue && formattedValue.charAt(0) === '>') {
      return `Accuracy ${formattedValue}`;
    } else {
      return `Accuracy: ${formattedValue}`;
    }
  } else {
    if (formattedValue && formattedValue.charAt(0) === '>') {
      return `${message}, accuracy ${formattedValue}`;
    } else {
      return `${message}, accuracy: ${formattedValue}`;
    }
  }
}

const SurveyStatusIndicator = withTranslation()(
  ({ accuracy, active, supported, valid, t, ...rest }) => (
    <Fade in={supported || true}>
      <Box
        alignItems='center'
        flex={1}
        display='flex'
        flexDirection='row'
        {...rest}
      >
        <LabeledStatusLight
          size='small'
          status={
            valid ? 'success' : active ? 'next' : supported ? 'error' : 'off'
          }
          color='textSecondary'
        >
          {active
            ? formatAccuracy('Surveying', accuracy)
            : valid
              ? formatAccuracy('', accuracy)
              : supported
                ? 'Survey not started yet'
                : t('surveyStatusIndicator.noSurveyInformation')}
        </LabeledStatusLight>
      </Box>
    </Fade>
  )
);

SurveyStatusIndicator.propTypes = {
  accuracy: PropTypes.number,
  active: PropTypes.bool,
  supported: PropTypes.bool,
  t: PropTypes.func,
  valid: PropTypes.bool,
};

export default SurveyStatusIndicator;
