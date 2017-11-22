/**
 * @file Component that shows the list of locations saved by the user.
 */

import Avatar from 'material-ui/Avatar'
import IconButton from 'material-ui/IconButton'
import { ListItem, ListItemSecondaryAction, ListItemText } from 'material-ui/List'

import MapsAddLocation from 'material-ui-icons/AddLocation'
import MapsPlace from 'material-ui-icons/Place'
import ContentAdd from 'material-ui-icons/AddCircleOutline'
import ActionSettings from 'material-ui-icons/Settings'

import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import { editSavedLocation } from '../actions/saved-location-editor'
import { listOf } from './helpers/lists'

import { getSavedLocationsInOrder } from '../selectors'
import { mapViewToLocationSignal } from '../signals'

/**
 * Presentation component for a single entry in the location list.
 *
 * @param  {Object} props  the properties of the component
 * @return {Object} the React presentation component
 */
const LocationListEntry = (props) => {
  const { location, onEditLocation } = props
  const { center: {lon, lat}, id, name, rotation, zoom } = location

  const avatar = id === 'addNew'
    ? <Avatar icon={<MapsAddLocation />} />
    : <Avatar icon={<MapsPlace />} />

  const secondaryText = `lon: ${lon}, lat: ${lat}, rot: ${rotation}°, zoom: ${zoom}`

  const editLocation = () => onEditLocation(location.id)
  const mapViewToLocation = () => mapViewToLocationSignal.dispatch(location)

  const actionButton = (
    <IconButton
      onClick={editLocation}>
      {id === 'addNew' ? <ContentAdd /> : <ActionSettings />}
    </IconButton>
  )

  const onClick = id === 'addNew' ? editLocation : mapViewToLocation

  return (
    <ListItem onClick={onClick}>
      {avatar}
      <ListItemText primary={name} secondary={secondaryText} />
      <ListItemSecondaryAction>{actionButton}</ListItemSecondaryAction>
    </ListItem>
  )
}

LocationListEntry.propTypes = {
  onEditLocation: PropTypes.func.isRequired,
  location: PropTypes.object.isRequired
}

/**
 * Presentation component for the entire location list.
 */
export const LocationListPresentation = listOf((location, { onEditLocation }) => {
  return <LocationListEntry key={location.id}
    onEditLocation={onEditLocation}
    location={location} />
}, {
  dataProvider: 'savedLocations',
  backgroundHint: 'No saved locations'
})
LocationListPresentation.displayName = 'LocationListPresentation'

const LocationList = connect(
  // mapStateToProps
  state => ({
    savedLocations: getSavedLocationsInOrder(state)
  }),
  // mapDispatchToProps
  dispatch => ({
    onEditLocation (id) {
      dispatch(editSavedLocation(id))
    }
  })
)(LocationListPresentation)

export default LocationList
