import Typography from '@mui/material/Typography';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import CenteredBox from '~/components/CenteredBox';
import { hasLoadedShowFile } from '~/features/show/selectors';
import {
  selectCollectiveRTHPlanSummary,
  type CollectiveRTHPlanSummary,
  type CollectiveRTHPlanSummaryItem,
} from '~/features/show/selectors/rth';
import type { RootState } from '~/store/reducers';

import RTHPlanDetails from './RTHPlanDetails';

type ErrorInfo = {
  message: string;
  severity: 'error' | 'warning';
};

type Props = {
  hasLoadedShowFile: boolean;
  planSummary: CollectiveRTHPlanSummary;
};

const useOwnState = ({
  dronesWithRTHPlan,
  dronesWithoutRTHPlan,
  isValid,
  numDrones,
  plans,
}: CollectiveRTHPlanSummary) => {
  const { t } = useTranslation();

  const sortedPlanEntries: CollectiveRTHPlanSummaryItem[] = useMemo(() => {
    return Object.entries(plans)
      .map(([time, plan]) => ({
        time: Number.parseInt(time, 10),
        maxDuration: plan.maxDuration,
      }))
      .sort((a, b) => a.time - b.time);
  }, [plans]);

  const errorInfo: ErrorInfo | undefined = useMemo(() => {
    if (dronesWithoutRTHPlan === numDrones) {
      return {
        message: t('collectiveRTHPanel.error.missingPlan'),
        severity: 'warning',
      };
    }

    if (dronesWithRTHPlan > 0 && dronesWithoutRTHPlan > 0) {
      return {
        message: t('collectiveRTHPanel.error.partialPlan', {
          withPlans: dronesWithRTHPlan,
          withoutPlans: dronesWithoutRTHPlan,
        }),
        severity: 'error',
      };
    }

    if (dronesWithRTHPlan === numDrones && !isValid) {
      return {
        message: t('collectiveRTHPanel.error.invalidPlan'),
        severity: 'error',
      };
    }

    return undefined;
  }, [dronesWithRTHPlan, dronesWithoutRTHPlan, isValid, numDrones, t]);

  return {
    errorInfo,
    sortedPlanEntries,
    t,
  };
};

const CollectiveRTHPanel = ({ hasLoadedShowFile, planSummary }: Props) => {
  const { firstTime, lastTime, numDrones, isValid } = planSummary;
  const { errorInfo, sortedPlanEntries, t } = useOwnState(planSummary);

  if (!hasLoadedShowFile) {
    return (
      <CenteredBox>
        <Typography variant='h6'>
          {t('collectiveRTHPanel.message.noShowFile')}
        </Typography>
      </CenteredBox>
    );
  }

  if (numDrones === 0) {
    return (
      <CenteredBox>
        <Typography variant='h6' color='warning'>
          {t('collectiveRTHPanel.message.noDrones')}
        </Typography>
      </CenteredBox>
    );
  }

  if (!isValid) {
    return (
      <CenteredBox>
        <Typography variant='h6' color={errorInfo?.severity ?? 'error'}>
          {errorInfo?.message ?? t('collectiveRTHPanel.error.invalidPlan')}
        </Typography>
      </CenteredBox>
    );
  }

  return (
    <RTHPlanDetails
      plans={sortedPlanEntries}
      firstTime={firstTime}
      lastTime={lastTime}
    />
  );
};

const ConnectedCollectiveRTHPanel = connect((state: RootState) => ({
  hasLoadedShowFile: hasLoadedShowFile(state),
  planSummary: selectCollectiveRTHPlanSummary(state),
}))(CollectiveRTHPanel);

export default ConnectedCollectiveRTHPanel;
