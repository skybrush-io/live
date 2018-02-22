/**
 * @file Component that shows the list of features created by the user.
 */

import { ListItem, ListItemIcon, ListItemText } from 'material-ui/List'

import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import { listOf } from '../../components/helpers/lists'
import { getNameOfFeatureType, getIconOfFeatureType } from '../../model/features'
import { getFeaturesInOrder } from '../../selectors'

/**
 * Presentation component for a single entry in the feature list.
 *
 * @param  {Object} props  the properties of the component
 * @return {Object} the React presentation component
 */
const FeatureListEntry = (props) => {
  const { feature, onEditFeature } = props
  const { color, label, type } = feature
  return (
    <ListItem button onClick={onEditFeature}>
      <ListItemIcon style={{ color }}>
        {getIconOfFeatureType(type)}
     </ListItemIcon>
      { label
        ? <ListItemText primary={label} />
        : <ListItemText secondary={getNameOfFeatureType(type)} /> }
    </ListItem>
  )
}

FeatureListEntry.propTypes = {
  onEditFeature: PropTypes.func,
  feature: PropTypes.object.isRequired
}

/**
 * Presentation component for the entire feature list.
 */
/* eslint-disable: react/jsx-no-bind */
export const FeatureListPresentation = listOf((feature, { onEditFeature }) => {
  return <FeatureListEntry key={feature.id}
    onEditFeature={onEditFeature.bind(feature.id)}
    feature={feature} />
}, {
  dataProvider: 'features',
  backgroundHint: 'No features'
})
/* eslint-enable: react/jsx-no-bind */
FeatureListPresentation.displayName = 'FeatureListPresentation'

export default connect(
  // mapStateToProps
  state => ({
    dense: true,
    features: getFeaturesInOrder(state)
  }),
  // mapDispatchToProps
  dispatch => ({
    onEditFeature (id) {
      // dispatch(editSavedLocation(id))
    }
  })
)(FeatureListPresentation)
