/**
 * @file Component that displays the status of Skybrush clocks.
 */

import PlayArrow from '@mui/icons-material/PlayArrow';
import Stop from '@mui/icons-material/Stop';
import Avatar from '@mui/material/Avatar';
import { green, red } from '@mui/material/colors';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import isNil from 'lodash-es/isNil';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { useHarmonicIntervalFn, useUpdate } from 'react-use';

import { listOf } from '~/components/helpers/lists';
import { getClocksWithUpdateIntervalsInOrder } from '~/features/clocks/selectors';
import {
  formatClockLabel,
  formatTicksOnClock,
  getTickCountOnClockAt,
} from '~/features/clocks/utils';

/**
 * Avatars for stopped and running clocks.
 */
const avatars = [
  <Avatar key='stop' style={{ backgroundColor: red.A700 }}>
    <Stop />
  </Avatar>,
  <Avatar key='play' style={{ backgroundColor: green[500] }}>
    <PlayArrow />
  </Avatar>,
];

/**
 * Presentation component for showing the state of a single Skybrush clock.
 */
const ClockDisplayListEntry = ({
  affectedByClockSkew = false,
  clock,
  clockSkew = 0,
  format = 'yyyy-MM-dd HH:mm:ss xx',
}) => {
  const { running, updateInterval } = clock;
  const avatar = avatars[running ? 1 : 0];
  const label = formatClockLabel(clock);
  const timestamp =
    Date.now() + (affectedByClockSkew && !isNil(clockSkew) ? clockSkew : 0);
  const ticks = getTickCountOnClockAt(clock, timestamp);
  const formattedTime = formatTicksOnClock(ticks, clock, { format });
  const update = useUpdate();

  useHarmonicIntervalFn(update, running ? updateInterval : null);

  return (
    <ListItem>
      <ListItemIcon>{avatar}</ListItemIcon>
      <ListItemText primary={formattedTime} secondary={label} />
    </ListItem>
  );
};

ClockDisplayListEntry.propTypes = {
  /**
   * Whether the clock is affected by the clock skew between the client and
   * the server we are connected to.
   */
  affectedByClockSkew: PropTypes.bool,

  clock: PropTypes.shape({
    /** The epoch time of the clock, i.e. the number of seconds since the
     * UNIX epoch when the tick count of the clock was zero. If this is
     * given, the clock display will show a regular date. If this is not
     * specified, the clock display will show the date in
     * hours:minutes:seconds:ticks format.
     */
    epoch: PropTypes.number,
    /** The identifier of the clock */
    id: PropTypes.string.isRequired,
    /**
     * The reference time in the local clock that corresponds to the tick
     * value stored in the 'ticks' property, expressed in the number of
     * seconds elapsed since the Unix epoch.
     */
    referenceTime: PropTypes.number.isRequired,
    /**
     * The current number of clock ticks that should be shown.
     */
    ticks: PropTypes.number.isRequired,
    /**
     * The number of clock ticks per second.
     */
    ticksPerSecond: PropTypes.number.isRequired,
    /** Whether the clock is running according to the Skybrush server */
    running: PropTypes.bool.isRequired,
    /**
     * The update interval of the clock display when it is running, expressed
     * in milliseconds. The clock display will be refreshed once in every
     * X milliseconds.
     */
    updateInterval: PropTypes.number.isRequired,
  }),

  /** The clock skew between ourselves and the server we are connected to, if known */
  clockSkew: PropTypes.number,

  /** The format to use for displaying the clock value */
  format: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
};

/**
 * Presentation component for showing the state of a set of clocks on the
 * server.
 *
 * @return  {Object}  the rendered clock display list component
 */
const ClockDisplayListPresentation = listOf(
  (clock) => <ClockDisplayListEntry key={clock.id} clock={clock} />,
  {
    dataProvider: 'clocks',
    displayName: 'ClockDisplayListPresentation',
    backgroundHint: 'No clocks',
  }
);

/**
 * Smart component for showing the state of the known clocks from the Redux
 * store.
 */
const ClockDisplayList = connect(
  // mapStateToProps
  (state) => ({
    clocks: getClocksWithUpdateIntervalsInOrder(state),
    dense: true,
  }),
  // mapDispatchToProps
  undefined
)(ClockDisplayListPresentation);

export default ClockDisplayList;
