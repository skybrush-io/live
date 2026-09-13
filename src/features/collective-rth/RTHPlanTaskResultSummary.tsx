import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import Stack from '@mui/material/Stack';
import { Status } from '@skybrush/app-theme-mui';
import { StatusLight, TransparentList } from '@skybrush/mui-components';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import ListItemTextWithProgress from '~/components/progress/ListItemTextWithProgress';
import {
  type CollectiveRTHPlanSummary,
  selectCollectiveRTHPlanSummary,
} from '~/features/show/selectors';
import type { RTHPlanTaskResult } from '~/features/tasks';
import type { RootState } from '~/store/reducers';
import { formatDuration } from '~/utils/formatting';

import {
  RTHPlanTaskPhase,
  selectRTHPlanTaskPhase,
  selectRTHPlanTaskResult,
} from './selectors';

type TimeIntervalDisplayProps = {
  firstTime?: number;
  lastTime?: number;
};

const TimeIntervalDisplay = ({
  firstTime,
  lastTime,
}: TimeIntervalDisplayProps) => {
  const { t } = useTranslation();

  return (
    <Stack direction='row' gap={1} sx={{ alignItems: 'center' }}>
      {t('collectiveRTHDialog.summary.firstTime.message', {
        firstTime: formatDuration(firstTime),
      })}
      <Divider sx={{ flex: 1 }} />
      {t('collectiveRTHDialog.summary.lastTime.message', {
        lastTime: formatDuration(lastTime),
      })}
    </Stack>
  );
};

type Props = {
  phase: RTHPlanTaskPhase;
  existingPlan?: CollectiveRTHPlanSummary;
  pendingPlan?: RTHPlanTaskResult;
};

const deriveStatus = (
  phase: RTHPlanTaskPhase,
  existingPlan?: CollectiveRTHPlanSummary
): Status => {
  if (phase === 'running') {
    // Calculation is currently running
    return Status.NEXT;
  }

  if (phase === 'error') {
    // Error during previous run; user needs to acknowledge by rejecting.
    return Status.ERROR;
  }

  if (phase === 'success') {
    // Previous run completed successfully, but user has not yet acknowledged by
    // accepting or rejecting.
    return Status.WAITING;
  }

  if (existingPlan?.isValid) {
    // There is an existing valid plan, no pending plan and no error. This is fine.
    return Status.SUCCESS;
  }

  // No existing plan, no pending plan. This is a warning; the user should create an
  // RTH plan if possible.
  return Status.WARNING;
};

const RTHPlanTaskResultSummary = ({
  phase,
  existingPlan,
  pendingPlan,
}: Props) => {
  const { t } = useTranslation();

  // TODO(ntamas): handle error state!

  const status = deriveStatus(phase, existingPlan);

  return (
    <TransparentList dense sx={{ px: 1, py: 0 }}>
      <ListItem>
        <StatusLight status={status} />
        <ListItemTextWithProgress
          primary={
            pendingPlan
              ? t('collectiveRTHDialog.summary.numPlans.message', {
                  numPlans: pendingPlan.stats.length,
                })
              : existingPlan?.isValid
                ? t('collectiveRTHDialog.existingValidRTHPlan', {
                    numPlans: Object.keys(existingPlan.plans).length,
                  })
                : t('collectiveRTHDialog.existingInvalidRTHPlan')
          }
          secondary={
            pendingPlan ? (
              <TimeIntervalDisplay {...pendingPlan} />
            ) : existingPlan?.isValid ? (
              <TimeIntervalDisplay {...existingPlan} />
            ) : (
              t('collectiveRTHDialog.action.addCollectiveRTH')
            )
          }
        />
      </ListItem>
    </TransparentList>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    phase: selectRTHPlanTaskPhase(state),
    existingPlan: selectCollectiveRTHPlanSummary(state),
    pendingPlan: selectRTHPlanTaskResult(state),
  })
)(RTHPlanTaskResultSummary);
