import _ from 'lodash'
import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

import { LayerTypes, labelForLayerType } from '../../../model/layers'
import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton'

import { changeLayerType } from '../../../actions/layers'

// === Settings for this particular layer type ===

class UntypedLayerSettingsPresentation extends React.Component {
  render () {
    const layerTypeRadioButtons = _.map(LayerTypes, layerType => (
      <RadioButton value={layerType} key={layerType}
        label={labelForLayerType(layerType)}
        style={{ marginTop: 5 }} />
    ))
    return (
      <div>
        <p key={'header'}>This layer has no type yet. Please select a layer
        type from the following options:</p>
        <RadioButtonGroup name={'types.untyped'} key={'baseProperties'}
          onChange={this.props.onLayerTypeChanged}>
          {layerTypeRadioButtons}
        </RadioButtonGroup>
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
