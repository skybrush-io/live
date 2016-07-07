import React, { PropTypes } from 'react'
import ol from 'openlayers'

import Signal from 'mini-signals'

import IconButton from 'material-ui/IconButton'
import SystemUpdateAlt from 'material-ui/svg-icons/action/system-update-alt'
import TextField from 'material-ui/TextField'

export default class GeoJSONImporter extends React.Component {
  constructor (props, context) {
    super(props)
    this.data = ''

    this.onMapReferenceReceived_ = this.onMapReferenceReceived_.bind(this)
    this.handleChange_ = this.handleChange_.bind(this)
    this.handleClick_ = this.handleClick_.bind(this)

    context.mapReferenceRequestSignal.dispatch(this.onMapReferenceReceived_)
  }

  render () {
    return (
      <div style={this.props.style}>
        <IconButton onClick={this.handleClick_} tooltip="Import GeoJSON">
          <SystemUpdateAlt />
        </IconButton>
        <TextField
          style={{ width: this.props.fieldWidth, verticalAlign: 'inherit' }}
          hintText="GeoJSON"
          onChange={this.handleChange_} />
      </div>
    )
  }

  onMapReferenceReceived_ (map) {
    this.map = map
  }

  handleChange_ (e) {
    this.data = e.target.value
  }

  handleClick_ (e) {
    let geojsonFormat = new ol.format.GeoJSON()
    let features = geojsonFormat.readFeatures(this.data, {featureProjection: 'EPSG:3857'})

    let source = new ol.source.Vector()
    source.addFeatures(features)

    let layer = new ol.layer.Vector()
    layer.setSource(source)

    this.map.addLayer(layer)
  }
}

GeoJSONImporter.propTypes = {
  fieldWidth: PropTypes.string,
  style: PropTypes.object
}

GeoJSONImporter.contextTypes = {
  mapReferenceRequestSignal: PropTypes.instanceOf(Signal)
}
