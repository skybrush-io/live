import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { useHarmonicIntervalFn, useUpdate } from 'react-use';

import LCDText from './LCDText';

import { getClockById } from '~/features/clocks/selectors';
import {
  formatTicksOnClock,
  getCurrentTickCountOnClock,
  getPreferredUpdateIntervalOfClock
} from '~/features/clocks/utils';

const LCDClockDisplayLabel = ({
  clock,
  clockId,
  format,
  updateInterval,
  ...rest
}) => {
  const { running } = clock || {};
  const ticks = clock ? getCurrentTickCountOnClock(clock) : undefined;
  const formattedTime =
    ticks === undefined
      ? '--:--:--'
      : formatTicksOnClock(ticks, clock, { format });
  const update = useUpdate();

  useHarmonicIntervalFn(update, running ? updateInterval : null);

  return <LCDText {...rest}>{formattedTime}</LCDText>;
};

LCDClockDisplayLabel.propTypes = {
  clock: PropTypes.object,
  clockId: PropTypes.string,
  format: PropTypes.string,
  updateInterval: PropTypes.number
};

LCDClockDisplayLabel.defaultProps = {
  format: 'HH:mm:ss'
};

export default connect(
  // mapStateToProps
  (state, ownProps) => {
    const clock = getClockById(state, ownProps.clockId);
    const updateInterval = getPreferredUpdateIntervalOfClock(clock);
    return { clock, updateInterval };
  },
  // mapDispatchToProps
  () => ({})
)(LCDClockDisplayLabel);
