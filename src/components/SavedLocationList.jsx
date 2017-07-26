/**
 * @file Component that shows the list of locations saved by the user.
 */

import Avatar from 'material-ui/Avatar'
import IconButton from 'material-ui/IconButton'
import { ListItem } from 'material-ui/List'

import MapsAddLocation from 'material-ui/svg-icons/maps/add-location'
import MapsPlace from 'material-ui/svg-icons/maps/place'
import ContentAdd from 'material-ui/svg-icons/content/add-circle-outline'
import ActionSettings from 'material-ui/svg-icons/action/settings'

import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

import { editSavedLocation } from '../actions/saved-location-editor'
import { listOf } from './helpers/lists'

import { mapViewToLocationSignal } from '../signals'

/**
 * Presentation component for a single entry in the location list.
 *
 * @param  {Object} props  the properties of the component
 * @return {Object} the React presentation component
 */
const LocationListEntry = (props) => {
  const { action, jumpToLocation, location } = props
  const { center: {lon, lat}, id, name, rotation, zoom } = location

  const avatar = id === 0
    ? <Avatar icon={<MapsAddLocation />} />
    : <Avatar icon={<MapsPlace />} />

  const secondaryText = `lon: ${lon}, lat: ${lat}, rot: ${rotation}°, zoom: ${zoom}`

  const actionButton = id === 0
    ? <IconButton onTouchTap={action}><ContentAdd /></IconButton>
    : <IconButton onTouchTap={action}><ActionSettings /></IconButton>

  const touchTapAction = id === 0 ? action : jumpToLocation

  return (
    <ListItem leftAvatar={avatar}
      primaryText={name}
      secondaryText={secondaryText}
      rightIconButton={actionButton}
      onTouchTap={touchTapAction}
    />
  )
}

LocationListEntry.propTypes = {
  action: PropTypes.func.isRequired,
  jumpToLocation: PropTypes.func.isRequired,
  location: PropTypes.object.isRequired
}

/**
 * Presentation component for the entire location list.
 */
export const LocationListPresentation = listOf((location, { onEditLocation }) => {
  return <LocationListEntry key={location.id}
    // TODO: avoid arrow functions
    action={() => onEditLocation(location.id)}
    jumpToLocation={() => mapViewToLocationSignal.dispatch(location)}
    location={location} />
}, {
  dataProvider: 'savedLocations',
  backgroundHint: 'No saved locations'
})
LocationListPresentation.displayName = 'LocationListPresentation'

const LocationList = connect(
  // mapStateToProps
  state => ({
    savedLocations: state.savedLocations.items
  }),
  // mapDispatchToProps
  dispatch => ({
    onEditLocation (id) {
      dispatch(editSavedLocation(id))
    }
  })
)(LocationListPresentation)

export default LocationList
