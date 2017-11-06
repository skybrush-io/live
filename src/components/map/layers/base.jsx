import _ from 'lodash'
import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton'
import { Source, Sources, labelForSource } from '../../../model/sources'
import { selectMapSource } from '../../../actions/map'

import { layer as olLayer, source } from 'ol-react'
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

// This component needs to be pure to avoid flickering when the BaseLayer
// component is re-rendered; otherwise it would re-render the source, which
// would in turn re-create the layer source object.
//
// Most likely it could be solved in ol-react as well, but it's easier to
// do it here.

class LayerSource extends React.PureComponent {
  render () {
    const { type } = this.props
    switch (type) {
      case Source.OSM:
        return <source.OSM />

      case Source.BING_MAPS.AERIAL_WITH_LABELS:
        return <source.BingMaps apiKey={BingAPI.key} imagerySet="AerialWithLabels" maxZoom={19} />

      case Source.BING_MAPS.ROAD:
        return <source.BingMaps apiKey={BingAPI.key} imagerySet="Road" />
    }
  }
}
LayerSource.propTypes = {
  type: PropTypes.string
}

export const BaseLayer = ({ layer, zIndex }) => (
  <olLayer.Tile zIndex={zIndex}>
    <LayerSource type={layer.parameters.source} />
  </olLayer.Tile>
)
BaseLayer.propTypes = {
  layer: PropTypes.object,
  zIndex: PropTypes.number
}
