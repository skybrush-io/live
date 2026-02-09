import Check from '@mui/icons-material/Check';
import HourglassTop from '@mui/icons-material/HourglassTop';
import PauseCircleOutlined from '@mui/icons-material/PauseCircleOutlined';
import PlayCircleOutlined from '@mui/icons-material/PlayCircleOutlined';
import Webhook from '@mui/icons-material/Webhook';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { TimeSegment, TimeSegmentType } from '~/flockwave/schedule';
import HomeCircleOutlined from '~/icons/HomeCircleOutlined';

import ProgressCard from './ProgressCard';

const UPDATE_INTERVAL_MS = 100;

const SEGMENT_TYPE_ICONS: Record<TimeSegmentType, React.ReactNode> = {
  preparation: <Webhook />,
  rth: <HomeCircleOutlined />,
  slowdown: <PauseCircleOutlined />,
  speedup: <PlayCircleOutlined />,
};

type Stage =
  | { id: 'waiting'; remainingMs: number }
  | { id: 'completed'; remainingMs: number }
  | {
      id: 'progress';
      remainingMs: number;
      segment: TimeSegment | undefined;
    };

function getCurrentStage(segments: TimeSegment[], nowMs: number): Stage {
  if (segments.length === 0) {
    return { id: 'completed', remainingMs: 0 };
  }

  const firstSegment = segments[0];
  if (nowMs < firstSegment.startMs) {
    return { id: 'waiting', remainingMs: firstSegment.startMs - nowMs };
  }

  const lastSegment = segments[segments.length - 1];
  if (nowMs >= lastSegment.endMs) {
    return { id: 'completed', remainingMs: 0 };
  }

  // There must be a segment that ends after the current ms
  // otherwise we'd be in the completed stage.
  const nextSegment = segments.find((seg) => nowMs < seg.endMs)!;
  const inNextSegment = nextSegment.startMs <= nowMs;

  return {
    id: 'progress',
    remainingMs: inNextSegment
      ? nextSegment.endMs - nowMs
      : nextSegment.startMs - nowMs,
    segment: inNextSegment ? nextSegment : undefined,
  };
}

type Progress = {
  /**
   * The total duration of the schedule in milliseconds.
   *
   * 0 if the schedule is empty.
   */
  durationMs: number;

  /**
   * The number of milliseconds since the start time of the first time segment.
   *
   * 0 if the schedule is empty.
   */
  elapsedMs: number;

  /**
   * Current progress in the [0,100] interval.
   */
  progress: number;
};

function calculateProgress(segments: TimeSegment[], nowMs: number): Progress {
  if (segments.length === 0) {
    return { durationMs: 0, elapsedMs: 0, progress: 100 };
  }

  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];

  const durationMs = Math.max(lastSegment.endMs - firstSegment.startMs, 0);
  if (durationMs <= 0) {
    return { durationMs: 0, elapsedMs: 0, progress: 100 };
  }

  const elapsedMs = Math.max(nowMs - firstSegment.startMs, 0);
  const progress = Math.min(Math.max((elapsedMs / durationMs) * 100, 0), 100);
  return { durationMs, elapsedMs, progress };
}

type ScheduleProgressIndicatorProps = {
  schedule: TimeSegment[];
};

const ScheduleProgressIndicator = ({
  schedule,
}: ScheduleProgressIndicatorProps) => {
  const { t } = useTranslation();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const stage = getCurrentStage(schedule, nowMs);
  const stageId = stage.id;
  const { durationMs, elapsedMs, progress } = calculateProgress(
    schedule,
    nowMs
  );

  useEffect(() => {
    if (stageId === 'completed') {
      return;
    }

    const intervalId = setInterval(() => {
      setNowMs(Date.now());
    }, UPDATE_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [stageId]);

  const segment = stage.id === 'progress' ? stage.segment : undefined;
  const [title, description] =
    segment === undefined
      ? [
          t(`scheduleProgressIndicator.stage.${stage.id}.title`, {
            remainingSeconds: String(Math.ceil(stage.remainingMs / 1000)),
          }),
          t(`scheduleProgressIndicator.stage.${stage.id}.description`),
        ]
      : [
          t(`scheduleProgressIndicator.segment.${segment.type}.title`, {
            remainingSeconds: String(Math.ceil(stage.remainingMs / 1000)),
          }),
          t(`scheduleProgressIndicator.segment.${segment.type}.description`),
        ];

  return (
    <ProgressCard
      value={progress}
      title={title}
      description={description}
      caption={t('scheduleProgressIndicator.caption', {
        elapsedSeconds: String(
          Math.floor(Math.min(elapsedMs, durationMs) / 1000)
        ),
        durationSeconds: String(Math.ceil(durationMs / 1000)),
      })}
      icon={
        stage.id === 'waiting' ? (
          <HourglassTop />
        ) : stage.id === 'completed' ? (
          <Check />
        ) : stage.segment?.type === undefined ? (
          <Webhook />
        ) : (
          SEGMENT_TYPE_ICONS[stage.segment.type]
        )
      }
    ></ProgressCard>
  );
};

export default ScheduleProgressIndicator;
