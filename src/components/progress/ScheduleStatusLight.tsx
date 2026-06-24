import Stack, { type StackProps } from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Status } from '@skybrush/app-theme-mui';
import {
  LabeledStatusLight,
  type LabeledStatusLightProps,
} from '@skybrush/mui-components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import LinearProgress from '@mui/material/LinearProgress';
import {
  calculateSegmentProgress,
  findCurrentOrNextTimeSegment,
  type TimeSegment,
} from '~/flockwave/schedule';

import TimeAgo from 'react-timeago';
import { shortTimeAgoFormatter } from '~/utils/formatting';
import { useRefreshTimestampWhile } from './ScheduleProgressCards';

type Props = {
  schedule: TimeSegment[];
} & StackProps &
  Pick<LabeledStatusLightProps, 'color' | 'size'>;

const EMPTY_SEGMENT: TimeSegment = {
  type: 'show',
  startMs: 0,
  endMs: 0,
};

/**
 * Component that shows the status of a drone show schedule in a light-weight way,
 * with a single labeled status light only.
 */
const ScheduleStatusLight = ({ schedule, color, size, sx, ...rest }: Props) => {
  const { t } = useTranslation();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const segment =
    findCurrentOrNextTimeSegment(schedule, nowMs) ??
    schedule.at(-1) ??
    EMPTY_SEGMENT;
  const { progress, stage } = calculateSegmentProgress(segment, nowMs);
  useRefreshTimestampWhile(stage !== 'completed', setNowMs);

  const title = t(`scheduleProgressIndicator.segment.${segment.type}.title`);
  const timestamp =
    stage === 'waiting'
      ? segment.startMs
      : stage === 'active'
        ? segment.endMs
        : undefined;
  return (
    <Stack direction='column' spacing={1} sx={{ ...sx }} {...rest}>
      <Stack direction='row' spacing={2} sx={{ alignItems: 'center' }}>
        <LabeledStatusLight
          status={
            stage === 'waiting'
              ? Status.WAITING
              : stage === 'active'
                ? Status.NEXT
                : Status.SUCCESS
          }
          color={color}
          size={size}
          sx={{ flex: 1 }}
        >
          {title}
        </LabeledStatusLight>
        {typeof timestamp === 'number' ? (
          <Typography
            variant={size === 'small' ? 'body2' : 'body1'}
            color='textSecondary'
          >
            <TimeAgo date={timestamp} formatter={shortTimeAgoFormatter} />
          </Typography>
        ) : null}
      </Stack>

      {/* key of <LinearProgress /> ensures that the progress bar is not animated */}
      {/* back to zero when a new stage starts but jumps back abruptly */}

      <LinearProgress
        key={`${segment.type}-${segment.startMs}`}
        value={progress}
        variant='determinate'
        color={stage === 'completed' ? 'success' : 'primary'}
      />
    </Stack>
  );
};

export default ScheduleStatusLight;
