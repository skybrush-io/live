import Collection from 'ol/Collection';
import React, { useCallback } from 'react';

import type OLEvent from 'ol/events/Event';
import type Feature from 'ol/Feature';
import type { DragBoxEvent } from 'ol/interaction/DragBox';
import type { ModifyEvent } from 'ol/interaction/Modify';
import VectorLayer from 'ol/layer/Vector';
import type Map from 'ol/Map';

// @ts-ignore
import { interaction, withMap } from '@collmot/ol-react';

import * as Condition from '~/components/map/conditions';
import { Tool } from '~/components/map/tools';
import { FeatureUpdateType } from '~/features/site-survey/actions';
import {
  getVisibleEditableLayers,
  isLayerVisibleAndSelectable,
} from '~/model/layers';
import { isFeatureModifiable } from '~/model/openlayers';
import { forwardCollectionChanges } from '~/utils/openlayers';
import SelectNearestFeature from './SelectNearestFeature';
import TransformFeatures, {
  type TransformFeaturesInteractionEvent,
} from './TransformFeatures';
import { BoxDragMode, FeatureSelectionOrActivationMode } from './types';

type Props = {
  map: Map;
  selectedTool: Tool;
  children?: React.ReactNode;
  getSelectedTransformableFeatures?: (map: Map) => Feature[];
  onBoxDragEnded?: (mode: BoxDragMode, event: DragBoxEvent) => void;
  onSingleFeatureSelected?: (
    mode: FeatureSelectionOrActivationMode,
    feature: Feature | undefined
  ) => void;
  updateModifiedFeatures?: (
    features: Feature[],
    options: { event: OLEvent; type: FeatureUpdateType }
  ) => void;
};

function useEventHandlers(props: Props) {
  const { onBoxDragEnded, updateModifiedFeatures } = props;

  const onAddFeaturesToSelection = useCallback(
    (event: DragBoxEvent) => {
      onBoxDragEnded?.('add', event);
    },
    [onBoxDragEnded]
  );
  const onRemoveFeaturesFromSelection = useCallback(
    (event: DragBoxEvent) => {
      onBoxDragEnded?.('remove', event);
    },
    [onBoxDragEnded]
  );
  const onSetSelectedFeatures = useCallback(
    (event: DragBoxEvent) => {
      onBoxDragEnded?.('set', event);
    },
    [onBoxDragEnded]
  );
  const onFeaturesModified = useCallback(
    (event: ModifyEvent) => {
      if (updateModifiedFeatures === undefined) {
        return;
      }

      const features = event.features.getArray();
      updateModifiedFeatures(features, { event, type: 'modify' });
    },
    [updateModifiedFeatures]
  );
  const onFeaturesTransformed = useCallback(
    (event: TransformFeaturesInteractionEvent) => {
      if (!event.hasMoved || updateModifiedFeatures === undefined) {
        return;
      }

      const features: Feature[] = event.features;
      updateModifiedFeatures(features, { event, type: 'transform' });
    },
    [updateModifiedFeatures]
  );

  return {
    onAddFeaturesToSelection,
    onFeaturesModified,
    onFeaturesTransformed,
    onRemoveFeaturesFromSelection,
    onSetSelectedFeatures,
  };
}

/**
 * Component that renders the active interactions of the map.
 */
const MapInteractions: React.FunctionComponent<Omit<Props, 'map'>> = withMap(
  (props: Props) => {
    const {
      children,
      getSelectedTransformableFeatures,
      onSingleFeatureSelected,
      selectedTool,
    } = props;
    const {
      onAddFeaturesToSelection,
      onFeaturesModified,
      onFeaturesTransformed,
      onRemoveFeaturesFromSelection,
      onSetSelectedFeatures,
    } = useEventHandlers(props);

    const interactions: React.ReactNode[] = [];

    // Common interactions that can be used regardless of the selected tool
    /* Alt + Shift + drag --> Rotate view */
    /* Alt + Shift + middle button drag --> Rotate and zoom view */
    interactions.push(
      <interaction.DragRotate
        key='DragRotate'
        condition={Condition.altShiftKeysOnly}
      />,
      <interaction.DragRotateAndZoom
        key='DragRotateAndZoom'
        condition={Condition.altShiftKeyAndMiddleMouseButton}
      />
    );

    if (selectedTool === Tool.PAN) {
      interactions.push(
        /* PAN mode | Ctrl/Cmd + Drag --> Box select features */
        <interaction.DragBox
          key='DragBox.setSelection'
          condition={Condition.platformModifierKeyOnly}
          onBoxEnd={onSetSelectedFeatures}
        />
      );
    }

    if (selectedTool === Tool.SELECT) {
      interactions.push(
        /* SELECT mode |
          click --> Select nearest feature
          Shift + Click --> Add nearest feature to selection
          PlatMod + Click --> Toggle nearest feature in selection
          Alt + Click --> Remove nearest feature from selection */
        <SelectNearestFeature
          key='SelectNearestFeature'
          activateCondition={Condition.doubleClick}
          addCondition={Condition.shiftKeyOnly}
          layers={isLayerVisibleAndSelectable}
          removeCondition={Condition.altKeyOnly}
          toggleCondition={Condition.platformModifierKeyOnly}
          threshold={16}
          onSelect={onSingleFeatureSelected}
        />,

        /* We cannot add "Drag --> Set selected features" here because it
         * interferes with the SelectNearestFeature interaction */

        /* SELECT mode | Shift + Drag --> Box add features to selection */
        <interaction.DragBox
          key='DragBox.addToSelection'
          condition={Condition.shiftKeyOnly}
          onBoxEnd={onAddFeaturesToSelection}
        />,

        /* SELECT mode | Alt + Drag --> Box remove features from selection */
        <interaction.DragBox
          key='DragBox.removeFromSelection'
          condition={Condition.altKeyOnly}
          onBoxEnd={onRemoveFeaturesFromSelection}
        />,

        /* SELECT mode |
           Drag a feature --> Move a feature to a new location
           Alt + Drag --> Rotate a feature.
         This must come last in order to ensure that it will get the
         chance to process events before DragBox so Alt+something will not
         start a drag-box when clicking on a selected feature */
        <TransformFeatures
          key='TransformFeatures'
          featureProvider={getSelectedTransformableFeatures}
          moveCondition={Condition.noModifierKeys}
          rotateCondition={Condition.altKeyOnly}
          onTransformEnd={onFeaturesTransformed}
        />
      );
    }

    if (selectedTool === Tool.ZOOM) {
      interactions.push(
        /* ZOOM mode | Drag --> Box zoom in */
        <interaction.DragZoom key='DragZoom.in' condition={Condition.always} />,

        /* ZOOM mode | Shift + Drag --> Box zoom out */
        <interaction.DragZoom
          key='DragZoom.out'
          out
          condition={Condition.shiftKeyOnly}
        />
      );
    }

    // NOTE:
    // The `Modify` interaction requires either a source or a feature collection,
    // but we'd like to have it act on multiple layers, so we create a new merged
    // (and filtered) collection, into which we forward the modifiable features
    // from both layers.
    // Having two separate interactions for the two layers would result in
    // multiple interaction points showing up simultaneously on the map if
    // features from different layers are close to each other.
    const modifiableFeaturesOfVisibleEditableLayers = new Collection<any>();
    for (const vel of getVisibleEditableLayers(props.map)) {
      // BaseLayer doesn't have a getSource() method.
      if (!(vel instanceof VectorLayer)) {
        continue;
      }

      const source = vel.getSource();
      if (!source) {
        continue;
      }

      const collection = source.getFeaturesCollection();
      if (!collection) {
        continue;
      }

      forwardCollectionChanges(
        collection,
        modifiableFeaturesOfVisibleEditableLayers,
        isFeatureModifiable
      );
    }

    if (selectedTool === Tool.EDIT_FEATURE) {
      interactions.push(
        <interaction.Modify
          key='EditFeature'
          features={modifiableFeaturesOfVisibleEditableLayers}
          onModifyEnd={onFeaturesModified}
        />
      );
    }

    /*
     * Tool.CUT_HOLE and Tool.EDIT_FEATURE are
     * handled in the FeaturesLayer component
     */

    return (
      <>
        {...interactions}
        {children}
      </>
    );
  }
);

export default MapInteractions;
