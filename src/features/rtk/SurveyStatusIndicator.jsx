import PropTypes from 'prop-types';
import React from 'react';

import Box from '@material-ui/core/Box';
import Fade from '@material-ui/core/Fade';

import LabeledStatusLight from '@skybrush/mui-components/lib/LabeledStatusLight';

function formatAccuracy(message, value) {
  if (typeof value !== 'number' || value <= 0) {
    return message;
  }

  return value > 10000
    ? message + ', accuracy > 100m'
    : message +
        ', accuracy: ' +
        (value >= 1 ? value.toFixed(2) + 'm' : (value * 100).toFixed(1) + 'cm');
}

const SurveyStatusIndicator = ({
  accuracy,
  active,
  supported,
  valid,
  ...rest
}) => (
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
          ? formatAccuracy('Survey successful', accuracy)
          : supported
          ? 'Survey not started yet'
          : 'No survey information'}
      </LabeledStatusLight>
    </Box>
  </Fade>
);

SurveyStatusIndicator.propTypes = {
  accuracy: PropTypes.number,
  active: PropTypes.bool,
  supported: PropTypes.bool,
  valid: PropTypes.bool,
};

export default SurveyStatusIndicator;
