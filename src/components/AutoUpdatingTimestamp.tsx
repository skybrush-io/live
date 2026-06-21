import formatDate from 'date-fns/format';
import React, { useCallback, useState } from 'react';
import { useHarmonicIntervalFn } from 'react-use';

type Props = {
  clockSkew?: number;
  component?: string;
  format?: string | ((timestamp: number) => string);
  updateInterval?: number;
} & React.HTMLAttributes<HTMLElement>;

/**
 * React component that shows an automatically updating timestamp, forwatted
 * according to the given format string.
 */
const AutoUpdatingTimestamp = ({
  clockSkew = 0,
  component = 'span',
  format = 'yyyy-MM-dd HH:mm:ss',
  updateInterval,
  ...rest
}: Props) => {
  const [timestamp, setTimestamp] = useState(() => Date.now() + clockSkew);
  const formattedTime =
    typeof format === 'function'
      ? format(timestamp)
      : formatDate(timestamp, format);
  const update = useCallback(() => {
    setTimestamp(Date.now() + clockSkew);
  }, [clockSkew]);
  useHarmonicIntervalFn(update, updateInterval ?? 1000);
  return React.createElement(component, rest, formattedTime);
};

export default AutoUpdatingTimestamp;
