/**
 * @file Component that shows the list of locations saved by the user.
 */

import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';

import ActionSettings from '@material-ui/icons/Settings';

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { createNewSavedLocation } from '~/actions/saved-locations';
import { editSavedLocation } from '~/actions/saved-location-editor';
import { listOf } from '~/components/helpers/lists';
import { getSavedLocationsInOrder } from '~/selectors/ordered';
import { scrollToMapLocation } from '~/signals';

/**
 * Presentation component for a single entry in the location list.
 *
 * @param  {Object} props  the properties of the component
 * @return {Object} the React presentation component
 */
const LocationListEntry = props => {
  const { location, onEditItem } = props;
  const { id, name } = location;

  const editLocation = () => onEditItem(id);
  const scrollToLocation = () => scrollToMapLocation(location);

  const actionButton = (
    <IconButton onClick={editLocation}>
      <ActionSettings />
    </IconButton>
  );

  return (
    <ListItem button onClick={scrollToLocation}>
      <ListItemText primary={name} />
      <ListItemSecondaryAction>{actionButton}</ListItemSecondaryAction>
    </ListItem>
  );
};

LocationListEntry.propTypes = {
  onEditItem: PropTypes.func.isRequired,
  location: PropTypes.object.isRequired
};

/**
 * Creates the "add new layer" item for the layer list.
 *
 * @param  {Object} props  the props of the list in which this item will be placed
 * @return {React.Node}  the rendered list item
 */
function createNewItemEntry(props) {
  /* eslint-disable react/prop-types */
  return (
    <ListItem key="__addNew__" button onClick={props.onNewItem}>
      <ListItemText primary="Add new location" />
    </ListItem>
  );
  /* eslint-enable react/prop-types */
}

/**
 * Presentation component for the entire location list.
 */
export const LocationListPresentation = listOf(
  (location, props) => (
    <LocationListEntry
      key={location.id}
      location={location}
      onEditItem={props.onEditItem}
    />
  ),
  {
    dataProvider: 'savedLocations',
    backgroundHint: 'No saved locations',
    postprocess: (items, props) => [createNewItemEntry(props), ...items]
  }
);
LocationListPresentation.displayName = 'LocationListPresentation';

const LocationList = connect(
  // mapStateToProps
  state => ({
    dense: true,
    savedLocations: getSavedLocationsInOrder(state)
  }),
  // mapDispatchToProps
  dispatch => ({
    onEditItem(id) {
      dispatch(editSavedLocation(id));
    },

    onNewItem() {
      const action = createNewSavedLocation();
      dispatch(action);
      if (action.id) {
        dispatch(editSavedLocation(action.id));
      }
    }
  })
)(LocationListPresentation);

export default LocationList;
