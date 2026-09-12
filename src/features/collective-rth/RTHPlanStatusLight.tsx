import Box from '@mui/material/Box';
import Fade from '@mui/material/Fade';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { Status } from '@skybrush/app-theme-mui';
import { LabeledStatusLight } from '@skybrush/mui-components';

import type { RootState } from '~/store/reducers';

import type { RTHPlanTaskPhase } from './selectors';
import { selectRTHPlanTaskPhase } from './selectors';

type Props = {
  phase: RTHPlanTaskPhase;
};

const RTHPlanStatusLight = ({ phase }: Props) => {
  const { t } = useTranslation();
  const status: Status =
    phase === 'success'
      ? Status.SUCCESS
      : phase === 'running'
        ? Status.NEXT
        : phase === 'error'
          ? Status.ERROR
          : Status.INFO;
  const statusMessage =
    phase === 'success'
      ? t('collectiveRTHDialog.status.success')
      : phase === 'running'
        ? t('collectiveRTHDialog.status.loading')
        : phase === 'error'
          ? t('collectiveRTHDialog.status.error')
          : '';

  return (
    <Fade in={phase !== 'idle'}>
      <Box sx={{ flex: 1 }}>
        <LabeledStatusLight color='textSecondary' status={status} size='small'>
          {statusMessage}
        </LabeledStatusLight>
      </Box>
    </Fade>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    phase: selectRTHPlanTaskPhase(state),
  })
)(RTHPlanStatusLight);
