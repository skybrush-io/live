import isNil from 'lodash-es/isNil';
import { connect } from 'react-redux';
import { useHarmonicIntervalFn, useUpdate } from 'react-use';

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

import LCDText, { type LCDTextProps } from './LCDText';

type OwnProps = {
  clockId?: string;
  format?: string;
};

type StateProps = {
  affectedByClockSkew: boolean;
  clock?: Clock;
  clockSkew: number | undefined;
  signed: boolean;
  updateInterval: number;
};

type Props = LCDTextProps & OwnProps & StateProps;

const LCDClockDisplayLabel = ({
  affectedByClockSkew,
  clock,
  clockId,
  clockSkew,
  format = 'HH:mm:ss',
  signed,
  updateInterval,
  ...rest
}: Props) => {
  const { running } = clock || {};
  const timestamp =
    Date.now() + (affectedByClockSkew && !isNil(clockSkew) ? clockSkew : 0);
  const update = useUpdate();

  let formattedTime = '--:--:--';
  if (clock) {
    const ticks = getTickCountOnClockAt(clock, timestamp);
    formattedTime = formatTicksOnClock(ticks, clock, { format });
  }

  if (signed && formattedTime.charAt(0) !== '-') {
    // '!' is the all-off character in the 14-segment display font
    formattedTime = '!' + formattedTime;
  }

  useHarmonicIntervalFn(update, running ? updateInterval : null);

  return <LCDText {...rest}>{formattedTime}</LCDText>;
};

export default connect(
  // mapStateToProps
  (state: RootState, ownProps: OwnProps): StateProps => {
    const clock = ownProps.clockId
      ? getClockById(state, ownProps.clockId)
      : undefined;
    const signed = isClockSigned(clock);
    const affectedByClockSkew = isClockAffectedByClockSkew(clock);
    const updateInterval = getPreferredUpdateIntervalOfClock(clock);
    const clockSkew = getRoundedClockSkewInMilliseconds(state);
    return { affectedByClockSkew, clock, clockSkew, signed, updateInterval };
  },
  // mapDispatchToProps
  {}
)(LCDClockDisplayLabel);
