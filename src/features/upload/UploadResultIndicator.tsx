import {
  LabeledStatusLight,
  type LabeledStatusLightProps,
} from '@skybrush/mui-components';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { Status } from '~/components/semantics';
import useCurrentTimestamp from '~/hooks/useCurrentTimestamp';
import type { RootState } from '~/store/reducers';
import { formatDurationAsText } from '~/utils/formatting';

import {
  getEstimatedCompletionTime,
  getLastUploadResultByJobType,
  isUploadInProgress,
} from './selectors';

type UploadResultIndicatorProps = Omit<LabeledStatusLightProps, 'children'> & {
  completionTime?: number;
  result?: 'success' | 'error' | 'cancelled';
  running?: boolean;
};

/**
 * Helper component that shows an alert summarizing the result of the last
 * upload attempt.
 */
const UploadResultIndicator = ({
  completionTime,
  result,
  running,
  ...rest
}: UploadResultIndicatorProps) => {
  const { t } = useTranslation();

  let status: Status | undefined;
  let message;

  const now = useCurrentTimestamp(500);
  const timeRemaining = completionTime
    ? completionTime > now
      ? (completionTime - now) / 1000
      : undefined
    : undefined;

  switch (result) {
    case 'success':
      status = Status.SUCCESS;
      message = t('uploadPanel.uploadFinishedSuccessfully');
      break;

    case 'cancelled':
      status = Status.WARNING;
      message = t('uploadPanel.uploadCancelled');
      break;

    case 'error':
      status = Status.ERROR;
      message = t('uploadPanel.uploadAttemptFailed');
      break;

    default:
      status = undefined;
      break;
  }

  if (running) {
    status = Status.NEXT;
    if (typeof timeRemaining === 'number' && timeRemaining > 0) {
      message = t('uploadPanel.uploadInProgressWithEstimate', {
        time: formatDurationAsText(timeRemaining, t),
      });
    } else {
      message = t('uploadPanel.uploadInProgress');
    }
  }

  return status ? (
    <LabeledStatusLight
      color='textSecondary'
      status={status}
      size='small'
      {...rest}
    >
      {message}
    </LabeledStatusLight>
  ) : null;
};

type OwnProps = {
  jobType: string;
};

export default connect(
  // mapStateToProps
  (state: RootState, ownProps: OwnProps) => ({
    completionTime: getEstimatedCompletionTime(state),
    lastUploadResult: getLastUploadResultByJobType(state, ownProps.jobType),
    running: isUploadInProgress(state),
  }),
  // mapDispatchToProps
  null
)(UploadResultIndicator);
