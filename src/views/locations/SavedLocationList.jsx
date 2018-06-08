/**
 * @file Component that shows the list of locations saved by the user.
 */

import IconButton from '@material-ui/core/IconButton'
import ListItem from '@material-ui/core/ListItem'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction'
import ListItemText from '@material-ui/core/ListItemText'

import AddCircleOutline from '@material-ui/icons/AddCircleOutline'
import ActionSettings from '@material-ui/icons/Settings'

import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import { editSavedLocation } from '../../actions/saved-location-editor'
import { listOf } from '../../components/helpers/lists'
import { getSavedLocationsInOrder } from '../../selectors/ordered'
import { mapViewToLocationSignal } from '../../signals'
import { formatCoordinate } from '../../utils/geography'

/**
 * Presentation component for a single entry in the location list.
 *
 * @param  {Object} props  the properties of the component
 * @return {Object} the React presentation component
 */
const LocationListEntry = (props) => {
  const { location, onEditLocation } = props
  const { center: { lat, lon }, id, name, rotation } = location
  const secondaryText = `${formatCoordinate([lon, lat])}, ${rotation}°`

  const editLocation = () => onEditLocation(location.id)
  const mapViewToLocation = () => mapViewToLocationSignal.dispatch(location)

  const actionButton = (
    <IconButton onClick={editLocation}>
      {id === 'addNew' ? <AddCircleOutline /> : <ActionSettings />}
    </IconButton>
  )

  const onClick = id === 'addNew' ? editLocation : mapViewToLocation

  return (
    <ListItem button onClick={onClick}>
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
    dense: true,
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
