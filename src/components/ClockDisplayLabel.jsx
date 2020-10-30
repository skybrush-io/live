import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { useHarmonicIntervalFn, useUpdate } from 'react-use';

import { getClockById } from '~/features/clocks/selectors';
import {
  formatTicksOnClock,
  getCurrentTickCountOnClock,
  getPreferredUpdateIntervalOfClock,
  isClockSigned,
} from '~/features/clocks/utils';

const ClockDisplayLabel = ({
  clock,
  clockId,
  emptyText,
  format,
  signed,
  updateInterval,
  ...rest
}) => {
  const { running } = clock || {};
  const ticks = clock ? getCurrentTickCountOnClock(clock) : undefined;
  let formattedTime =
    ticks === undefined
      ? emptyText
      : formatTicksOnClock(ticks, clock, { format });
  const update = useUpdate();
  useHarmonicIntervalFn(update, running ? updateInterval : null);

  return <span {...rest}>{formattedTime}</span>;
};

ClockDisplayLabel.propTypes = {
  clock: PropTypes.object,
  clockId: PropTypes.string,
  emptyText: PropTypes.string,
  format: PropTypes.string,
  signed: PropTypes.bool,
  updateInterval: PropTypes.number,
};

ClockDisplayLabel.defaultProps = {
  format: 'HH:mm:ss',
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
  {}
)(ClockDisplayLabel);
