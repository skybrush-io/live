import isNil from 'lodash-es/isNil';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { useHarmonicIntervalFn, useUpdate } from 'react-use';

import LCDText from './LCDText';

import { getClockById } from '~/features/clocks/selectors';
import {
  formatTicksOnClock,
  getPreferredUpdateIntervalOfClock,
  getTickCountOnClockAt,
  isClockAffectedByClockSkew,
  isClockSigned,
} from '~/features/clocks/utils';
import { getRoundedClockSkewInMilliseconds } from '~/features/servers/selectors';

const LCDClockDisplayLabel = ({
  affectedByClockSkew,
  clock,
  clockId,
  clockSkew,
  format,
  signed,
  updateInterval,
  ...rest
}) => {
  const { running } = clock || {};
  const timestamp =
    Date.now() + (affectedByClockSkew && !isNil(clockSkew) ? clockSkew : 0);
  const ticks = clock ? getTickCountOnClockAt(clock, timestamp) : undefined;
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
  affectedByClockSkew: PropTypes.bool,
  clock: PropTypes.object,
  clockId: PropTypes.string,
  clockSkew: PropTypes.number,
  format: PropTypes.string,
  signed: PropTypes.bool,
  updateInterval: PropTypes.number,
};

LCDClockDisplayLabel.defaultProps = {
  format: 'HH:mm:ss',
};

export default connect(
  // mapStateToProps
  (state, ownProps) => {
    const clock = getClockById(state, ownProps.clockId);
    const signed = isClockSigned(clock);
    const affectedByClockSkew = isClockAffectedByClockSkew(clock);
    const updateInterval = getPreferredUpdateIntervalOfClock(clock);
    const clockSkew = getRoundedClockSkewInMilliseconds(state);
    return { affectedByClockSkew, clock, clockSkew, signed, updateInterval };
  },
  // mapDispatchToProps
  {}
)(LCDClockDisplayLabel);
