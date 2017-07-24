/**
 * @file Component that shows the list of locations saved by the user.
 */

import Avatar from 'material-ui/Avatar'
import IconButton from 'material-ui/IconButton'
import { ListItem } from 'material-ui/List'

import MapsPlace from 'material-ui/svg-icons/maps/place'
import ContentAdd from 'material-ui/svg-icons/content/add-circle-outline'
import ActionSettings from 'material-ui/svg-icons/action/settings'

import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

import { editSavedLocation } from '../actions/saved-location-editor'
import { listOf } from './helpers/lists'

/**
 * Presentation component for a single entry in the location list.
 *
 * @param  {Object} props  the properties of the component
 * @return {Object} the React presentation component
 */
const LocationListEntry = (props) => {
  const { action, center: {lon, lat}, id, name, rotation, zoom } = props

  const actionButton = id === 0
          ? <IconButton onTouchTap={action}><ContentAdd /></IconButton>
          : <IconButton onTouchTap={action}><ActionSettings /></IconButton>

  const secondaryText = `lon: ${lon}, lat: ${lat}, rot: ${rotation}°, zoom: ${zoom}`

  return (
    <ListItem leftAvatar={<Avatar icon={<MapsPlace />} />}
      primaryText={name}
      secondaryText={secondaryText}
      rightIconButton={actionButton}
              />
  )
}

LocationListEntry.propTypes = {
  action: PropTypes.func.isRequired,
  center: PropTypes.object.isRequired,
  id: PropTypes.number.isRequired,
  name: PropTypes.string.isRequired,
  rotation: PropTypes.number.isRequired,
  zoom: PropTypes.number.isRequired
}

/**
 * Presentation component for the entire location list.
 */
export const LocationListPresentation = listOf((location, { onEditLocation }) => {
  return <LocationListEntry key={location.id}
    action={() => onEditLocation(location.id)} // TODO: avoid arrow function
    {...location} />
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
