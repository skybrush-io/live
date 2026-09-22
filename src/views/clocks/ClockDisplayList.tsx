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
import type React from 'react';
import { connect } from 'react-redux';
import { useHarmonicIntervalFn, useUpdate } from 'react-use';

import { listOf } from '~/components/helpers/lists';
import { getClocksWithUpdateIntervalsInOrder } from '~/features/clocks/selectors';
import type { ClockWithUpdateInterval } from '~/features/clocks/types';
import {
  formatClockLabel,
  formatTicksOnClock,
  getTickCountOnClockAt,
} from '~/features/clocks/utils';
import type { RootState } from '~/store/reducers';

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

type ClockDisplayListEntryProps = {
  /**
   * Whether the clock is affected by the clock skew between the client and
   * the server we are connected to.
   */
  affectedByClockSkew?: boolean;

  clock: ClockWithUpdateInterval;

  /** The clock skew between ourselves and the server we are connected to, if known */
  clockSkew?: number;

  /** The format to use for displaying the clock value */
  format?: string;
};

/**
 * Presentation component for showing the state of a single Skybrush clock.
 */
const ClockDisplayListEntry = ({
  affectedByClockSkew = false,
  clock,
  clockSkew = 0,
  format = 'yyyy-MM-dd HH:mm:ss xx',
}: ClockDisplayListEntryProps) => {
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

type ClockDisplayListPresentationProps = {
  dense?: boolean;
} & React.RefAttributes<HTMLUListElement>;

/**
 * Presentation component for showing the state of a set of clocks on the
 * server.
 */
const ClockDisplayListPresentation = listOf<
  ClockWithUpdateInterval,
  ClockDisplayListPresentationProps
>((clock) => <ClockDisplayListEntry key={clock.id} clock={clock} />, {
  dataProvider: 'clocks',
  displayName: 'ClockDisplayListPresentation',
  backgroundHint: 'No clocks',
});

/**
 * Smart component for showing the state of the known clocks from the Redux
 * store.
 */
const ClockDisplayList = connect(
  // mapStateToProps
  (state: RootState) => ({
    clocks: getClocksWithUpdateIntervalsInOrder(state),
    dense: true,
  }),
  // mapDispatchToProps
  undefined
)(ClockDisplayListPresentation);

export default ClockDisplayList;
