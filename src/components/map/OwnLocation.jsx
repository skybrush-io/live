import ol from 'openlayers'
import { source } from 'ol-react'

export default class OwnLocation extends source.Vector {
  constructor (props, context) {
    super(props)

    this.onPositionChange_ = this.onPositionChange_.bind(this)
    // this.onHeadingChange_ = this.onHeadingChange_.bind(this)
    this.onAccuracyGeometryChange_ = this.onAccuracyGeometryChange_.bind(this)
    this.onDeviceOrientationAlphaChange_ = this.onDeviceOrientationAlphaChange_.bind(this)
    // this.onDeviceOrientation_ = this.onDeviceOrientation_.bind(this)

    this.locationIcon = new ol.style.Icon({
      rotateWithView: true,
      rotation: 0,
      snapToPixel: false,
      src: '/assets/location.32x32.png'
    })

    this.locationFeature = new ol.Feature()
    this.locationFeature.setStyle(
      new ol.style.Style({ image: this.locationIcon })
    )
    this.source.addFeature(this.locationFeature)

    this.accuracyFeature = new ol.Feature()
    this.source.addFeature(this.accuracyFeature)

    this.olGeolocation = new ol.Geolocation({
      projection: context.map.getView().getProjection()
    })
    this.olGeolocation.on('change:position', this.onPositionChange_)
    // this.olGeolocation.on('change:heading', this.onHeadingChange_)
    this.olGeolocation.on('change:accuracyGeometry', this.onAccuracyGeometryChange_)
    // this.olGeolocation.on('error', (error) => { console.log(error) })
    this.olGeolocation.setTracking(true)

    let deviceOrientation = new ol.DeviceOrientation()
    deviceOrientation.on('change:alpha', this.onDeviceOrientationAlphaChange_)
    deviceOrientation.setTracking(true)

    // deviceOrientation.on('change:heading', function (event) {
    //   let heading = event.target.getHeading()
    //   console.log('heading: ' + heading);
    // })

    // window.addEventListener('deviceorientation', this.onDeviceOrientation_)
  }

  onPositionChange_ () {
    let coordinates = this.olGeolocation.getPosition()
    this.locationFeature.setGeometry(coordinates ? new ol.geom.Point(coordinates) : null)
  }

  // onHeadingChange_ () {
  //   let heading = this.olGeolocation.getHeading()
  //   if (heading) {
  //     this.locationIcon.setRotation(heading * Math.PI / 180)
  //   }
  // }

  onAccuracyGeometryChange_ () {
    this.accuracyFeature.setGeometry(this.olGeolocation.getAccuracyGeometry())
  }

  onDeviceOrientationAlphaChange_ (e) {
    this.locationIcon.setRotation(-e.target.getAlpha())
    this.source.refresh()
  }

  // onDeviceOrientation_ (e) {
  //   console.log(e.alpha);
  //   this.locationIcon.setRotation(e.alpha + 180)
  // }
}
