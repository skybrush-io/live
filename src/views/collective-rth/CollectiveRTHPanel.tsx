import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import {
  createSecondaryAreaStyle,
  isThemeDark,
  makeStyles,
} from '@skybrush/app-theme-mui';
import { BackgroundHint } from '@skybrush/mui-components';

import CenteredBox from '~/components/CenteredBox';
import ScheduleProgressIndicator from '~/components/progress/ScheduleProgressIndicator';
import {
  hasLoadedShowFile,
  selectCollectiveRTHPlanSummary,
  selectCollectiveRTHSchedule,
  type CollectiveRTHPlanSummary,
  type CollectiveRTHPlanSummaryItem,
} from '~/features/show/selectors';
import type { Schedule } from '~/flockwave/schedule';
import type { RootState } from '~/store/reducers';

import RTHPlanDetails from './RTHPlanDetails';

type ErrorInfo = {
  message: string;
  severity: 'error' | 'warning';
};

type Props = {
  hasLoadedShowFile: boolean;
  planSummary: CollectiveRTHPlanSummary;
  rthSchedule?: Schedule;
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

const CollectiveRTHPanelMainPart = ({
  hasLoadedShowFile,
  planSummary,
}: Props) => {
  const { numDrones, isValid } = planSummary;
  const { errorInfo, sortedPlanEntries, t } = useOwnState(planSummary);

  if (!hasLoadedShowFile) {
    return <BackgroundHint text={t('collectiveRTHPanel.message.noShowFile')} />;
  }

  if (numDrones === 0) {
    return <BackgroundHint text={t('collectiveRTHPanel.message.noDrones')} />;
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

  return <RTHPlanDetails plans={sortedPlanEntries} />;
};

const useStyles = makeStyles((theme) => ({
  main: {
    flex: 1,
    overflowY: 'hidden',
  },

  sidebar: {
    ...createSecondaryAreaStyle(theme),
    width: 320,
    overflowY: 'auto',
    border: undefined,
    borderLeft: `1px solid ${
      isThemeDark(theme) ? 'rgba(0, 0, 0, 0.54)' : 'rgba(255, 255, 255, 0.54)'
    }`,
    boxShadow: '0 0px 6px -2px inset rgba(0, 0, 0, 0.54)',
  },
}));

const CollectiveRTHPanel = ({
  hasLoadedShowFile,
  planSummary,
  rthSchedule,
}: Props) => {
  const classes = useStyles();

  return (
    <Stack direction='row' sx={{ flex: 1, overflow: 'hidden', height: '100%' }}>
      <Box className={classes.main}>
        <CollectiveRTHPanelMainPart
          hasLoadedShowFile={hasLoadedShowFile}
          planSummary={planSummary}
        />
      </Box>
      {rthSchedule && (
        <ScheduleProgressIndicator
          className={classes.sidebar}
          schedule={rthSchedule.schedule}
        />
      )}
    </Stack>
  );
};

const ConnectedCollectiveRTHPanel = connect((state: RootState) => ({
  hasLoadedShowFile: hasLoadedShowFile(state),
  planSummary: selectCollectiveRTHPlanSummary(state),
  rthSchedule: selectCollectiveRTHSchedule(state),
}))(CollectiveRTHPanel);

export default ConnectedCollectiveRTHPanel;
