/**
 * @file OpenLayers feature that represents an UAV on the map.
 */

import ol from 'openlayers'
import _ from 'lodash'

/**
 * Object containing the conditions under which a drone should be colored
 * to a certain color.
 */
export const colorPredicates = {}

/**
 * @param {string} id the identifier of the drone
 *
 * @return {string} the assigned color ('black' if no predicates match)
 */
const getColorById = id => _.findKey(colorPredicates, (p) => p(id)) || 'black'

/**
* Feature that represents an UAV on an OpenLayers map.
*/
export default class UAVFeature extends ol.Feature {
  /**
   * Constructor.
   *
   * @param  {string}  uavId  the identifier of the UAV to which this feature belongs
   * @param  {Object}  geometryOrProperties  the geometry that the feature represents
   *         or a properties object for the feature. This is passed on intact
   *         to the superclass but the style will be overwritten.
   */
  constructor (uavId, geometryOrProperties) {
    super(geometryOrProperties)

    this._selected = false
    this._heading = 0
    this.uavId = uavId
    this._setupStyle()
  }

  /**
   * Returns the current heading of the UAV according to the feature.
   */
  get heading () {
    return this._heading
  }

  /**
   * Sets the current heading of the UAV.
   *
   * @param {number} value  the new heading of the UAV, in degrees
   */
  set heading (value) {
    if (this._heading === value) {
      return
    }

    this._heading = value

    if (this.iconImage) {
      this.iconImage.setRotation(((this._heading + 45) % 360) * Math.PI / 180)
      this.selectionImage.setRotation(((this._heading + 45) % 360) * Math.PI / 180)
    }
  }

  /**
   * Returns whether the UAV feature is selected or not.
   */
  get selected () {
    return this._selected
  }

  /**
   * Sets whether the UAV feature is selected or not.
   *
   * @param {boolean} value  whether the feature is selected
   */
  set selected (value) {
    if (this._selected === value) {
      return
    }

    this._selected = value
    this._setupStyle()
  }

  /**
   * Sets up or updates the style of the feature.
   */
  _setupStyle () {
    let styles = []

    this.iconImage = new ol.style.Icon({
      rotateWithView: true,
      rotation: ((this._heading + 45) % 360) * Math.PI / 180,
      snapToPixel: false,
      /* Path should not have a leading slash otherwise it won't work in Electron */
      src: `assets/drone.${getColorById(this.uavId)}.32x32.png`
    })
    this.iconStyle = new ol.style.Style({ image: this.iconImage })
    styles.push(this.iconStyle)

    this.selectionImage = new ol.style.Icon({
      rotateWithView: true,
      rotation: ((this._heading + 45) % 360) * Math.PI / 180,
      snapToPixel: false,
      /* Path should not have a leading slash otherwise it won't work in Electron */
      src: 'assets/selection_glow.png'
    })
    this.selectionStyle = new ol.style.Style({ image: this.selectionImage })

    if (this._selected) {
      styles.push(this.selectionStyle)
    }

    this.labelStyle = new ol.style.Style({
      text: new ol.style.Text({
        font: '12px sans-serif',
        offsetY: 24,
        text: this.uavId || 'undefined',
        textAlign: 'center'
      })
    })
    styles.push(this.labelStyle)

    this.setStyle(styles)
  }
}
