import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Stack, { type StackProps } from '@mui/material/Stack';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import {
  type CollectiveRTHPlanSummary,
  selectCollectiveRTHPlanSummary,
} from '~/features/show/selectors';
import type { RootState } from '~/store/reducers';
import { formatDuration } from '~/utils/formatting';

type Props = {
  summary: CollectiveRTHPlanSummary;
} & StackProps;

const RTHPlanSummary = ({ summary, ...rest }: Props) => {
  const { t } = useTranslation();
  return (
    <Stack gap={1} {...rest}>
      {summary.isValid ? (
        <>
          <Alert severity='success' variant='filled'>
            {t('collectiveRTHDialog.existingValidRTHPlan', {
              numPlans: Object.keys(summary.plans).length,
            })}
          </Alert>
          <Stack direction='row' gap={1} sx={{ alignItems: 'center' }}>
            {t('collectiveRTHDialog.summary.firstTime.message', {
              firstTime: formatDuration(summary.firstTime),
            })}
            <Divider sx={{ flex: 1 }} />
            {t('collectiveRTHDialog.summary.lastTime.message', {
              lastTime: formatDuration(summary.lastTime),
            })}
          </Stack>
        </>
      ) : (
        <Alert severity='warning' variant='filled'>
          {t('collectiveRTHDialog.existingInvalidRTHPlan')}
        </Alert>
      )}
    </Stack>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    summary: selectCollectiveRTHPlanSummary(state),
  })
)(RTHPlanSummary);
