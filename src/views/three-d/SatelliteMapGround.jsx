import PropTypes from 'prop-types';
import React, { memo, useMemo } from 'react';
import { connect } from 'react-redux';
import SunCalc from 'suncalc';

import { objectToString } from '~/aframe/utils';
import { LayerType } from '~/model/layers';
import { Source } from '~/model/sources';
import {
  getOutdoorShowOrigin,
  getOutdoorShowToWorldCoordinateSystemTransformationObject,
  hasShowOrigin,
  isShowIndoor,
} from '~/features/show/selectors';
import { getFlatEarthCoordinateTransformer } from '~/selectors/map';

const TILE_ZOOM = 19;
const TILE_RADIUS = 2;
const SATELLITE_SOURCES = new Set([
  Source.ESRI_WORLD_IMAGERY,
  Source.MAPBOX.SATELLITE,
  Source.MAPTILER.SATELLITE,
  Source.MAPTILER.HYBRID,
  Source.GOOGLE.SATELLITE,
  Source.BING.AERIAL_WITH_LABELS,
]);

const getBaseLayer = (layers) =>
  layers.order
    .map((layerId) => layers.byId[layerId])
    .find((layer) => layer?.type === LayerType.BASE);

const tileUrl = (x, y, zoom) =>
  `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}`;

const lonLatToTile = ([lon, lat], zoom) => {
  const n = 2 ** zoom;
  const clampedLat = Math.max(-85.05112878, Math.min(85.05112878, lat));
  const latRad = (clampedLat * Math.PI) / 180;

  return {
    x: Math.floor(((lon + 180) / 360) * n),
    y: Math.floor(
      ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
        n
    ),
  };
};

const tileToLonLat = (x, y, zoom) => {
  const n = 2 ** zoom;
  const lon = (x / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / n)));
  return [lon, (latRad * 180) / Math.PI];
};

const localPointFromLonLat = (transformer, lonLat) => {
  const [x, y] = transformer.fromLonLat(lonLat);
  return [x, transformer.type === 'nwu' ? y : -y];
};

const getTileCorners = (transformer, x, y, zoom) => ({
  nw: localPointFromLonLat(transformer, tileToLonLat(x, y, zoom)),
  ne: localPointFromLonLat(transformer, tileToLonLat(x + 1, y, zoom)),
  sw: localPointFromLonLat(transformer, tileToLonLat(x, y + 1, zoom)),
  se: localPointFromLonLat(transformer, tileToLonLat(x + 1, y + 1, zoom)),
});

const distance = ([x1, y1], [x2, y2]) => Math.hypot(x2 - x1, y2 - y1);

const angleBetween = ([x1, y1], [x2, y2]) =>
  (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;

const isCurrentlyDark = (origin, fallbackLighting) => {
  if (!Array.isArray(origin)) {
    return fallbackLighting === 'dark';
  }

  const [lon, lat] = origin;
  const sun = SunCalc.getPosition(new Date(), lat, lon);

  return fallbackLighting === 'dark' || sun.altitude < -0.05;
};

const createSatelliteTiles = ({ origin, transformer }) => {
  const centerTile = lonLatToTile(origin, TILE_ZOOM);
  const tiles = [];
  const worldTileCount = 2 ** TILE_ZOOM;

  for (let dy = -TILE_RADIUS; dy <= TILE_RADIUS; dy++) {
    for (let dx = -TILE_RADIUS; dx <= TILE_RADIUS; dx++) {
      const x = (centerTile.x + dx + worldTileCount) % worldTileCount;
      const y = centerTile.y + dy;

      if (y < 0 || y >= worldTileCount) {
        continue;
      }

      const corners = getTileCorners(transformer, x, y, TILE_ZOOM);
      const center = [
        (corners.nw[0] + corners.ne[0] + corners.sw[0] + corners.se[0]) / 4,
        (corners.nw[1] + corners.ne[1] + corners.sw[1] + corners.se[1]) / 4,
      ];

      tiles.push({
        key: `${TILE_ZOOM}/${x}/${y}`,
        url: tileUrl(x, y, TILE_ZOOM),
        center,
        width: distance(corners.nw, corners.ne),
        height: distance(corners.nw, corners.sw),
        rotation: angleBetween(corners.nw, corners.ne),
      });
    }
  }

  return tiles;
};

const SatelliteMapGround = ({
  currentSource,
  enabled,
  lighting,
  origin,
  transformer,
}) => {
  const shouldRender = Boolean(
    enabled &&
      transformer &&
      Array.isArray(origin) &&
      SATELLITE_SOURCES.has(currentSource)
  );

  const dark = useMemo(
    () => isCurrentlyDark(origin, lighting),
    [lighting, origin]
  );

  const tiles = useMemo(
    () => (shouldRender ? createSatelliteTiles({ origin, transformer }) : []),
    [origin, shouldRender, transformer]
  );

  if (!shouldRender || !tiles.length) {
    return null;
  }

  return (
    <>
      {tiles.map((tile) => (
        <a-plane
          key={tile.key}
          position={`${tile.center[0]} ${tile.center[1]} 0.015`}
          rotation={`0 0 ${tile.rotation}`}
          width={tile.width * 1.01}
          height={tile.height * 1.01}
          material={objectToString({
            shader: 'flat',
            src: tile.url,
            color: dark ? '#536174' : '#fff',
            side: 'double',
          })}
        />
      ))}
      {dark && (
        <a-plane
          position='0 0 0.02'
          width='10000'
          height='10000'
          material={objectToString({
            shader: 'flat',
            color: '#061024',
            opacity: 0.42,
            transparent: true,
            depthWrite: false,
            side: 'double',
          })}
        />
      )}
    </>
  );
};

SatelliteMapGround.propTypes = {
  currentSource: PropTypes.string,
  enabled: PropTypes.bool,
  lighting: PropTypes.oneOf(['dark', 'light']),
  origin: PropTypes.arrayOf(PropTypes.number),
  transformer: PropTypes.object,
};

export default connect((state) => {
  const baseLayer = getBaseLayer(state.map.layers);
  const showTransformer =
    getOutdoorShowToWorldCoordinateSystemTransformationObject(state);
  const useShowCoordinateFrame =
    !isShowIndoor(state) && hasShowOrigin(state) && showTransformer;

  return {
    currentSource: baseLayer?.parameters?.source,
    origin: useShowCoordinateFrame
      ? getOutdoorShowOrigin(state)
      : state.map.origin.position,
    transformer: useShowCoordinateFrame
      ? showTransformer
      : getFlatEarthCoordinateTransformer(state),
  };
})(memo(SatelliteMapGround));
