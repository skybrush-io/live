/**
 * @file Component that displays the status of the known docking stations.
 */

import Search from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import ListItemText from '@mui/material/ListItemText';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import StatusLight from '@skybrush/mui-components/lib/StatusLight';
import Tooltip from '@skybrush/mui-components/lib/Tooltip';

import { multiSelectableListOf } from '~/components/helpers/lists';
import { setSelectedBeaconIds } from '~/features/beacons/actions';
import {
  getBeaconDisplayName,
  getBeaconsInOrder,
  getSelectedBeaconIds,
} from '~/features/beacons/selectors';
import { scrollToMapLocation } from '~/signals';

/**
 * Presentation component for the entire dock list.
 */
const BeaconListPresentation = multiSelectableListOf(
  (beacon, props, selected) => {
    const rightIconButton = beacon.position ? (
      <Tooltip content='Show on map'>
        <IconButton
          edge='end'
          size='large'
          onClick={() => scrollToMapLocation(beacon.position)}
        >
          <Search />
        </IconButton>
      </Tooltip>
    ) : null;

    return (
      <ListItemButton
        key={beacon.id}
        className={selected ? 'selected-list-item' : undefined}
        onClick={props.onItemSelected}
      >
        <StatusLight status={beacon.active ? 'success' : 'error'} />
        <ListItemText primary={getBeaconDisplayName(beacon)} />
        <ListItemSecondaryAction>{rightIconButton}</ListItemSecondaryAction>
      </ListItemButton>
    );
  },
  {
    backgroundHint: 'No beacons',
    dataProvider: 'beacons',
  }
);

/**
 * React component that shows the state of the known beacons in a Skybrush
 * server.
 */
const BeaconList = ({
  onItemActivated,
  onSelectionChanged,
  selectedIds,
  ...rest
}) => (
  <Box display='flex' flexDirection='column' height='100%'>
    <Box height='100%' overflow='auto'>
      <BeaconListPresentation
        dense
        value={selectedIds || []}
        onActivate={onItemActivated}
        onChange={onSelectionChanged}
        {...rest}
      />
    </Box>
  </Box>
);

BeaconList.propTypes = {
  selectedIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  onItemActivated: PropTypes.func,
  onSelectionChanged: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    beacons: getBeaconsInOrder(state),
    selectedIds: getSelectedBeaconIds(state),
  }),
  // mapDispatchToProps
  {
    // onItemActivated: openDockDetailsDialog,
    onSelectionChanged: setSelectedBeaconIds,
  }
)(BeaconList);
