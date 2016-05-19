import _ from 'lodash'
import React from 'react'
import { Map, View, layer, source } from 'ol-react'
import ol from 'openlayers'

require('openlayers/css/ol.css')

/**
 * Helper function to convert a latitude-longitude pair to the coordinate
 * system used by the map view.
 *
 * Longitudes and latitudes are assumed to be given in WGS-84.
 *
 * @param {Number} lat  the latitude
 * @param {Number} lon  the longitude
 * @return {Object} the OpenLayers coordinate corresponding to the given
 *         latitude and longitude
 */
const coordinateFromLatLon = (lat, lon) => (
  // EPSG:3857 is Spherical Mercator projection, as used by most tile-based
  // mapping services
  ol.proj.fromLonLat([lon, lat], 'EPSG:3857')
)

/**
 * Object responsible for constructing features for UAVs based on UAV IDs
 * and returning them on-demand by IDs.
 */
class FeatureManager {
  /**
   * Constructor.
   *
   * @param  {?ol.source.Vector} vectorSource  the OpenLayers vector layer
   *         source to which the features of this feature manager will be
   *         added automatically
   */
  constructor (vectorSource) {
    this._featuresById = {}
    this._vectorSource = vectorSource
  }

  /**
   * Creates a new feature for the UAV with the given ID.
   *
   * If the given UAV already had a feature, it will be overwritten with the
   * new feature.
   *
   * @param {string} id  the identifier of the UAV for which the feature
   *        has to be created
   * @param {ol.Coordinate} coordinate  the initial coordinates of the
   *        feature
   * @returns {ol.Feature}  the OpenLayers feature that will represent the
   *          UAV on the map
   */
  createFeatureById (id, coordinate) {
    const feature = new ol.Feature(new ol.geom.Point(coordinate))

    this._featuresById[id] = feature
    feature.setStyle(this._createStyleById(id))

    if (this._vectorSource) {
      this._vectorSource.addFeature(feature)
    }

    return feature
  }

  /**
   * Creates a new style for the UAV with the given ID.
   *
   * @param {string} id  the identifier of the UAV for which the feature
   *        has to be created
   * @return {Array<ol.style.Style>} the style for the UAV with the given ID
   */
  _createStyleById (id) {
    return [
      new ol.style.Style({
        image: new ol.style.Icon(({
          rotateWithView: true,
          rotation: 45 * Math.PI / 180,
          snapToPixel: false,
          src: ['/assets/drone.32x32.png']
        }))
      }),
      new ol.style.Style({
        text: new ol.style.Text({
          font: '12px sans-serif',
          offsetY: 24,
          text: id || 'undefined',
          textAlign: 'center'
        })
      })
    ]
  }

  /**
   * Returns the feature corresponding to the given UAV by its ID.
   *
   * @param {string} id  the identifier of the UAV for which the feature
   *        has to be returned
   * @return {?ol.Feature}  the OpenLayers feature that represents the
   *         UAV with the given ID on the map, or undefined if the given
   *         UAV has no feature yet
   */
  getFeatureById (id) {
    return this._featuresById[id]
  }

  /**
   * Returns an array containing all the features managed by this manager.
   *
   * The returned array is constructed on-the-fly; it will not be updated
   * when new features are added.
   *
   * @return {Array<ol.Feature>}  an array containing all the features
   *         managed by this manager
   */
  getFeatureArray () {
    return _.values(this._featuresById)
  }

  /**
   * Removes the feature corresponding to the UAV with the given ID.
   *
   * @param {string} id  the identifier of the UAV for which the feature
   *        has to be removed
   * @return {ol.Feature}  the feature that was removed or undefined if the
   *         UAV had no feature
   */
  removeFeatureById (id) {
    const feature = this.getFeatureById(id)

    if (feature && this._vectorSource) {
      this._vectorSource.removeFeatureById(feature)
    }

    return feature
  }

  /**
   * Returns the OpenLayers vector layer source that will contain the
   * features managed by this feature manager.
   *
   * Whenever a new feature is added to the feature manager, it will
   * automatically be added to this layer source as well. Similarly,
   * whenever a feature is removed from the feature manager, it will
   * automatically be removed from this layer source.
   *
   * @return {ol.source.Vector}  the OpenLayers vector layer source
   *         attached to this feature manager
   */
  get vectorSource () {
    return this._vectorSource
  }

  /**
   * Sets the OpenLayers vector layer source that will contain the
   * features managed by this feature manager.
   *
   * A feature manager can be attached to a vector layer source only once;
   * attempts to associate it to a different layer source will yield an
   * error.
   *
   * @param {ol.source.Vector} value  the new OpenLayers vector layer source
   * @throws Error  if the feature manager is already attached to a different
   *         layer source
   *
   * @return {undefined}
   */
  set vectorSource (value) {
    if (this._vectorSource === value) {
      return
    }

    if (this._vectorSource) {
      throw new Error('A feature manager cannot be re-associated to a ' +
        'new vector source once it has been bound to another one')
    }

    this._vectorSource = value
    _.forOwn(this._featuresById, feature => value.addFeature(feature))
  }
}

/**
 * React component for the full-bleed map of the main window.
 */
export default class MapView extends React.Component {
  constructor () {
    super()

    this.featureManager = undefined
  }

  componentDidMount () {
    const uavLayerSource = new ol.source.Vector()
    this.featureManager = new FeatureManager(uavLayerSource)
  }

  componentWillUnmount () {
    this.featureManager = undefined
  }

  render () {
    const center = coordinateFromLatLon(47.473340, 19.061951)
    const view = <View center={center} zoom={17} />
    return (
      <Map view={view} loadTilesWhileInteracting={true}>
        <layer.Tile>
          <source.OSM />
        </layer.Tile>
        <layer.Vector>
          <source.Vector></source.Vector>
        </layer.Vector>
      </Map>
    )
  }
}
