/**
 * @file OpenLayers vector layer source that contains all the active UAVs
 * currently known to the server.
 */

// @ts-expect-error: untyped
import { source, withLayer } from '@collmot/ol-react';
import difference from 'lodash-es/difference';
import includes from 'lodash-es/includes';
import type Point from 'ol/geom/Point';
import type Layer from 'ol/layer/Layer';
import type VectorSource from 'ol/source/Vector';
import React from 'react';

import { getSingleUAVStatusLevel } from '~/features/uavs/selectors';
import type Flock from '~/model/flock';
import { uavIdToGlobalId } from '~/model/identifiers';
import { setLayerSelectable, setLayerTriggersTooltip } from '~/model/layers';
import type UAV from '~/model/uav';

import FeatureManager from '../FeatureManager';
import UAVFeature from '../features/UAVFeature';

export type ActiveUAVsLayerSourceProps = {
  flock?: Flock;
  labelColor: string;
  layer?: Layer;
  projection?: (coords: number[]) => number[];
  selection: string[];
  labelHidden?: boolean;
  scale: number;
};

type EventBindings = {
  uavsUpdated?: any;
  uavsRemoved?: any;
};

type OLReactSource = {
  source: VectorSource<UAVFeature>;
};

/**
 * OpenLayers vector layer source that contains all the active UAVs
 * currently known to the server.
 *
 * This layer source can be passed to an OpenLayers layer as a source to
 * show all the active UAVs on top of the map.
 */
class ActiveUAVsLayerSource extends React.Component<ActiveUAVsLayerSourceProps> {
  eventBindings: EventBindings;
  _featureManager: FeatureManager<UAVFeature>;
  _sourceRef: OLReactSource | null;

  constructor(props: ActiveUAVsLayerSourceProps) {
    super(props);

    this._sourceRef = null;

    this._featureManager = new FeatureManager();
    this._featureManager.featureFactory = this._createFeatureFactory();
    this._featureManager.featureIdFunction = uavIdToGlobalId;
    this._featureManager.featureAdded.add(this._onFeatureAdded);

    this.eventBindings = {};
  }

  componentDidUpdate(previousProps: ActiveUAVsLayerSourceProps) {
    this._onFlockMaybeChanged(previousProps.flock, this.props.flock);
    this._onSelectionMaybeChanged(
      previousProps.selection,
      this.props.selection
    );
    this._onLabelColorMaybeChanged(
      previousProps.labelColor,
      this.props.labelColor
    );
    this._onScaleMaybeChanged(previousProps.scale, this.props.scale);
    this._featureManager.projection = this.props.projection;
    if (this.props.labelHidden !== previousProps.labelHidden) {
      this._featureManager.featureFactory = this._createFeatureFactory();
    }
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
    this._onSelectionMaybeChanged([], this.props.selection);
    this._onScaleMaybeChanged(0, this.props.scale);
  }

  componentWillUnmount() {
    this._onFlockMaybeChanged(this.props.flock, undefined);
    this._onSelectionMaybeChanged(this.props.selection, []);

    this._featureManager.projection = undefined;
  }

  render() {
    return <source.Vector ref={this._assignSourceRef} />;
  }

  _assignSourceRef = (value: OLReactSource) => {
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
   * Creates the feature factory for the feature manager.
   */
  _createFeatureFactory = () => (id: string, geom: Point) =>
    new UAVFeature(id, geom, this.props.labelHidden);

  /**
   * Event handler that is called when a new feature was added by the feature
   * manager. This happens when we see a new UAV for the first time.
   *
   * @param feature  the feature that was added
   */
  _onFeatureAdded = (feature: UAVFeature) => {
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
   * @param oldFlock  the old flock associated to the layer
   * @param newFlock  the new flock associated to the layer
   */
  _onFlockMaybeChanged = (
    oldFlock: Flock | undefined,
    newFlock: Flock | undefined
  ) => {
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
   * @param oldSelection  the old selection of UAVs
   * @param newSelection  the new selection of UAVs
   */
  _onSelectionMaybeChanged = (
    oldSelection: string[],
    newSelection: string[]
  ) => {
    if (!this._sourceRef) {
      return;
    }

    const { source } = this._sourceRef;
    const getFeatureById = source.getFeatureById.bind(source);
    let features: Array<UAVFeature | null>;

    features = difference(newSelection, oldSelection)
      .map(getFeatureById)
      .filter(Boolean);
    for (const feature of features) {
      // We know it's not null because we filtered above
      (feature as UAVFeature).selected = true;
    }

    features = difference(oldSelection, newSelection)
      .map(getFeatureById)
      .filter(Boolean);
    for (const feature of features) {
      // We know it's not null because we filtered above
      (feature as UAVFeature).selected = false;
    }
  };

  /**
   * Function that checks whether the label color have changed and updates
   * the features accordingly.
   *
   * @param oldLabelColor The old label color.
   * @param newLabelColor The new label color.
   */
  _onLabelColorMaybeChanged = (
    oldLabelColor: string,
    newLabelColor: string
  ) => {
    if (oldLabelColor === newLabelColor) {
      return;
    }

    const features = this._featureManager.getFeatureArray();
    for (const feature of features) {
      feature.labelColor = newLabelColor;
    }
  };

  /**
   * Function that checks whether the scale of the UAV icons has changed and
   * updates the features accordingly.
   *
   * @param oldScale The old scale.
   * @param newScale The new scale.
   */
  _onScaleMaybeChanged = (oldScale: number, newScale: number) => {
    if (oldScale === newScale) {
      return;
    }

    const features = this._featureManager.getFeatureArray();
    for (const feature of features) {
      feature.scale = newScale;
    }
  };

  /**
   * Event handler that is called when some UAVs were removed from the flock and
   * the layer should be re-drawn without these UAVs.
   *
   * @listens Flock#uavsRemoved
   * @param uavs  the UAVs that should be removed
   */
  _onUAVsRemoved = (uavs: UAV[]) => {
    for (const uav of uavs) {
      this._featureManager.removeFeatureById(uav.id);
    }
  };

  /**
   * Event handler that is called when the status of some of the UAVs has
   * changed in the flock and the layer should be re-drawn.
   *
   * @listens Flock#uavsUpdated
   * @param uavs  the UAVs that should be refreshed
   */
  _onUAVsUpdated = (uavs: UAV[]) => {
    for (const uav of uavs) {
      if (uav.lon === 0 && uav.lat === 0) {
        continue;
      }

      if (uav.lon === undefined || uav.lat === undefined) {
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
      feature.scale = this.props.scale;
    }
  };
}

export default withLayer(ActiveUAVsLayerSource);
