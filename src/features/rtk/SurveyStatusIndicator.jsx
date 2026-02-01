import Box from '@mui/material/Box';
import Fade from '@mui/material/Fade';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { LabeledStatusLight } from '@skybrush/mui-components';

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

const SurveyStatusIndicator = ({
  accuracy,
  active,
  supported,
  valid,
  ...rest
}) => {
  const { t } = useTranslation();

  return (
    <Fade in={supported || true}>
      <Box
        {...rest}
        sx={[
          {
            alignItems: 'center',
            flex: 1,
            display: 'flex',
            flexDirection: 'row',
          },
          ...(Array.isArray(rest.sx) ? rest.sx : [rest.sx]),
        ]}
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
  );
};

SurveyStatusIndicator.propTypes = {
  accuracy: PropTypes.number,
  active: PropTypes.bool,
  supported: PropTypes.bool,
  valid: PropTypes.bool,
};

export default SurveyStatusIndicator;
