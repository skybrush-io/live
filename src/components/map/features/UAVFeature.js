/**
 * @file OpenLayers feature that represents an UAV on the map.
 */

import ol from 'openlayers'

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
    this.iconImage = new ol.style.Icon({
      rotateWithView: true,
      rotation: ((this.heading_ + 45) % 360) * Math.PI / 180,
      snapToPixel: false,
      src: [this.selected_ ? '/assets/drone.32x32.red.selected.png' : '/assets/drone.32x32.red.png']
    })

    this.iconStyle = new ol.style.Style({ image: this.iconImage })
    this.labelStyle = new ol.style.Style({
      text: new ol.style.Text({
        font: '12px sans-serif',
        offsetY: 24,
        text: this.uavId || 'undefined',
        textAlign: 'center'
      })
    })

    this.setStyle([this.iconStyle, this.labelStyle])
  }
}
