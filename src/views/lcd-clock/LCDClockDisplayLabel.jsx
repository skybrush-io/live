import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { useHarmonicIntervalFn, useUpdate } from 'react-use';

import LCDText from './LCDText';

import { getClockById } from '~/features/clocks/selectors';
import {
  formatTicksOnClock,
  getCurrentTickCountOnClock,
  getPreferredUpdateIntervalOfClock,
  isClockSigned
} from '~/features/clocks/utils';

const LCDClockDisplayLabel = ({
  clock,
  clockId,
  format,
  signed,
  updateInterval,
  ...rest
}) => {
  const { running } = clock || {};
  const ticks = clock ? getCurrentTickCountOnClock(clock) : undefined;
  let formattedTime =
    ticks === undefined
      ? '--:--:--'
      : formatTicksOnClock(ticks, clock, { format });
  const update = useUpdate();

  if (signed && formattedTime.charAt(0) !== '-') {
    // '!' is the all-off character in the 14-segment display font
    formattedTime = '!' + formattedTime;
  }

  useHarmonicIntervalFn(update, running ? updateInterval : null);

  return <LCDText {...rest}>{formattedTime}</LCDText>;
};

LCDClockDisplayLabel.propTypes = {
  clock: PropTypes.object,
  clockId: PropTypes.string,
  format: PropTypes.string,
  signed: PropTypes.bool,
  updateInterval: PropTypes.number
};

LCDClockDisplayLabel.defaultProps = {
  format: 'HH:mm:ss'
};

export default connect(
  // mapStateToProps
  (state, ownProps) => {
    const clock = getClockById(state, ownProps.clockId);
    const signed = isClockSigned(clock);
    const updateInterval = getPreferredUpdateIntervalOfClock(clock);
    return { clock, signed, updateInterval };
  },
  // mapDispatchToProps
  () => ({})
)(LCDClockDisplayLabel);
