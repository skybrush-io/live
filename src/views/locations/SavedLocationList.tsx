/**
 * @file Component that shows the list of locations saved by the user.
 */

import Add from '@mui/icons-material/Add';
import Edit from '@mui/icons-material/Edit';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import type React from 'react';
import { Translation } from 'react-i18next';
import { connect } from 'react-redux';

import { listOf } from '~/components/helpers/lists';
import { TooltipWithContainerFromContext as Tooltip } from '~/containerContext';
import {
  createNewSavedLocation,
  editSavedLocation,
} from '~/features/saved-locations/actions';
import { getSavedLocationsInOrder } from '~/features/saved-locations/selectors';
import type { SavedLocation } from '~/features/saved-locations/types';
import { scrollToMapLocation } from '~/signals';
import type { AppDispatch, RootState } from '~/store/reducers';
import type { Identifier } from '~/utils/collections';

type LocationListEntryProps = {
  location: SavedLocation;
  onEditItem?: (id: Identifier) => void;
};

/**
 * Presentation component for a single entry in the location list.
 */
const LocationListEntry = ({
  location,
  onEditItem,
}: LocationListEntryProps) => {
  const { id, name } = location;

  const editLocation = () => onEditItem?.(id);
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
    <ListItem disablePadding secondaryAction={actionButton}>
      <ListItemButton onClick={scrollToLocation}>
        <ListItemText primary={name} />
      </ListItemButton>
    </ListItem>
  );
};

type CreateNewItemEntryProps = {
  onNewItem?: () => void;
};

/**
 * Creates the "add new layer" item for the layer list.
 */
const createNewItemEntry = ({ onNewItem }: CreateNewItemEntryProps) => (
  <ListItem
    key='__addNew__'
    disablePadding
    secondaryAction={
      <IconButton edge='end' size='large' onClick={onNewItem}>
        <Add />
      </IconButton>
    }
  >
    <ListItemButton onClick={onNewItem}>
      <Translation>
        {(t) => <ListItemText primary={t('savedLocation.addNew')} />}
      </Translation>
    </ListItemButton>
  </ListItem>
);

type LocationListPresentationProps = {
  dense?: boolean;
  onEditItem?: (id: Identifier) => void;
  onNewItem?: () => void;
} & React.RefAttributes<HTMLUListElement>;

/**
 * Presentation component for the entire location list.
 */
export const LocationListPresentation = listOf<
  SavedLocation,
  LocationListPresentationProps
>(
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
  (state: RootState) => ({
    dense: true,
    savedLocations: getSavedLocationsInOrder(state),
  }),
  // mapDispatchToProps
  (dispatch: AppDispatch) => ({
    onEditItem(id: Identifier) {
      dispatch(editSavedLocation(id));
    },

    onNewItem() {
      // NOTE: Cast justified as the reducer attaches the ID of the newly
      // created item to the action object, but the automatically inferred
      // type of the action creator does not include it.
      const action = createNewSavedLocation() as ReturnType<
        typeof createNewSavedLocation
      > & { id?: Identifier };
      dispatch(action);
      if (action.id) {
        dispatch(editSavedLocation(action.id));
      }
    },
  })
)(LocationListPresentation);

export default LocationList;
