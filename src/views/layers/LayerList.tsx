/**
 * @file Component that shows the list of layers on the current map.
 */

import AddCircleOutline from '@mui/icons-material/AddCircleOutline';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { connect } from 'react-redux';

import {
  selectableListOf,
  type SelectableListProps,
} from '~/components/helpers/lists';
import { showLayerSettingsDialog } from '~/features/map/layer-settings-dialog';
import { addLayer } from '~/features/map/layers';
import {
  iconForLayerType,
  labelForLayerType,
  type Layer,
} from '~/model/layers';
import { getLayersInTopmostFirstOrder } from '~/selectors/ordered';
import type { AppDispatch, RootState } from '~/store/reducers';

type LayerListProps = SelectableListProps<Layer> & {
  onNewItem: () => void;
};

/**
 * Presentation component for a list that shows the currently added
 * layers.
 */
const LayerListPresentation = selectableListOf<Layer, LayerListProps>(
  (layer: Layer, props) => {
    const icon = iconForLayerType(layer.type);
    return (
      <ListItem
        key={layer.id}
        disablePadding
        sx={layer.visible ? undefined : { opacity: 0.3 }}
      >
        <ListItemButton onClick={props.onItemSelected}>
          {icon && <ListItemIcon>{icon}</ListItemIcon>}
          <ListItemText
            primary={layer.label}
            secondary={labelForLayerType(layer.type)}
          />
        </ListItemButton>
      </ListItem>
    );
  },
  {
    dataProvider: 'layers',
    postprocess: (items, props) => [
      <ListItem key='__newItem__' disablePadding>
        <ListItemButton onClick={props.onNewItem}>
          <ListItemIcon>
            <AddCircleOutline />
          </ListItemIcon>
          <ListItemText primary='Add new layer' />
        </ListItemButton>
      </ListItem>,
      ...items,
    ],
  }
);

/**
 * Container for the layer list that binds it to the Redux store.
 */
const LayerList = connect(
  // mapStateToProps
  (state: RootState) => ({
    dense: true,
    layers: getLayersInTopmostFirstOrder(state),
  }),
  // mapDispatchToProps
  (dispatch: AppDispatch) => ({
    onChange(_event: unknown, layer: Layer) {
      dispatch(showLayerSettingsDialog(layer.id));
    },

    onNewItem() {
      const action = addLayer();
      dispatch(action);

      // The ID of the newly added layer is generated in the reducer, so we need to
      // get it from the action object after dispatching it. This is a bit hacky,
      // but it works because the action creator returns the action object with the
      // generated ID as a property.
      const addedId = (action as unknown as Record<string, string>)['id'];
      if (addedId) {
        dispatch(showLayerSettingsDialog(addedId));
      }
    },
  })
)(LayerListPresentation);

export default LayerList;
