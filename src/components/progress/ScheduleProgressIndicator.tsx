import PauseCircleOutlined from '@mui/icons-material/PauseCircleOutlined';
import PlayCircleOutlined from '@mui/icons-material/PlayCircleOutlined';
import Webhook from '@mui/icons-material/Webhook';
import { type StackProps } from '@mui/material/Stack';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { TimeSegment, TimeSegmentType } from '~/flockwave/schedule';
import HomeCircleOutlined from '~/icons/HomeCircleOutlined';

import ProgressCard from './ProgressCard';
import ProgressCardContainer from './ProgressCardContainer';

const UPDATE_INTERVAL_MS = 100;

const SEGMENT_TYPE_ICONS: Record<TimeSegmentType, React.ReactNode> = {
  preparation: <Webhook />,
  rth: <HomeCircleOutlined />,
  slowdown: <PauseCircleOutlined />,
  speedup: <PlayCircleOutlined />,
};

type SegmentStage = 'waiting' | 'active' | 'completed';

type SegmentProgress = {
  durationMs: number;
  elapsedMs: number;
  progress: number;
  stage: SegmentStage;
  waitingMs: number;
};

function calculateSegmentProgress(
  segment: TimeSegment,
  nowMs: number
): SegmentProgress {
  const durationMs = Math.max(segment.endMs - segment.startMs, 0);
  const elapsedMs = Math.max(Math.min(nowMs - segment.startMs, durationMs), 0);
  const progress =
    durationMs > 0
      ? Math.min(Math.floor((elapsedMs / durationMs) * 100), 100)
      : 100;
  let waitingMs = 0;

  let stage: SegmentStage;
  if (nowMs < segment.startMs) {
    stage = 'waiting';
    waitingMs = segment.startMs - nowMs;
  } else if (progress < 100) {
    stage = 'active';
  } else {
    stage = 'completed';
  }

  return { durationMs, elapsedMs, progress, stage, waitingMs };
}

type SegmentProgressCardProps = {
  segment: TimeSegment;
};

const SegmentProgressCard = ({ segment }: SegmentProgressCardProps) => {
  const { t } = useTranslation();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const { durationMs, elapsedMs, progress, stage, waitingMs } =
    calculateSegmentProgress(segment, nowMs);

  useEffect(() => {
    if (stage === 'completed') {
      return;
    }

    const intervalId = setInterval(() => {
      setNowMs(Date.now());
    }, UPDATE_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [stage]);

  const title = t(
    `scheduleProgressIndicator.segment.${segment.type}.title.${
      stage === 'waiting' ? 'waiting' : 'default'
    }`,
    { countdownSeconds: Math.ceil(waitingMs / 1000) }
  );
  const description = t(
    `scheduleProgressIndicator.segment.${segment.type}.description`
  );
  const caption = t(`scheduleProgressIndicator.progress.${stage}`, {
    elapsedSeconds: Math.floor(elapsedMs / 1000),
    durationSeconds: Math.ceil(durationMs / 1000),
  });
  const isCompleted = stage === 'completed';

  return (
    <ProgressCard
      value={progress}
      title={title}
      description={!isCompleted ? description : undefined}
      caption={caption}
      icon={SEGMENT_TYPE_ICONS[segment.type]}
    />
  );
};

type ScheduleProgressIndicatorProps = {
  schedule: TimeSegment[];
} & StackProps;

const ScheduleProgressIndicator = ({
  schedule,
  ...rest
}: ScheduleProgressIndicatorProps) => {
  const { t } = useTranslation();

  return (
    <ProgressCardContainer
      title={t('scheduleProgressIndicator.title')}
      {...rest}
    >
      {schedule.length === 0 ? (
        <ProgressCard
          value={100}
          title={t('scheduleProgressIndicator.empty.title')}
          description={t('scheduleProgressIndicator.empty.description')}
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

export default ScheduleProgressIndicator;
