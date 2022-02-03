/**
 * @file OpenLayers feature that represents an UAV on the map.
 */

import Feature from 'ol/Feature';
import { Fill, Icon, Style, Text } from 'ol/style';

import { toRadians } from '~/utils/math';

import DroneImage from '~/../assets/img/drone-x-black-32x32.png';
import DroneImageInfo from '~/../assets/img/drone-x-black-info-32x32.png';
import DroneImageWarning from '~/../assets/img/drone-x-black-warning-32x32.png';
import DroneImageError from '~/../assets/img/drone-x-black-error-32x32.png';
import SelectionGlow from '~/../assets/img/drone-selection-glow.png';
import { Severity } from '~/model/enums';

const droneImages = {
  [Severity.INFO]: DroneImageInfo,
  [Severity.WARNING]: DroneImageWarning,
  [Severity.ERROR]: DroneImageError,
  [Severity.CRITICAL]: DroneImageError,
};

/**
 * Feature that represents an UAV on an OpenLayers map.
 */
export default class UAVFeature extends Feature {
  /**
   * Constructor.
   *
   * @param  {string}  uavId  the identifier of the UAV to which this feature belongs
   * @param  {Object}  geometryOrProperties  the geometry that the feature represents
   *         or a properties object for the feature. This is passed on intact
   *         to the superclass but the style will be overwritten.
   */
  constructor(uavId, geometryOrProperties) {
    super(geometryOrProperties);

    this._selected = false;
    this._color = '';
    this._labelColor = '';
    this._heading = 0;
    this._status = null;

    this.uavId = uavId;
    this._setupStyle();
  }

  /**
   * Returns the current heading of the UAV according to the feature.
   */
  get heading() {
    return this._heading;
  }

  /**
   * Sets the current heading of the UAV.
   *
   * @param {number} value  the new heading of the UAV, in degrees
   */
  set heading(value) {
    if (this._heading === value) {
      return;
    }

    this._heading = value;

    if (this._iconImage) {
      const rotation = this._headingToRotation();
      this._iconImage.setRotation(rotation);
      this._selectionImage.setRotation(rotation);
    }
  }

  /**
   * Returns whether the UAV feature is selected or not.
   */
  get selected() {
    return this._selected;
  }

  /**
   * Sets whether the UAV feature is selected or not.
   *
   * @param {boolean} value  whether the feature is selected
   */
  set selected(value) {
    if (this._selected === value) {
      return;
    }

    this._selected = value;
    this._setupStyle();
  }

  /**
   * Returns the current display color of the UAV.
   */
  get color() {
    return this._color;
  }

  /**
   * Sets the display color of the UAV.
   *
   * @param {string} value The new color to be used.
   */
  set color(value) {
    if (this._color === value) {
      return;
    }

    this._color = value;
    this._setupStyle();
  }

  /**
   * Returns the current label color of the UAV.
   */
  get labelColor() {
    return this._labelColor;
  }

  /**
   * Sets the label color of the UAV.
   *
   * @param {string} value The new color to be used.
   */
  set labelColor(value) {
    if (this._labelColor === value) {
      return;
    }

    this._labelColor = value;
    this._setupStyle();
  }

  /**
   * Returns the current status level of the UAV.
   */
  get status() {
    return this._status;
  }

  /**
   * Sets the current status level of the UAV. This is used to determine the
   * color of the "dot" on the UAV image.
   */
  set status(value) {
    if (this._status === value) {
      return;
    }

    this._status = value;
    this._setupStyle();
  }

  /**
   * Sets up or updates the style of the feature.
   */
  _setupStyle() {
    const styles = [];

    // Main image
    const iconImage = new Icon({
      rotateWithView: true,
      rotation: this._headingToRotation(),
      snapToPixel: false,
      src: droneImages[this._status] || DroneImage,
    });
    this._iconImage = iconImage;

    const iconStyle = new Style({ image: iconImage });
    styles.push(iconStyle);

    // Selection image

    const selectionImage = new Icon({
      rotateWithView: true,
      rotation: this._headingToRotation(),
      snapToPixel: false,
      src: SelectionGlow,
    });
    this._selectionImage = selectionImage;

    const selectionStyle = new Style({ image: selectionImage });
    if (this._selected) {
      styles.splice(0, 0, selectionStyle);
    }

    // Label

    const labelStyle = new Style({
      text: new Text({
        fill: new Fill({
          color:
            this._labelColor && this._labelColor.length > 0
              ? this._labelColor
              : 'black',
        }),
        font: '12px sans-serif',
        offsetY: 24,
        text: this.uavId || 'undefined',
        textAlign: 'center',
      }),
    });
    styles.push(labelStyle);

    this.setStyle(styles);
  }

  /**
   * Converts the heading from the status information into the rotation
   * value to use in the OpenLayers feature style.
   */
  _headingToRotation(heading) {
    if (heading === undefined) {
      heading = this._heading;
    }

    return toRadians(heading % 360);
  }
}
