import formatDate from 'date-fns/format';
import PropTypes from 'prop-types';
import React from 'react';
import { useHarmonicIntervalFn, useUpdate } from 'react-use';

/**
 * React component that shows an automatically updating timestamp, forwatted
 * according to the given format string.
 */
const AutoUpdatingTimestamp = ({
  clockSkew,
  component = 'span',
  format = 'yyyy-MM-dd HH:mm:ss',
  updateInterval,
  ...rest
}) => {
  const timestamp = Date.now() + (clockSkew || 0);
  const formattedTime =
    typeof format === 'function'
      ? format(timestamp)
      : formatDate(timestamp, format);
  const update = useUpdate();
  useHarmonicIntervalFn(update, updateInterval || 1000);
  return React.createElement(component, rest, formattedTime);
};

AutoUpdatingTimestamp.propTypes = {
  component: PropTypes.string,
  clockSkew: PropTypes.number,
  format: PropTypes.string,
  updateInterval: PropTypes.number,
};

export default AutoUpdatingTimestamp;
