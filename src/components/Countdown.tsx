import { useTranslation } from 'react-i18next';

import { useCountdown } from '~/hooks/useCountdown';
import { formatDuration } from '~/utils/formatting';

type CountdownProps = {
  seconds: number;
};

const Countdown = ({ seconds }: CountdownProps) => {
  const { remainingMs } = useCountdown(seconds * 1000);
  const { t } = useTranslation();

  const remainingSeconds = Math.ceil(remainingMs / 1000);
  let formatted: string;
  if (Math.floor(remainingSeconds / 60) > 0) {
    formatted = formatDuration(remainingSeconds);
  } else {
    formatted = t('general.time.seconds_short', { count: remainingSeconds });
  }

  return formatted;
};

export default Countdown;
