import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import Card from '@material-ui/core/Card'
import CardHeader from '@material-ui/core/CardHeader'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'

import { changeLayerType } from '../../../actions/layers'
import { LayerTypes, iconForLayerType, labelForLayerType } from '../../../model/layers'

// === Settings for this particular layer type ===

/* eslint-disable react/jsx-no-bind */
const UntypedLayerSettingsPresentation = ({ onLayerTypeSelected }) => {
  const items = LayerTypes.map(layerType => (
    <Grid item xs={8} sm={4} key={layerType}>
      <Card className="no-select" onClick={() => onLayerTypeSelected(layerType)}>
        <CardHeader avatar={iconForLayerType(layerType)}
          title={labelForLayerType(layerType)} />
      </Card>
    </Grid>
  ))
  return (
    <div>
      <Typography variant="subheading" component="p" gutterBottom>Pick a layer type</Typography>
      <Grid container>
        {items}
      </Grid>
    </div>
  )
}
/* eslint-enable react/jsx-no-bind */

UntypedLayerSettingsPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string,

  onLayerTypeSelected: PropTypes.func
}

export const UntypedLayerSettings = connect(
  // mapStateToProps
  (state, ownProps) => ({}),
  // mapDispatchToProps
  (dispatch, ownProps) => ({
    onLayerTypeSelected: value => {
      dispatch(changeLayerType(ownProps.layerId, value))
    }
  })
)(UntypedLayerSettingsPresentation)

// === The actual layer to be rendered ===

class UntypedLayerPresentation extends React.Component {
  render () {
    return false
  }
}

UntypedLayerPresentation.propTypes = {}

export const UntypedLayer = connect(
  // mapStateToProps
  (state, ownProps) => ({}),
  // mapDispatchToProps
  (dispatch, ownProps) => ({})
)(UntypedLayerPresentation)
