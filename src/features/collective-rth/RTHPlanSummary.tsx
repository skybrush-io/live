import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
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
import type { ProgressInfo } from '~/flockwave/messages';
import type { RootState } from '~/store/reducers';
import { formatAltitude, formatDuration } from '~/utils/formatting';

import {
  type CollectiveRTHPlanningPhase,
  selectCollectiveRTHPlanningPhase,
  selectRTHPlanTaskProgress,
  selectRTHPlanTaskResult,
} from './selectors';

type RTHStatsProps = {
  firstTime?: number;
  lastTime?: number;
  minRTHAltitude?: number;
};

const RTHStats = ({ firstTime, lastTime, minRTHAltitude }: RTHStatsProps) => {
  const { t } = useTranslation();

  return (
    <Stack>
      <Stack direction='row' sx={{ alignItems: 'center', gap: 1 }}>
        {t('collectiveRTHDialog.summary.firstTime.message', {
          firstTime: formatDuration(firstTime),
        })}
        <Divider sx={{ flex: 1 }} />
        {t('collectiveRTHDialog.summary.lastTime.message', {
          lastTime: formatDuration(lastTime),
        })}
      </Stack>
      {minRTHAltitude !== undefined &&
        t('collectiveRTHDialog.summary.minRTHAltitude.message', {
          minRTHAltitude: formatAltitude(minRTHAltitude),
        })}
    </Stack>
  );
};

type Props = {
  phase: CollectiveRTHPlanningPhase;
  existingPlan?: CollectiveRTHPlanSummary;
  pendingPlan?: RTHPlanTaskResult;
  progress?: ProgressInfo;
};

const deriveStatus = (
  phase: CollectiveRTHPlanningPhase,
  existingPlan?: CollectiveRTHPlanSummary
): Status => {
  if (phase === 'planning') {
    // Calculation is currently running
    return Status.NEXT;
  }

  if (phase === 'error') {
    // Error during previous run; user needs to acknowledge by rejecting.
    return Status.ERROR;
  }

  if (phase === 'waitingForApproval') {
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
  progress,
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
        {phase === 'planning' && progress ? (
          <ListItemTextWithProgress
            primary={
              progress?.message ?? t('collectiveRTHDialog.status.loading')
            }
            secondary={
              <LinearProgress
                key={progress?.message}
                variant={
                  progress?.percentage !== undefined
                    ? 'determinate'
                    : 'indeterminate'
                }
                value={progress?.percentage}
              />
            }
          />
        ) : (
          <ListItemTextWithProgress
            primary={
              phase === 'waitingForApproval' && pendingPlan
                ? t('collectiveRTHDialog.summary.numPlans.message', {
                    count: pendingPlan.stats.length,
                  })
                : existingPlan?.isValid
                  ? t('collectiveRTHDialog.existingValidRTHPlan', {
                      count: Object.keys(existingPlan.plans).length,
                    })
                  : t('collectiveRTHDialog.existingInvalidRTHPlan')
            }
            secondary={
              phase === 'error' ? (
                t('collectiveRTHDialog.status.error')
              ) : phase === 'planning' ? (
                t('collectiveRTHDialog.status.loading')
              ) : phase === 'waitingForApproval' && pendingPlan ? (
                <RTHStats {...pendingPlan} />
              ) : existingPlan?.isValid ? (
                <RTHStats {...existingPlan} />
              ) : (
                t('collectiveRTHDialog.hints.addCollectiveRTH')
              )
            }
          />
        )}
      </ListItem>
    </TransparentList>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    phase: selectCollectiveRTHPlanningPhase(state),
    existingPlan: selectCollectiveRTHPlanSummary(state),
    pendingPlan: selectRTHPlanTaskResult(state),
    progress: selectRTHPlanTaskProgress(state),
  })
)(RTHPlanTaskResultSummary);
