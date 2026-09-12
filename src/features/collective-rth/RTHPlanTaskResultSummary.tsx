import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import {
  type CollectiveRTHPlanSummary,
  selectCollectiveRTHPlanSummary,
} from '~/features/show/selectors';
import type { RTHPlanTaskResult } from '~/features/tasks';
import type { RootState } from '~/store/reducers';
import { formatDuration } from '~/utils/formatting';

import { selectRTHPlanTaskResult } from './selectors';

type Props = {
  result?: RTHPlanTaskResult['result'];
  existingRTHPlanSummary: CollectiveRTHPlanSummary;
};

const RTHPlanTaskResultSummary = ({
  existingRTHPlanSummary,
  result,
}: Props) => {
  const { t } = useTranslation();

  return (
    <>
      <Typography variant='subtitle2' color='textSecondary'>
        Current show
      </Typography>
      {existingRTHPlanSummary.isValid ? (
        <Alert severity='success' variant='filled'>
          {t('collectiveRTHDialog.existingValidRTHPlan', {
            numPlans: Object.keys(existingRTHPlanSummary.plans).length,
          })}
        </Alert>
      ) : (
        <Alert severity='warning' variant='filled'>
          {t('collectiveRTHDialog.existingInvalidRTHPlan')}
        </Alert>
      )}
      {result ? (
        <>
          <Divider />
          <Typography variant='subtitle2' color='textSecondary'>
            Pending changes requiring approval
          </Typography>
          <Alert severity='success' variant='filled'>
            {t('collectiveRTHDialog.summary.numPlans.message', {
              numPlans: result.stats.length,
            })}
          </Alert>
          <Stack direction='row' gap={1} sx={{ alignItems: 'center' }}>
            {t('collectiveRTHDialog.summary.firstTime.message', {
              firstTime: formatDuration(result.firstTime),
            })}
            <Divider sx={{ flex: 1 }} />
            {t('collectiveRTHDialog.summary.lastTime.message', {
              lastTime: formatDuration(result.lastTime),
            })}
          </Stack>
        </>
      ) : null}
    </>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    result: selectRTHPlanTaskResult(state),
    existingRTHPlanSummary: selectCollectiveRTHPlanSummary(state),
  })
)(RTHPlanTaskResultSummary);
