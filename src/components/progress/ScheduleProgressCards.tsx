import CampaignIcon from '@mui/icons-material/Campaign';
import FastForwardIcon from '@mui/icons-material/FastForward';
import HomeIcon from '@mui/icons-material/Home';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { type StackProps } from '@mui/material/Stack';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  calculateSegmentProgress,
  type TimeSegment,
  type TimeSegmentType,
} from '~/flockwave/schedule';

import ProgressCard from './ProgressCard';
import ProgressCardContainer from './ProgressCardContainer';

const UPDATE_INTERVAL_MS = 100;

const SEGMENT_TYPE_ICONS: Record<TimeSegmentType, React.ReactNode> = {
  preparation: <CampaignIcon />,
  rth: <HomeIcon />,
  slowdown: <PauseIcon />,
  speedup: <FastForwardIcon />,
  show: <PlayArrowIcon />,
};

type SegmentProgressCardProps = {
  segment: TimeSegment;
};

export const useRefreshTimestampWhile = (
  condition: boolean,
  setter: (value: number) => void
) => {
  useEffect(() => {
    if (condition) {
      const intervalId = setInterval(() => {
        setter(Date.now());
      }, UPDATE_INTERVAL_MS);

      return () => clearInterval(intervalId);
    }
  }, [condition, setter]);
};

const SegmentProgressCard = ({ segment }: SegmentProgressCardProps) => {
  const { t } = useTranslation();

  const [nowMs, setNowMs] = useState(() => Date.now());
  const { durationMs, elapsedMs, progress, stage, waitingMs } =
    calculateSegmentProgress(segment, nowMs);
  const isCompleted = stage === 'completed';
  useRefreshTimestampWhile(!isCompleted, setNowMs);

  const segmentType = `${segment.type}.${isCompleted ? 'completed' : 'running'}`;
  const title = t(`showControlSchedule.segment.${segmentType}.title`);
  const description = t(
    `showControlSchedule.segment.${segmentType}.description`
  );
  const subheader = t(`showControlSchedule.progress.${stage}`, {
    elapsedSeconds: Math.floor(elapsedMs / 1000),
    durationSeconds: Math.ceil(durationMs / 1000),
    countdownSeconds: Math.ceil(waitingMs / 1000),
  });

  return (
    <ProgressCard
      value={progress}
      title={title}
      description={!isCompleted ? description : undefined}
      subheader={subheader}
      icon={SEGMENT_TYPE_ICONS[segment.type]}
    />
  );
};

type Props = {
  schedule: TimeSegment[];
} & StackProps;

/**
 * Component that shows the status of a drone show schedule using progress cards for
 * each segment.
 */
const ScheduleProgressCards = ({ schedule, ...rest }: Props) => {
  const { t } = useTranslation();

  return (
    <ProgressCardContainer title={t('showControlSchedule.title')} {...rest}>
      {schedule.length === 0 ? (
        <ProgressCard
          value={100}
          title={t('showControlSchedule.empty.title')}
          description={t('showControlSchedule.empty.description')}
        />
      ) : (
        schedule.map((segment) => (
          <SegmentProgressCard
            key={`${segment.type}-${segment.startMs}`}
            segment={segment}
          />
        ))
      )}
    </ProgressCardContainer>
  );
};

export default ScheduleProgressCards;
