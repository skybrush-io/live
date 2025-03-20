/**
 * @file OpenLayers interaction that ...
 */

import PropTypes from 'prop-types';
import React from 'react';
import { getPointResolution } from 'ol/proj';
import { Style } from 'ol/style';

import { interaction } from '@collmot/ol-react';

import * as Condition from '../conditions';
import { lonLatFromMapViewCoordinate } from '~/utils/geography';
import { takeoffTriangle } from '../layers/mission-info';

const PlaceTakeoffGrid = ({ takeoffGrid, updateHomePositions }) => {
  // const takeoffTriangleParameters = {
  //   fill: fill(Colors.markers.takeoff),
  //   points: 3,
  //   radius: 6,
  //   stroke: blackVeryThinOutline,
  // };

  // const takeoffTriangleWithDisplacement = (displacement) =>
  //   new Style({
  //     image: new RegularShape({ ...takeoffTriangleParameters, displacement }),
  //   });

  const tmpstyle = new Style({ image: takeoffTriangle });

  const takeoffTriangleWithDisplacement = (displacement) => {
    const sajt = tmpstyle.clone();
    sajt.getImage().setDisplacement(displacement);
    return sajt;
  };

  return (
    <interaction.Draw
      key='TakeoffGrid'
      type='Point'
      condition={Condition.primaryAction}
      // PERF: Generating a whole list of styles with displacements is
      //       probably not the best approach, maybe have a single style
      //       and a custom interaction that has a MultiPoint sketch feature?
      style={(f, r) => {
        const coords = f.getGeometry().getCoordinates();
        const scale = getPointResolution('EPSG:3857', 1, coords);
        return takeoffGrid.coordinates.map((displacement) =>
          takeoffTriangleWithDisplacement(
            displacement.map((d) => d * (1 / scale / r))
          )
        );
      }}
      onDrawEnd={(event) => {
        const rotation = event.target.getMap().getView().getRotation();
        const [cx, cy] = event.feature.getGeometry().getCoordinates();
        const scale = getPointResolution('EPSG:3857', 1, [cx, cy]);
        const [sr, cr] = [Math.sin(rotation), Math.cos(rotation)];
        updateHomePositions(
          takeoffGrid.coordinates
            .map(([dx, dy]) =>
              lonLatFromMapViewCoordinate([
                cx + (dx * cr + dy * -sr) / scale,
                cy + (dx * sr + dy * cr) / scale,
              ])
            )
            .map(([lon, lat]) => ({ lon, lat }))
        );
      }}
    />
  );
};

PlaceTakeoffGrid.propTypes = {
  takeoffGrid: PropTypes.object,
  updateHomePositions: PropTypes.func,
};

export default PlaceTakeoffGrid;
