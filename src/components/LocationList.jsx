/**
 * @file Component that shows the list of locations that the user has created
 * in the web client.
 */

import { ListItem } from 'material-ui/List'

import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

import { listOf } from './helpers/lists'

/**
 * Presentation component for a single entry in the location list.
 *
 * @param  {Object} props  the properties of the component
 * @return {Object} the React presentation component
 */
const LocationListEntry = (props) => {
  const { name, center, rotation } = props
  const secondaryText = `${rotation || 0}°`
  return (
    <ListItem primaryText={name} secondaryText={secondaryText} />
  )
}

LocationListEntry.propTypes = {
  name: PropTypes.string.isRequired,
  rotation: PropTypes.number,
  center: PropTypes.array,
}

/**
 * Presentation component for the entire connection list.
 */
export const LocationListPresentation = listOf(location => {
  return <LocationListEntry key={location.id} {...location} />
}, {
  dataProvider: 'locations',
  backgroundHint: 'No saved locations'
})
LocationListPresentation.displayName = 'LocationListPresentation'

const LocationList = connect(
  // mapStateToProps
  state => ({
    locations: state.locations.order.map(
      id => state.locations.byId[id]
    )
  }),
  // mapDispatchToProps
  dispatch => ({
  })
)(LocationListPresentation)

export default LocationList
