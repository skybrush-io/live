import isNil from 'lodash-es/isNil';
import { useCallback, useState, type HTMLAttributes } from 'react';
import { connect } from 'react-redux';
import { useHarmonicIntervalFn } from 'react-use';

import { getClockById } from '~/features/clocks/selectors';
import type { Clock } from '~/features/clocks/types';
import {
  formatTicksOnClock,
  getPreferredUpdateIntervalOfClock,
  getTickCountOnClockAt,
  isClockAffectedByClockSkew,
  isClockSigned,
} from '~/features/clocks/utils';
import { getRoundedClockSkewInMilliseconds } from '~/features/servers/selectors';
import type { RootState } from '~/store/reducers';

type Props = {
  affectedByClockSkew: boolean;
  clock: Clock;
  clockId: string;
  clockSkew?: number;
  emptyText: string;
  format?: string;
  signed: boolean;
  updateInterval: number;
} & HTMLAttributes<HTMLSpanElement>;

const ClockDisplayLabel = ({
  affectedByClockSkew,
  clock,
  clockId,
  clockSkew,
  emptyText,
  format = 'HH:mm:ss',
  signed,
  updateInterval,
  ...rest
}: Props) => {
  const { running } = clock || {};
  const [timestamp, setTimestamp] = useState(
    () =>
      Date.now() + (affectedByClockSkew && !isNil(clockSkew) ? clockSkew : 0)
  );
  const ticks = clock ? getTickCountOnClockAt(clock, timestamp) : undefined;
  const formattedTime =
    ticks === undefined
      ? emptyText
      : formatTicksOnClock(ticks, clock, { format });
  const update = useCallback(() => {
    setTimestamp(
      Date.now() + (affectedByClockSkew && !isNil(clockSkew) ? clockSkew : 0)
    );
  }, [clockSkew, affectedByClockSkew]);
  useHarmonicIntervalFn(update, running ? updateInterval : null);

  return <span {...rest}>{formattedTime}</span>;
};

export default connect(
  // mapStateToProps
  (state: RootState, ownProps: { clockId: string }) => {
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
