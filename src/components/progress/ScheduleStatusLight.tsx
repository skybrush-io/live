import Stack, { type StackProps } from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { colorForStatus, Status } from '@skybrush/app-theme-mui';
import {
  LabeledStatusLight,
  Tooltip,
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

import Box from '@mui/material/Box';
import TimeAgo from 'react-timeago';
import { shortTimeAgoFormatter } from '~/utils/formatting';
import { useRefreshTimestampWhile } from './ScheduleProgressCards';

type Props = {
  schedule?: TimeSegment[];
  emptyType?: string;
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
const ScheduleStatusLight = ({
  emptyType = 'empty',
  schedule,
  color,
  size,
  sx,
  ...rest
}: Props) => {
  const { t } = useTranslation();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const segment =
    findCurrentOrNextTimeSegment(schedule ?? [], nowMs) ?? schedule?.at(-1);
  const { progress, stage } = calculateSegmentProgress(
    segment ?? EMPTY_SEGMENT,
    nowMs
  );
  useRefreshTimestampWhile(stage !== 'completed', setNowMs);

  const segmentType = segment ? `segment.${segment.type}` : emptyType;
  const title = t(`showControlSchedule.${segmentType}.title`);
  const tooltip = t(`showControlSchedule.${segmentType}.description`);
  const timestamp = segment
    ? stage === 'waiting'
      ? segment.startMs
      : stage === 'active'
        ? segment.endMs
        : undefined
    : undefined;
  const status = segment
    ? stage === 'waiting'
      ? Status.WAITING
      : stage === 'active'
        ? Status.NEXT
        : Status.SUCCESS
    : Status.OFF;

  return (
    <Tooltip content={tooltip} placement='bottom'>
      <Stack direction='column' spacing={1} sx={{ ...sx }} {...rest}>
        <Stack direction='row' spacing={2} sx={{ alignItems: 'center' }}>
          <LabeledStatusLight
            status={status}
            color={segment ? color : 'textSecondary'}
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

        {segment ? (
          <LinearProgress
            key={`${segmentType}-${segment.startMs}`}
            value={progress}
            variant='determinate'
            color={stage === 'completed' ? 'success' : 'primary'}
            sx={{ height: 4 }}
          />
        ) : (
          <Box sx={{ height: 4, backgroundColor: colorForStatus(status) }} />
        )}
      </Stack>
    </Tooltip>
  );
};

export default ScheduleStatusLight;
