/**
 * @file Component that displays the status of the known docking stations.
 */

import React from 'react';
import { connect } from 'react-redux';

import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import StatusLight from '@skybrush/mui-components/lib/StatusLight';

import { listOf } from '~/components/helpers/lists';
import { openLPSDetailsDialog } from '~/features/lps/details';
import {
  getLocalPositioningSystemDisplayName,
  getLocalPositioningSystemStatus,
  getLocalPositioningSystemsInOrder,
} from '~/features/lps/selectors';

/**
 * React component that shows the state of the known local positioning
 * systems in a Skybrush server.
 */
const LPSList = listOf(
  (lps, props) => {
    /*
    const rightIconButton = beacon.position ? (
      <Tooltip content='Show on map'>
        <IconButton
          edge='end'
          onClick={() => scrollToMapLocation(beacon.position)}
        >
          <Search />
        </IconButton>
      </Tooltip>
    ) : null;
    */

    return (
      <ListItem key={lps.id} button onClick={() => props.onActivate(lps.id)}>
        <StatusLight status={getLocalPositioningSystemStatus(lps)} />
        <ListItemText primary={getLocalPositioningSystemDisplayName(lps)} />
      </ListItem>
    );
  },
  {
    backgroundHint: 'No local positioning systems',
    dataProvider: 'items',
  }
);

export default connect(
  // mapStateToProps
  (state) => ({
    dense: true,
    items: getLocalPositioningSystemsInOrder(state),
  }),
  // mapDispatchToProps
  {
    onActivate: openLPSDetailsDialog,
  }
)(LPSList);
