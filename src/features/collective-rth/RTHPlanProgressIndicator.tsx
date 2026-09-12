import Box, { type BoxProps } from '@mui/material/Box';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { LabeledProgressBar } from '@skybrush/mui-components';

import type { ProgressInfo } from '~/flockwave/messages';
import type { RootState } from '~/store/reducers';

import type { RTHPlanTaskPhase } from './selectors';
import { selectRTHPlanTaskPhase, selectRTHPlanTaskProgress } from './selectors';

type Props = {
  phase: RTHPlanTaskPhase;
  progress?: ProgressInfo;
} & BoxProps;

const RTHPlanProgressIndicator = ({ phase, progress, ...rest }: Props) => {
  const { t } = useTranslation();

  if (phase !== 'running') {
    return null;
  }

  return (
    <Box {...rest}>
      {/* Keyed by the progress message so that the progress bar is remounted *
      when the server starts another subtask: without the key, MUI would *
      smoothly animate the transition from the final progress of the * previous
      subtask back to the (near-zero) progress of the new one, * which looks
      wrong. */}
      <LabeledProgressBar
        key={progress?.message}
        label={progress?.message ?? t('collectiveRTHDialog.status.loading')}
        variant={
          progress?.percentage !== undefined ? 'determinate' : 'indeterminate'
        }
        value={progress?.percentage}
      />
    </Box>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    phase: selectRTHPlanTaskPhase(state),
    progress: selectRTHPlanTaskProgress(state),
  })
)(RTHPlanProgressIndicator);
