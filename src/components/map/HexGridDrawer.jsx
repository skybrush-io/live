import React, { PropTypes } from 'react'
import ol from 'openlayers'
import _ from 'lodash'

import { mapReferenceRequestSignal } from '../../signals'

import RaisedButton from 'material-ui/RaisedButton'
import TextField from 'material-ui/TextField'

const makeFillStyle = color => new ol.style.Style({
  fill: new ol.style.Fill({ color: color })
})

export default class HexGridDrawer extends React.Component {
  constructor (props) {
    super(props)

    this.onMapReferenceReceived_ = this.onMapReferenceReceived_.bind(this)
    this.handleClick_ = this.handleClick_.bind(this)

    this.features = {}

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
          defaultValue="2"
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

    return angles.map(angle => ol.proj.fromLonLat([
      center[0] + radius * Math.sin(angle),
      center[1] + radius * Math.cos(angle)
    ], 'EPSG:3857'))
  }

  getHexagon_ (center, radius) {
    return new ol.Feature(
      {
        geometry: new ol.geom.Polygon([
          this.getCorners_(center, radius)
        ])
      }
    )
  }

  handleClick_ (e) {
    const center = this.refs.center.getValue().split(',').map(_.toNumber)
    const size = _.toNumber(this.refs.size.getValue())
    const radius = _.toNumber(this.refs.radius.getValue())

    this.features = {}

    for (let x = -size; x <= size; x++) {
      for (let z = Math.max(-size, -size - x); z <= Math.min(size, size - x); z++) {
        const hash = `${x},${z}`
        this.features[hash] = this.getHexagon_([
          center[0] + (radius * 1.5 * x),
          center[1] - (radius * Math.sqrt(3)) * (0.5 * x + z)
        ], radius)
        this.features[hash].setId(hash)
      }
    }

    let source = new ol.source.Vector()
    source.addFeatures(_.values(this.features))

    let layer = new ol.layer.Vector({
      source: source
      // style: ()
    })

    this.map.addLayer(layer)

    for (const hash in this.features) {
      const coordinates = hash.split(',').map(_.toNumber)
      const hue = (_.sum(coordinates) + 2) * 30
      this.features[hash].setStyle(makeFillStyle(`hsla(${hue}, 50%, 50%, 0.5)`))
    }
  }
}

HexGridDrawer.propTypes = {
  style: PropTypes.object
}
