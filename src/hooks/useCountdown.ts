import { useCallback, useEffect, useMemo, useState } from 'react';

const INTERVAL_MS = 250;

export const useCountdown = (durationMs?: number) => {
  const startMs = useMemo(() => Date.now(), []);
  const [endMs, setEndMs] = useState(() => startMs + (durationMs ?? 0));
  const [pausedAtMs, setPausedAtMs] = useState<number | undefined>(undefined);
  const [nowMs, setNowMs] = useState(Date.now());
  const done = nowMs >= endMs;

  const pause = useCallback(() => {
    if (!(done || pausedAtMs !== undefined)) {
      setPausedAtMs(Date.now());
    }
  }, [done, pausedAtMs]);

  const resume = useCallback(() => {
    if (!(done || pausedAtMs === undefined)) {
      const now = Date.now();
      setNowMs(now);
      setEndMs((prev) => prev + now - pausedAtMs);
      setPausedAtMs(undefined);
    }
  }, [done, pausedAtMs]);

  useEffect(() => {
    if (done || pausedAtMs !== undefined) {
      return;
    }

    const timer = setInterval(() => setNowMs(Date.now()), INTERVAL_MS);
    return () => clearInterval(timer);
  }, [done, pausedAtMs]);

  const remainingMs = Math.max(endMs - nowMs, 0);
  const progress =
    durationMs === undefined ? 100 : 100 * (1 - remainingMs / durationMs);
  return { progress, remainingMs, pause, resume };
};
