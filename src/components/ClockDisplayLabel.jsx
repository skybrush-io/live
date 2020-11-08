import isNil from 'lodash-es/isNil';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { useHarmonicIntervalFn, useUpdate } from 'react-use';

import { getClockById } from '~/features/clocks/selectors';
import {
  formatTicksOnClock,
  getTickCountOnClockAt,
  getPreferredUpdateIntervalOfClock,
  isClockAffectedByClockSkew,
  isClockSigned,
} from '~/features/clocks/utils';
import { getRoundedClockSkewInMilliseconds } from '~/features/servers/selectors';

const ClockDisplayLabel = ({
  affectedByClockSkew,
  clock,
  clockId,
  clockSkew,
  emptyText,
  format,
  signed,
  updateInterval,
  ...rest
}) => {
  const { running } = clock || {};
  const timestamp =
    Date.now() + (affectedByClockSkew && !isNil(clockSkew) ? clockSkew : 0);
  const ticks = clock ? getTickCountOnClockAt(clock, timestamp) : undefined;
  const formattedTime =
    ticks === undefined
      ? emptyText
      : formatTicksOnClock(ticks, clock, { format });
  const update = useUpdate();
  useHarmonicIntervalFn(update, running ? updateInterval : null);

  return <span {...rest}>{formattedTime}</span>;
};

ClockDisplayLabel.propTypes = {
  affectedByClockSkew: PropTypes.bool,
  clock: PropTypes.object,
  clockId: PropTypes.string,
  clockSkew: PropTypes.number,
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
    const affectedByClockSkew = isClockAffectedByClockSkew(clock);
    const updateInterval = getPreferredUpdateIntervalOfClock(clock);
    const clockSkew = getRoundedClockSkewInMilliseconds(state);
    return { affectedByClockSkew, clock, clockSkew, signed, updateInterval };
  },
  // mapDispatchToProps
  {}
)(ClockDisplayLabel);
