import Box, { type BoxProps } from '@mui/material/Box';
import Fade from '@mui/material/Fade';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';

import { LabeledStatusLight } from '@skybrush/mui-components';

import { Status } from '~/components/semantics';
import { formatSurveyAccuracy } from './utils';

function formatStatus(
  t: TFunction,
  surveying: boolean,
  value: number | undefined
): string {
  if (typeof value !== 'number' || value <= 0) {
    return surveying ? t('surveyStatusIndicator.surveying') : '';
  }

  const accuracy = formatSurveyAccuracy(value);
  const isUpperBound = accuracy.startsWith('>');
  // The result is rendered by React, so HTML escaping is not needed
  const options = { accuracy, interpolation: { escapeValue: false } };

  if (surveying) {
    return isUpperBound
      ? t('surveyStatusIndicator.surveyingWithAccuracyAbove', options)
      : t('surveyStatusIndicator.surveyingWithAccuracy', options);
  } else {
    return isUpperBound
      ? t('surveyStatusIndicator.accuracyAbove', options)
      : t('surveyStatusIndicator.accuracy', options);
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
  sx,
  ...rest
}: Props) => {
  const { t } = useTranslation();

  return (
    <Fade in={supported || true}>
      <Box
        {...rest}
        sx={{
          alignItems: 'center',
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          ...sx,
        }}
      >
        <LabeledStatusLight
          size='small'
          status={valid ? Status.SUCCESS : active ? Status.NEXT : Status.OFF}
          color='textSecondary'
        >
          {active
            ? formatStatus(t, true, accuracy)
            : valid
              ? formatStatus(t, false, accuracy)
              : supported
                ? t('surveyStatusIndicator.notStartedYet')
                : t('surveyStatusIndicator.noSurveyInformation')}
        </LabeledStatusLight>
      </Box>
    </Fade>
  );
};

export default SurveyStatusIndicator;
