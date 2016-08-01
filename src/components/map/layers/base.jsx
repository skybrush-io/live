import _ from 'lodash'
import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton'
import { Source, Sources, labelForSource } from '../../../model/sources'
import { selectMapSource } from '../../../actions/map'

import { layer, source } from 'ol-react'
import { BingAPI } from 'config'

// === Settings for this particular layer type ===

class BaseLayerSettingsPresentation extends React.Component {
  render () {
    const sourceRadioButtons = _.map(Sources, source => (
      <RadioButton value={source} key={source}
        label={labelForSource(source)}
        style={{ marginTop: 5 }}/>
    ))
    return (
      <div>
        <p key="header">Layer data source</p>
        <RadioButtonGroup name="source.base" key="baseProperties"
          valueSelected={this.props.layer.parameters.source}
          onChange={this.props.onLayerSourceChanged}>
          {sourceRadioButtons}
        </RadioButtonGroup>
      </div>
    )
  }
}

export const BaseLayerSettings = connect(
  // mapStateToProps
  (state, ownProps) => ({}),
  // mapDispatchToProps
  (dispatch, ownProps) => ({
    onLayerSourceChanged: (event, value) => {
      dispatch(selectMapSource(value))
    }
  })
)(BaseLayerSettingsPresentation)

BaseLayerSettingsPresentation.propTypes = {
  layer: PropTypes.object,
  onLayerSourceChanged: PropTypes.func
}

// === The actual layer to be rendered ===

class BaseLayerPresentation extends React.Component {
  render () {
    const visibleSource = this.props.layer.parameters.source

    return (
      <div>
        <layer.Tile visible={visibleSource === Source.OSM}>
          <source.OSM />
        </layer.Tile>
        <layer.Tile visible={visibleSource === Source.BING_MAPS.AERIAL_WITH_LABELS}>
          <source.BingMaps
            apiKey={BingAPI.key}
            imagerySet="AerialWithLabels"
            maxZoom={19} />
        </layer.Tile>
        <layer.Tile visible={visibleSource === Source.BING_MAPS.ROAD}>
          <source.BingMaps apiKey={BingAPI.key} imagerySet="Road" />
        </layer.Tile>
      </div>
    )
  }
}

BaseLayerPresentation.propTypes = {
  layer: PropTypes.object
}

export const BaseLayer = connect(
  // mapStateToProps
  (state, ownProps) => ({}),
  // mapDispatchToProps
  (dispatch, ownProps) => ({})
)(BaseLayerPresentation)
