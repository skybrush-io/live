import Box, { type BoxProps } from '@mui/material/Box';
import Fade from '@mui/material/Fade';
import { useTranslation } from 'react-i18next';

import { LabeledStatusLight } from '@skybrush/mui-components';

import { Status } from '~/components/semantics';
import { formatSurveyAccuracy } from './utils';

function formatAccuracy(message: string, value: number | undefined) {
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

type Props = {
  accuracy?: number;
  active: boolean;
  supported: boolean;
  valid: boolean;
} & BoxProps;

const SurveyStatusIndicator = ({
  accuracy,
  active,
  supported,
  valid,
  ...rest
}: Props) => {
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
          status={valid ? Status.SUCCESS : active ? Status.NEXT : Status.OFF}
          color='textSecondary'
        >
          {active
            ? formatAccuracy('Surveying', accuracy)
            : valid
              ? formatAccuracy('', accuracy)
              : supported
                ? t('surveyStatusIndicator.notStartedYet')
                : t('surveyStatusIndicator.noSurveyInformation')}
        </LabeledStatusLight>
      </Box>
    </Fade>
  );
};

export default SurveyStatusIndicator;
