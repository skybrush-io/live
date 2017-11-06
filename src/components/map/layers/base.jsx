import _ from 'lodash'
import PropTypes from 'prop-types'
import React from 'react'
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
        style={{ marginTop: 5 }} />
    ))
    return (
      <div>
        <p key={'header'}>Layer data source</p>
        <RadioButtonGroup name={'source.base'} key={'baseProperties'}
          valueSelected={this.props.layer.parameters.source}
          onChange={this.props.onLayerSourceChanged}>
          {sourceRadioButtons}
        </RadioButtonGroup>
      </div>
    )
  }
}

BaseLayerSettingsPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string,
  onLayerSourceChanged: PropTypes.func
}

export const BaseLayerSettings = connect(
  // mapStateToProps
  (state, ownProps) => ({}),
  // mapDispatchToProps
  (dispatch, ownProps) => ({
    onLayerSourceChanged: (event, value) => {
      dispatch(selectMapSource({layerId: ownProps.layerId, source: value}))
    }
  })
)(BaseLayerSettingsPresentation)

// === The actual layer to be rendered ===

class BaseLayerPresentation extends React.Component {
  render () {
    const visibleSource = this.props.layer.parameters.source

    return (
      <div>
        <layer.Tile visible={visibleSource === Source.OSM}
          zIndex={this.props.zIndex}>
          <source.OSM />
        </layer.Tile>
        <layer.Tile visible={visibleSource === Source.BING_MAPS.AERIAL_WITH_LABELS}
          zIndex={this.props.zIndex}>
          <source.BingMaps
            apiKey={BingAPI.key}
            imagerySet={'AerialWithLabels'}
            maxZoom={19} />
        </layer.Tile>
        <layer.Tile visible={visibleSource === Source.BING_MAPS.ROAD}
          zIndex={this.props.zIndex}>
          <source.BingMaps apiKey={BingAPI.key} imagerySet={'Road'} />
        </layer.Tile>
      </div>
    )
  }
}

BaseLayerPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string,
  zIndex: PropTypes.number
}

export const BaseLayer = connect(
  // mapStateToProps
  (state, ownProps) => ({}),
  // mapDispatchToProps
  (dispatch, ownProps) => ({})
)(BaseLayerPresentation)
