import React from 'react';
import { connect } from 'react-redux';

import { Map } from '~/components/map';
import {
  layerComponents as defaultLayerComponent,
  LayerProps,
  type LayerConfig,
} from '~/components/map/layers';
import ShowInfoLayerPresentation, {
  convexHullPolygon,
  homePositionPoints,
  landingPositionPoints,
} from '~/components/map/layers/ShowInfoLayer';
import { Tool } from '~/components/map/tools';
import {
  getConvexHullOfShowInWorldCoordinates,
  getHomePositionsInWorldCoordinates,
  getLandingPositionsInWorldCoordinates,
} from '~/features/site-survey/selectors';
import { LayerType } from '~/model/layers';
import { getVisibleLayersInOrder } from '~/selectors/ordered';
import { RootState } from '~/store/reducers';
import { WorldCoordinate2D } from '~/utils/math';

// === Layers ===

type ShowInfoLayerProps = LayerProps & {
  convexHull?: WorldCoordinate2D[];
  homePositions?: (WorldCoordinate2D | undefined)[];
  landingPositions?: (WorldCoordinate2D | undefined)[];
  selection?: string[];
};

const ShowInfoLayer = (props: ShowInfoLayerProps) => {
  const { convexHull, homePositions, landingPositions, ...layerProps } = props;

  return (
    <ShowInfoLayerPresentation {...layerProps}>
      {...homePositionPoints(homePositions)}
      {...landingPositionPoints(landingPositions)}
      {/** TODO(vp): get selection working. */}
      {...convexHullPolygon(convexHull, [])}
    </ShowInfoLayerPresentation>
  );
};

const ConnectedShowInfoLayer = connect((state: RootState) => ({
  convexHull: getConvexHullOfShowInWorldCoordinates(state),
  homePositions: getHomePositionsInWorldCoordinates(state),
  landingPositions: getLandingPositionsInWorldCoordinates(state),
}))(ShowInfoLayer);

// === Map ===

const layerComponents = {
  ...defaultLayerComponent,
  [LayerType.MISSION_INFO]: ConnectedShowInfoLayer,
};

type SiteSurveyMapProps = {
  layers: LayerConfig['layers'];
};

const SiteSurveyMap = ({ layers }: SiteSurveyMapProps) => {
  return (
    <Map selectedTool={Tool.SELECT} layers={{ layers, layerComponents }}></Map>
  );
};

const ConnectedSiteSurveyMap = connect(
  // mapStateToProps
  (state: RootState) => ({
    layers: getVisibleLayersInOrder(state),
  })
)(SiteSurveyMap);

export default ConnectedSiteSurveyMap;
