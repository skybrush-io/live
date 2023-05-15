/**
 * @file OpenLayers vector layer source that contains all the active UAVs
 * currently known to the server.
 */

import difference from 'lodash-es/difference';
import includes from 'lodash-es/includes';
import Layer from 'ol/layer/Layer';
import PropTypes from 'prop-types';
import React from 'react';
import { source, withLayer } from '@collmot/ol-react';

import FeatureManager from '../FeatureManager';
import UAVFeature from '../features/UAVFeature';

import { getSingleUAVStatusLevel } from '~/features/uavs/selectors';
import Flock from '~/model/flock';
import { setLayerSelectable, setLayerTriggersTooltip } from '~/model/layers';
import { uavIdToGlobalId } from '~/model/identifiers';

/**
 * OpenLayers vector layer source that contains all the active UAVs
 * currently known to the server.
 *
 * This layer source can be passed to an OpenLayers layer as a source to
 * show all the active UAVs on top of the map.
 */
class ActiveUAVsLayerSource extends React.Component {
  static propTypes = {
    flock: PropTypes.instanceOf(Flock),
    labelColor: PropTypes.string,
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
    this._onLabelColorMaybeChanged(
      previousProps.labelColor,
      this.props.labelColor
    );
    this._featureManager.projection = this.props.projection;
  }

  componentDidMount() {
    if (this.props.layer) {
      setLayerSelectable(this.props.layer);
      setLayerTriggersTooltip(this.props.layer);
    }

    // Make sure that the projection is updated first, otherwise the UAVs will
    // be placed incorrectly for a split second (and UAVs that receive no
    // further updates will be misplaced permanently)
    this._featureManager.projection = this.props.projection;

    this._onFlockMaybeChanged(undefined, this.props.flock);
    this._onSelectionMaybeChanged(undefined, this.props.selection);
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

      oldFlock.uavsRemoved.detach(this.eventBindings.uavsRemoved);
      delete this.eventBindings.uavsRemoved;

      this._featureManager.removeAllFeatures();
    }

    if (newFlock) {
      this.eventBindings.uavsUpdated = newFlock.uavsUpdated.add(
        this._onUAVsUpdated
      );
      this.eventBindings.uavsRemoved = newFlock.uavsRemoved.add(
        this._onUAVsRemoved
      );

      // Pretend that all UAVs in the flock were updated now
      this._onUAVsUpdated(newFlock.getAllUAVs());
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
    let features;

    features = difference(newSelection, oldSelection)
      .map(getFeatureById)
      .filter(Boolean);
    for (const feature of features) {
      feature.selected = true;
    }

    features = difference(oldSelection, newSelection)
      .map(getFeatureById)
      .filter(Boolean);
    for (const feature of features) {
      feature.selected = false;
    }
  };

  /**
   * Function that checks whether the label color have changed and updates
   * the features accordingly.
   *
   * @param {Object} oldLabelColor The old label color.
   * @param {Object} newLabelColor The new label color.
   */
  _onLabelColorMaybeChanged = (oldLabelColor, newLabelColor) => {
    if (oldLabelColor === newLabelColor) {
      return;
    }

    const features = this._featureManager.getFeatureArray();
    for (const feature of features) {
      feature.labelColor = newLabelColor;
    }
  };

  /**
   * Event handler that is called when some UAVs were removed from the flock and
   * the layer should be re-drawn without these UAVs.
   *
   * @listens Flock#uavsRemoved
   * @param {UAV[]} uavs  the UAVs that should be removed
   */
  _onUAVsRemoved = (uavs) => {
    for (const uav of uavs) {
      this._featureManager.removeFeatureById(uav.id);
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
    for (const uav of uavs) {
      if (uav.lon === 0 && uav.lat === 0) {
        continue;
      }

      const feature = this._featureManager.createOrUpdateFeatureById(uav.id, [
        uav.lon,
        uav.lat,
      ]);

      // Set or update the heading of the feature
      if (uav.heading !== undefined) {
        feature.heading = uav.heading;
      }

      feature.status = getSingleUAVStatusLevel(uav);
      feature.labelColor = this.props.labelColor;
    }
  };
}

export default withLayer(ActiveUAVsLayerSource);
