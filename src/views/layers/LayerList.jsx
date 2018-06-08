/**
 * @file Component that shows the list of layers on the current map.
 */

import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'
import { createSelector } from 'reselect'

import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import AddCircleOutline from '@material-ui/icons/AddCircleOutline'

import { addLayer, showLayersDialog } from '../../actions/layers'
import { selectableListOf } from '../../components/helpers/lists'
import { labelForLayerType, iconForLayerType } from '../../model/layers'
import { getLayersInOrder } from '../../selectors/ordered'

/**
 * Creates a single list item for the layer list.
 *
 * @param  {Object} layer  the layer for which the item will be created
 * @param  {Object} props  the props of the list in which this item will be placed
 * @return {React.Node}  the rendered list item
 */
function createListItemForLayer (layer, props) {
  return (
    /* eslint-disable react/prop-types */
    <ListItem button key={layer.id} onClick={props.onItemSelected}
      style={layer.visible ? undefined : { opacity: 0.3 }}>
      {iconForLayerType(layer.type)}
      <ListItemText primary={layer.label} secondary={labelForLayerType(layer.type)} />
    </ListItem>
    /* eslint-enable react/prop-types */
  )
}

/**
 * Creates the "add new layer" item for the layer list.
 *
 * @param  {Object} props  the props of the list in which this item will be placed
 * @return {React.Node}  the rendered list item
 */
function createNewItemEntry (props) {
  /* eslint-disable react/prop-types */
  return (
    <ListItem button key='__addNew__' onClick={props.onNewItem}>
      <AddCircleOutline />
      <ListItemText primary='Add new layer' />
    </ListItem>
  )
  /* eslint-enable react/prop-types */
}

/**
 * Selector that adds an extra "add new" item before the list of layers.
 */
const getLayersInOrderWithExtraItem = createSelector(
  getLayersInOrder,
  layers => layers.concat('__addNew__').reverse()
)

/**
 * Presentation component for a list that shows the currently added
 * layers.
 */
const LayerListPresentation = selectableListOf(
  (layer, props) => (
    layer === '__addNew__'
      ? createNewItemEntry(props)
      : createListItemForLayer(layer, props)
  ),
  {
    backgroundHint: 'No layers',
    dataProvider: 'layers',
    /* eslint-disable react/display-name */
    listFactory: (props, children) => (
      <List dense>
        {children}
      </List>
    )
    /* eslint-enable react/display-name */
  }
)

LayerListPresentation.propTypes = {
  onChange: PropTypes.func,
  onNewItem: PropTypes.func,
  layers: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.object, PropTypes.string])
  ).isRequired
}

/**
 * Container for the layer list that binds it to the Redux store.
 */
const LayerList = connect(
  // mapStateToProps
  state => {
    return {
      layers: getLayersInOrderWithExtraItem(state)
    }
  },
  // mapDispatchToProps
  dispatch => ({
    onChange (event, layerId) {
      dispatch(showLayersDialog(layerId))
    },

    onNewItem () {
      const action = addLayer()
      dispatch(action)
      if (action.layerId) {
        dispatch(showLayersDialog(action.layerId))
      }
    }
  })
)(LayerListPresentation)

export default LayerList
