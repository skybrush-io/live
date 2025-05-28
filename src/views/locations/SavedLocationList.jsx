/**
 * @file Component that shows the list of locations saved by the user.
 */

import Add from '@mui/icons-material/Add';
import Edit from '@mui/icons-material/Edit';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import ListItemText from '@mui/material/ListItemText';
import PropTypes from 'prop-types';
import React from 'react';
import { Translation } from 'react-i18next';
import { connect } from 'react-redux';

import { listOf } from '~/components/helpers/lists';
import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
import {
  createNewSavedLocation,
  editSavedLocation,
} from '~/features/saved-locations/actions';
import { getSavedLocationsInOrder } from '~/features/saved-locations/selectors';
import { scrollToMapLocation } from '~/signals';

/**
 * Presentation component for a single entry in the location list.
 *
 * @param  {Object} props  the properties of the component
 * @return {Object} the React presentation component
 */
const LocationListEntry = (props) => {
  const { location, onEditItem } = props;
  const { id, name } = location;

  const editLocation = () => onEditItem(id);
  const scrollToLocation = () =>
    scrollToMapLocation(location.center, {
      rotation: location.rotation,
      zoom: location.zoom,
    });

  const actionButton = (
    <Translation>
      {(t) => (
        <Tooltip content={t('savedLocation.edit')}>
          <IconButton edge='end' size='large' onClick={editLocation}>
            <Edit />
          </IconButton>
        </Tooltip>
      )}
    </Translation>
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
  location: PropTypes.object.isRequired,
};

/**
 * Creates the "add new layer" item for the layer list.
 *
 * @param  {Object} props  the props of the list in which this item will be placed
 * @return {React.Node}  the rendered list item
 */
const createNewItemEntry = (props) => (
  <ListItem key='__addNew__' button onClick={props.onNewItem}>
    <Translation>
      {(t) => <ListItemText primary={t('savedLocation.addNew')} />}
    </Translation>
    <ListItemSecondaryAction>
      <IconButton edge='end' size='large' onClick={props.onNewItem}>
        <Add />
      </IconButton>
    </ListItemSecondaryAction>
  </ListItem>
);

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
    backgroundHint: 'No saved locations',
    dataProvider: 'savedLocations',
    displayName: 'LocationListPresentation',
    postprocess: (items, props) => [createNewItemEntry(props), ...items],
  }
);

const LocationList = connect(
  // mapStateToProps
  (state) => ({
    dense: true,
    savedLocations: getSavedLocationsInOrder(state),
  }),
  // mapDispatchToProps
  (dispatch) => ({
    onEditItem(id) {
      dispatch(editSavedLocation(id));
    },

    onNewItem() {
      const action = createNewSavedLocation();
      dispatch(action);
      if (action.id) {
        dispatch(editSavedLocation(action.id));
      }
    },
  })
)(LocationListPresentation);

export default LocationList;
