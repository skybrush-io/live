/**
 * @file OpenLayers vector layer source that contains all the active UAVs
 * currently known to the server.
 */

import difference from 'lodash-es/difference';
import findKey from 'lodash-es/findKey';
import includes from 'lodash-es/includes';
import stubFalse from 'lodash-es/stubFalse';
import Layer from 'ol/layer/Layer';
import PropTypes from 'prop-types';
import React from 'react';
import { source, withLayer } from '@collmot/ol-react';

import FeatureManager from '../FeatureManager';
import UAVFeature from '../features/UAVFeature';

import Flock from '../../../model/flock';
import { setLayerSelectable } from '../../../model/layers';
import { uavIdToGlobalId } from '../../../model/identifiers';

/**
 * Function for assigning colors to UAV ids according to color predicates.
 *
 * @param {Object} colorPredicates Object containing the conditions under which
 *        a drone should be colored to a certain color.
 * @param {string} id The identifier of the drone.
 *
 * @return {string} The assigned color. (If no predicate matches then 'black'.)
 */
const cachedGetColorById = (() => {
  const predicateFunctionCache = {};

  return (colorPredicates, id) =>
    /* eslint no-new-func: "off" */
    findKey(colorPredicates, (p) => {
      if (!(p in predicateFunctionCache)) {
        try {
          predicateFunctionCache[p] = new Function('id', `return ${p}`);
        } catch {
          // Probably it is blocked by the browser()
          console.warn(
            'Cannot create new UAV color predicate; maybe blocked by CSP?'
          );
          predicateFunctionCache[p] = stubFalse;
        }
      }

      return predicateFunctionCache[p](id);
    }) || 'black';
})();

/**
 * OpenLayers vector layer source that contains all the active UAVs
 * currently known to the server.
 *
 * This layer source can be passed to an OpenLayers layer as a source to
 * show all the active UAVs on top of the map.
 */
class ActiveUAVsLayerSource extends React.Component {
  static propTypes = {
    colorPredicates: PropTypes.objectOf(PropTypes.string).isRequired,
    flock: PropTypes.instanceOf(Flock),
    layer: PropTypes.instanceOf(Layer),
    projection: PropTypes.func,
    selection: PropTypes.arrayOf(PropTypes.string).isRequired,
  };

  constructor(props) {
    super(props);

    this._sourceRef = undefined;

    this._featureManager = new FeatureManager();
    this._featureManager.featureFactory = (id, geom) =>
      new UAVFeature(id, geom);
    this._featureManager.featureIdFunction = uavIdToGlobalId;
    this._featureManager.featureAdded.add(this._onFeatureAdded);

    this.eventBindings = {};
  }

  componentDidUpdate(previousProps) {
    this._onFlockMaybeChanged(previousProps.flock, this.props.flock);
    this._onSelectionMaybeChanged(
      previousProps.selection,
      this.props.selection
    );
    this._onColorsMaybeChanged(
      previousProps.colorPredicates,
      this.props.colorPredicates
    );
    this._featureManager.projection = this.props.projection;
  }

  componentDidMount() {
    if (this.props.layer) {
      setLayerSelectable(this.props.layer);
    }

    this._onFlockMaybeChanged(undefined, this.props.flock);
    this._onSelectionMaybeChanged(undefined, this.props.selection);

    this._featureManager.projection = this.props.projection;
  }

  componentWillUnmount() {
    this._onFlockMaybeChanged(this.props.flock, undefined);
    this._onSelectionMaybeChanged(this.props.selection, undefined);

    this._featureManager.projection = undefined;
  }

  render() {
    return <source.Vector ref={this._assignSourceRef} />;
  }

  _assignSourceRef = (value) => {
    if (value === this._sourceRef) {
      return;
    }

    if (this._sourceRef) {
      this._featureManager.vectorSource = undefined;
    }

    this._sourceRef = value;

    if (this._sourceRef) {
      this._featureManager.vectorSource = value.source;
    }
  };

  /**
   * Event handler that is called when a new feature was added by the feature
   * manager. This happens when we see a new UAV for the first time.
   *
   * @param {UAVFeature}  feature  the feature that was added
   */
  _onFeatureAdded = (feature) => {
    // Ensure that the feature is selected automatically if it is part
    // of the current selection
    feature.selected = includes(this.props.selection, feature.getId());
  };

  /**
   * Function that is called when we suspect that the flock associated to
   * the layer may have changed.
   *
   * This function subscribes to the events from the new flock and
   * unsubscribes from the events of the old flock. It also performs a
   * strict equality check on the two flocks because they may be equal.
   *
   * @param {Flock} oldFlock  the old flock associated to the layer
   * @param {Flock} newFlock  the new flock associated to the layer
   */
  _onFlockMaybeChanged = (oldFlock, newFlock) => {
    if (oldFlock === newFlock) {
      return;
    }

    if (oldFlock) {
      oldFlock.uavsUpdated.detach(this.eventBindings.uavsUpdated);
      delete this.eventBindings.uavsUpdated;
    }

    if (newFlock) {
      this.eventBindings.uavsUpdated = newFlock.uavsUpdated.add(
        this._onUAVsUpdated
      );
    }
  };

  /**
   * Function that is called when we suspect that the set of selected UAVs
   * may have changed.
   *
   * @param {string[]}  oldSelection  the old selection of UAVs
   * @param {string[]}  newSelection  the new selection of UAVs
   */
  _onSelectionMaybeChanged = (oldSelection, newSelection) => {
    if (!this._sourceRef) {
      return;
    }

    const { source } = this._sourceRef;
    const getFeatureById = source.getFeatureById.bind(source);
    difference(newSelection, oldSelection)
      .map(getFeatureById)
      .filter(Boolean)
      .forEach((feature) => {
        feature.selected = true;
      });
    difference(oldSelection, newSelection)
      .map(getFeatureById)
      .filter(Boolean)
      .forEach((feature) => {
        feature.selected = false;
      });
  };

  /**
   * Function that checks whether the color predicates have changed and updates
   * the features accordingly.
   *
   * @param {Object} oldColorPredicates The old color predicates.
   * @param {Object} newColorPredicates The new color predicates.
   */
  _onColorsMaybeChanged = (oldColorPredicates, newColorPredicates) => {
    if (newColorPredicates === oldColorPredicates) {
      return;
    }

    const features = this._featureManager.getFeatureArray();
    for (const feature of features) {
      feature.color = cachedGetColorById(newColorPredicates, feature.uavId);
    }
  };

  /**
   * Event handler that is called when the status of some of the UAVs has
   * changed in the flock and the layer should be re-drawn.
   *
   * @listens Flock#uavsUpdated
   * @param {UAV[]} uavs  the UAVs that should be refreshed
   */
  _onUAVsUpdated = (uavs) => {
    uavs.forEach((uav) => {
      const feature = this._featureManager.createOrUpdateFeatureById(uav.id, [
        uav.lon,
        uav.lat,
      ]);

      // Set or update the heading of the feature
      if (typeof uav.heading !== 'undefined') {
        feature.heading = uav.heading;
      }

      if (feature.color === '') {
        feature.color = cachedGetColorById(this.props.colorPredicates, uav.id);
      }
    });
  };
}

export default withLayer(ActiveUAVsLayerSource);
