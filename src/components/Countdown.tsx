import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDuration } from '~/utils/formatting';

const INTERVAL_MS = 250;

type CountdownProps = {
  seconds: number;
};

const Countdown = ({ seconds }: CountdownProps) => {
  const startMs = useMemo(() => Date.now(), []);
  const endMs = useMemo(() => startMs + seconds * 1000, [startMs, seconds]);
  const [nowMs, setNowMs] = useState(Date.now());
  const { t } = useTranslation();
  const done = nowMs >= endMs;

  useEffect(() => {
    if (done) return;
    const timer = setInterval(() => setNowMs(Date.now()), INTERVAL_MS);
    return () => clearInterval(timer);
  }, [done]);

  const remainingSeconds = Math.ceil((endMs - nowMs) / 1000);
  let formatted: string;
  if (Math.floor(remainingSeconds / 60) > 0) {
    formatted = formatDuration(remainingSeconds);
  } else {
    formatted = t('general.time.seconds_short', { count: remainingSeconds });
  }

  return formatted;
};

export default Countdown;
