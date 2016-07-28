/**
 * @file OpenLayers feature that represents an UAV on the map.
 */

import ol from 'openlayers'
import _ from 'lodash'

/**
 * Object containing the conditions under which a drone should be colored
 * to a certain color.
 */
const colorPredicates = {
  pink: (id) => ['13', '15', '16', '12', '14'].includes(id),
  orange: (id) => ['11'].includes(id),
  blue: (id) => ['10', '01', '02', '03'].includes(id)
}

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

    this.selected_ = false
    this.heading_ = 0
    this.uavId = uavId
    this.setupStyle_()
  }

  /**
   * Returns the current heading of the UAV according to the feature.
   */
  get heading () {
    return this.heading_
  }

  /**
   * Sets the current heading of the UAV.
   *
   * @param {number} value  the new heading of the UAV, in degrees
   */
  set heading (value) {
    if (this.heading_ === value) {
      return
    }

    this.heading_ = value

    if (this.iconImage) {
      this.iconImage.setRotation(((this.heading_ + 45) % 360) * Math.PI / 180)
      this.selectionImage.setRotation(((this.heading_ + 45) % 360) * Math.PI / 180)
    }
  }

  /**
   * Returns whether the UAV feature is selected or not.
   */
  get selected () {
    return this.selected_
  }

  /**
   * Sets whether the UAV feature is selected or not.
   *
   * @param {boolean} value  whether the feature is selected
   */
  set selected (value) {
    if (this.selected_ === value) {
      return
    }

    this.selected_ = value
    this.setupStyle_()
  }

  /**
   * Sets up or updates the style of the feature.
   */
  setupStyle_ () {
    let styles = []

    this.iconImage = new ol.style.Icon({
      rotateWithView: true,
      rotation: ((this.heading_ + 45) % 360) * Math.PI / 180,
      snapToPixel: false,
      src: `/assets/drone.${getColorById(this.uavId)}.32x32.png`
    })
    this.iconStyle = new ol.style.Style({ image: this.iconImage })
    styles.push(this.iconStyle)

    this.selectionImage = new ol.style.Icon({
      rotateWithView: true,
      rotation: ((this.heading_ + 45) % 360) * Math.PI / 180,
      snapToPixel: false,
      src: '/assets/selection_glow.png'
    })
    this.selectionStyle = new ol.style.Style({ image: this.selectionImage })

    if (this.selected_) {
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
