import _ from 'lodash'
import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import { FormControlLabel } from 'material-ui/Form'
import Radio, { RadioGroup } from 'material-ui/Radio'

import { changeLayerType } from '../../../actions/layers'
import { LayerTypes, labelForLayerType } from '../../../model/layers'

// === Settings for this particular layer type ===

class UntypedLayerSettingsPresentation extends React.Component {
  render () {
    const layerTypeRadioButtons = _.map(LayerTypes, layerType => (
      <FormControlLabel value={layerType} key={layerType}
        label={labelForLayerType(layerType)}
        style={{ marginTop: 5 }} control={<Radio />} />
    ))
    return (
      <div>
        <p key='header'>This layer has no type yet. Please select a layer
        type from the following options:</p>
        <RadioGroup name='types.untyped' key='baseProperties'
          onChange={this.props.onLayerTypeChanged}>
          {layerTypeRadioButtons}
        </RadioGroup>
      </div>
    )
  }
}

UntypedLayerSettingsPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string,

  onLayerTypeChanged: PropTypes.func
}

export const UntypedLayerSettings = connect(
  // mapStateToProps
  (state, ownProps) => ({}),
  // mapDispatchToProps
  (dispatch, ownProps) => ({
    onLayerTypeChanged: (event, value) => {
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
