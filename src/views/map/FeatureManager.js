/**
 * @file Object responsible for constructing features on an OpenLayers
 * vector layer based on string identifiers (one feature for each string
 * identifier) and returning them on-demand by IDs.
 */

import forOwn from 'lodash-es/forOwn';
import identity from 'lodash-es/identity';
import values from 'lodash-es/values';
import { MiniSignal } from 'mini-signals';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';

/**
 * Object responsible for constructing features on an OpenLayers
 * vector layer based on string identifiers (one feature for each string
 * identifier) and returning them on-demand by IDs.
 *
 * Note that the IDs that you pass to the feature manager are the IDs of the
 * <em>objects</em> that the features represent. The OpenLayers feature ID
 * may or may not be equal to the object ID.
 *
 * @property {?string} namespace  when specified, it will be prepended to
 *           every object ID passed to the feature manager function to
 *           obtain the OpenLayers feature ID
 * @property {?function} projection  a projection function from OpenLayers
 *           that is used to map coordinates specified by the user to the
 *           coordinate system of the source layer
 */
export default class FeatureManager {
  /**
   * Constructor.
   *
   * @param  {?ol.source.Vector} vectorSource  the OpenLayers vector layer
   *         source to which the features of this feature manager will be
   *         added automatically
   * @param  {?function} projection  a projection function from OpenLayers
   *           that is used to map coordinates specified by the user to the
   *           coordinate system of the source layer
   */
  constructor(vectorSource, projection) {
    this._featuresByObjectId = {};
    this._featureFactory = undefined;
    this._featureIdFunction = identity;

    this._vectorSource = vectorSource;
    this.projection = projection;

    this.featureAdded = new MiniSignal();
    this.featureRemoved = new MiniSignal();
  }

  /**
   * Creates or updates a feature with the given ID at the given coordinate.
   *
   * @param {string} id  the identifier of the object for which the feature
   *        has to be created or updated
   * @param {ol.Coordinate} coordinate  the coordinates of the feature
   * @returns {ol.Feature}  the OpenLayers feature that represents the
   *          object with the given ID on the map
   */
  createOrUpdateFeatureById = (id, coordinate) => {
    coordinate = this.projection ? this.projection(coordinate) : coordinate;

    const feature =
      this.getFeatureById(id) || this._createFeatureById(id, coordinate);
    feature.getGeometry().setCoordinates(coordinate);

    return feature;
  };

  /**
   * Creates a new feature for the given object ID.
   *
   * If the given ID already had a feature, it will be overwritten with the
   * new feature.
   *
   * @param {string} id  the identifier for which the feature has to be
   *        created
   * @param {ol.Coordinate} coordinate  the initial coordinates of the
   *        feature, already transformed to the coordinate system of the
   *        layer using the projection specified in this class
   *
   * @returns {ol.Feature}  the OpenLayers feature that will represent the
   *          object with the given ID on the map
   */
  _createFeatureById = (id, coordinate) => {
    const point = new Point(coordinate);
    const feature = this._featureFactory
      ? this._featureFactory(id, point)
      : new Feature(point);
    const featureId = this._featureIdFunction(id);

    feature.setId(featureId);
    this._featuresByObjectId[id] = feature;

    if (this._vectorSource) {
      this._vectorSource.addFeature(feature);
    }

    this.featureAdded.dispatch(feature);

    return feature;
  };

  /**
   * Returns the feature corresponding to the object with the given ID.
   *
   * @param {string} id  the identifier for which the feature has to be
   *        returned
   * @return {?ol.Feature}  the OpenLayers feature that represents the
   *         object with the given ID on the map, or undefined if the given
   *         object has no feature yet
   */
  getFeatureById = (id) => {
    return this._featuresByObjectId[id];
  };

  /**
   * Returns an array containing all the features managed by this manager.
   *
   * The returned array is constructed on-the-fly; it will not be updated
   * when new features are added.
   *
   * @return {Array<ol.Feature>}  an array containing all the features
   *         managed by this manager
   */
  getFeatureArray = () => {
    return values(this._featuresByObjectId);
  };

  /**
   * Removes all features from the feature manager (and the corresponding
   * vector source).
   */
  removeAllFeatures = () => {
    if (this._vectorSource) {
      this._vectorSource.clear();
    }

    this._featuresByObjectId = {};
  };

  /**
   * Removes the feature corresponding to the object with the given ID.
   *
   * @param {string} id  the identifier for which the feature has to be
   *        removed
   * @return {ol.Feature}  the feature that was removed or undefined if
   *         there was no feature for the given ID
   */
  removeFeatureById = (id) => {
    const feature = this.getFeatureById(id);

    if (feature && this._vectorSource) {
      this._vectorSource.removeFeature(feature);
    }

    delete this._featuresByObjectId[id];

    return feature;
  };

  /**
   * Returns the feature factory function that creates a new feature for a
   * a given ID.
   *
   * The function should expect a feature ID and an OpenLayers geometry
   * object (typically a point) as its only argument and must
   * return an appropriately constructed {@link ol.Feature} object.
   *
   * @return {function(id: string, geom: ol.geom.Geometry): ol.Feature}
   *         the feature factory function
   */
  get featureFactory() {
    return this._featureFactory;
  }

  /**
   * Sets the feature factory function that creates a new feature for a
   * a given ID.
   *
   * The function should expect a feature ID and an OpenLayers geometry
   * object (typically a point) as its only argument and must
   * return an appropriately constructed {@link ol.Feature} object.
   *
   * @param {function(id: string, geom: ol.geom.Geometry): Array<ol.style.Style>} value
   *        the new feature factory function
   * @return {undefined}
   */
  set featureFactory(value) {
    this._featureFactory = value;
  }

  /**
   * Returns the function that maps object IDs to feature IDs.
   *
   * The function should expect an object ID and return the corresponding
   * feature ID to be used in OpenLayers.
   *
   * @return {function(id: string): string}  the feature ID mapping function
   */
  get featureIdFunction() {
    return this._featureIdFunction;
  }

  /**
   * Sets the feature ID mapping function that maps object IDs to feature IDs.
   *
   * The function should expect an object ID and return the corresponding
   * feature ID to be used in OpenLayers.
   *
   * @param {function(id: string): string} value  the new feature ID mapping function
   * @return {undefined}
   */
  set featureIdFunction(value) {
    this._featureIdFunction = value;
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
  get vectorSource() {
    return this._vectorSource;
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
  set vectorSource(value) {
    if (this._vectorSource === value) {
      return;
    }

    if (this._vectorSource) {
      this._vectorSource.clear();
    }

    this._vectorSource = value;

    if (this._vectorSource) {
      forOwn(this._featuresByObjectId, (feature) =>
        this._vectorSource.addFeature(feature)
      );
    }
  }
}

/**
 * Event that is dispatched by a {@link FeatureManager} object when a new
 * feature was added.
 *
 * The event contains the newly added feature.
 *
 * @event  FeatureManager#featureAdded
 * @type {ol.Feature}
 */

/**
 * Event that is dispatched by a {@link FeatureManager} object when an
 * existing feature was removed.
 *
 * The event contains the feature that was removed.
 *
 * @event  FeatureManager#featureRemoved
 * @type {ol.Feature}
 */
