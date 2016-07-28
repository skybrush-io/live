import React, { PropTypes } from 'react'
import ol from 'openlayers'
import _ from 'lodash'

import { mapReferenceRequestSignal } from '../../signals'

import RaisedButton from 'material-ui/RaisedButton'
import TextField from 'material-ui/TextField'

export default class HexGridDrawer extends React.Component {
  constructor (props) {
    super(props)

    this.onMapReferenceReceived_ = this.onMapReferenceReceived_.bind(this)
    this.handleClick_ = this.handleClick_.bind(this)

    mapReferenceRequestSignal.dispatch(this.onMapReferenceReceived_)
  }

  render () {
    return (
      <div style={this.props.style}>
        <TextField ref="center"
          floatingLabelText="Center of the grid"
          hintText="Center (comma separated)"
          defaultValue="19.061951, 47.473340"
          onChange={this.handleChange_} />
        <TextField ref="size"
          floatingLabelText="Size of the grid"
          hintText="Size"
          defaultValue="1"
          onChange={this.handleChange_} />
        <TextField ref="radius"
          floatingLabelText="Radius of one cell"
          hintText="Radius"
          defaultValue="0.001"
          onChange={this.handleChange_} />
        <br />
        <RaisedButton
          label="Draw hex grid"
          onClick={this.handleClick_} />
      </div>
    )
  }

  onMapReferenceReceived_ (map) {
    this.map = map
  }

  getCorners_ (center, radius) {
    const angles = [30, 90, 150, 210, 270, 330].map(a => a * Math.PI / 180)

    return angles.map(angle => [
      center[0] + radius * Math.sin(angle),
      center[1] + radius * Math.cos(angle)
    ])
  }

  getHexagon_ (center, radius) {
    return {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [this.getCorners_(center, radius)]
      }
    }
  }

  handleClick_ (e) {
    const center = this.refs.center.getValue().split(',').map(_.toNumber)
    const size = _.toNumber(this.refs.size.getValue())
    const radius = _.toNumber(this.refs.radius.getValue())

    let data = {
      type: 'FeatureCollection',
      features: []
    }

    for (let x = -size; x <= size; x++) {
      for (let z = Math.max(-size, -size - x); z <= Math.min(size, size - x); z++) {
        data.features.push(this.getHexagon_([
          center[0] + (radius * 1.5 * x),
          center[1] - (radius * Math.sqrt(3)) * (0.5 * x + z)
        ], radius))
      }
    }

    let geojsonFormat = new ol.format.GeoJSON()
    let features = geojsonFormat.readFeatures(data, {featureProjection: 'EPSG:3857'})

    let source = new ol.source.Vector()
    source.addFeatures(features)

    let layer = new ol.layer.Vector()
    layer.setSource(source)

    this.map.addLayer(layer)
  }
}

HexGridDrawer.propTypes = {
  style: PropTypes.object
}
