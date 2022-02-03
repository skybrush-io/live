/**
 * @file Component that displays the status of the known docking stations.
 */

import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import Search from '@material-ui/icons/Search';
import Tooltip from '@skybrush/mui-components/lib/Tooltip';

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { multiSelectableListOf } from '~/components/helpers/lists';
import { setSelectedDockIds } from '~/features/docks/actions';
import { openDockDetailsDialog } from '~/features/docks/details';
import {
  getDocksInOrder,
  getSelectedDockIds,
} from '~/features/docks/selectors';
import { scrollToMapLocation } from '~/signals';

/**
 * Presentation component for the entire dock list.
 */
const DockListPresentation = multiSelectableListOf(
  (dock, props, selected) => {
    const rightIconButton = dock.position ? (
      <Tooltip content='Show on map'>
        <IconButton
          edge='end'
          onClick={() => scrollToMapLocation(dock.position)}
        >
          <Search />
        </IconButton>
      </Tooltip>
    ) : null;

    return (
      <ListItem
        key={dock.id}
        button
        className={selected ? 'selected-list-item' : undefined}
        onClick={props.onItemSelected}
      >
        <ListItemText primary={dock.id} />
        <ListItemSecondaryAction>{rightIconButton}</ListItemSecondaryAction>
      </ListItem>
    );
  },
  {
    backgroundHint: 'No docking stations',
    dataProvider: 'docks',
  }
);

/**
 * React component that shows the state of the known docks in a Skybrush
 * server.
 */
const DockList = ({
  onItemActivated,
  onSelectionChanged,
  selectedIds,
  ...rest
}) => (
  <Box display='flex' flexDirection='column' height='100%'>
    <Box height='100%' overflow='auto'>
      <DockListPresentation
        dense
        value={selectedIds || []}
        onActivate={onItemActivated}
        onChange={onSelectionChanged}
        {...rest}
      />
    </Box>
  </Box>
);

DockList.propTypes = {
  selectedIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  onItemActivated: PropTypes.func,
  onSelectionChanged: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    docks: getDocksInOrder(state),
    selectedIds: getSelectedDockIds(state),
  }),
  // mapDispatchToProps
  {
    onItemActivated: openDockDetailsDialog,
    onSelectionChanged: setSelectedDockIds,
  }
)(DockList);
