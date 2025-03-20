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
import memoizeOne from 'memoize-one';

/*
 * Memoized function that only recalculates the takeoff triangle styles if the
 * previous results would have an error of  and reuses them otherwise.
 */
const getTakeoffTriangleStyles = memoizeOne(
  (coordinates, resolution) => {
    console.log({ resolution });
    const triangleStyle = new Style({ image: takeoffTriangle });

    return coordinates.map((displacement) => {
      const style = triangleStyle.clone();
      style.getImage().setDisplacement(displacement.map((d) => d / resolution));
      return style;
    });
  },
  ([prevCoordinates, prevResolution], [nextCoordinates, nextResolution]) =>
    prevCoordinates === nextCoordinates &&
    Math.abs(prevResolution - nextResolution) < 1e-4
);

const PlaceTakeoffGrid = ({ takeoffGrid, updateHomePositions }) => (
  <interaction.Draw
    key='TakeoffGrid'
    type='Point'
    condition={Condition.primaryAction}
    // PERF: Generating a whole list of styles with displacements is
    //       probably not the best approach, maybe have a single style
    //       and a custom interaction that has a MultiPoint sketch feature?
    style={(feature, viewResolution) =>
      getTakeoffTriangleStyles(
        takeoffGrid.coordinates,
        getPointResolution(
          'EPSG:3857',
          viewResolution,
          feature.getGeometry().getCoordinates()
        )
      )
    }
    onDrawEnd={(event) => {
      const [cx, cy] = event.feature.getGeometry().getCoordinates();
      const pointResolution = getPointResolution('EPSG:3857', 1, [cx, cy]);
      const rotation = event.target.getMap().getView().getRotation();
      const [sr, cr] = [Math.sin(rotation), Math.cos(rotation)];
      updateHomePositions(
        takeoffGrid.coordinates
          .map(([dx, dy]) =>
            lonLatFromMapViewCoordinate([
              cx + (dx * cr + dy * -sr) / pointResolution,
              cy + (dx * sr + dy * cr) / pointResolution,
            ])
          )
          .map(([lon, lat]) => ({ lon, lat }))
      );
    }}
  />
);

PlaceTakeoffGrid.propTypes = {
  takeoffGrid: PropTypes.object,
  updateHomePositions: PropTypes.func,
};

export default PlaceTakeoffGrid;
